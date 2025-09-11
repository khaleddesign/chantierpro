import { BaseIntegration, IntegrationConfig, IntegrationResponse } from './base';
import { prisma } from '@/lib/prisma';

/**
 * Interface pour les données comptables standardisées
 */
export interface ComptaClient {
  code: string;
  nom: string;
  adresse: string;
  codePostal: string;
  ville: string;
  siret?: string;
  numeroTVA?: string;
  modeReglement?: string;
  delaiReglement?: number;
}

export interface ComptaFacture {
  numero: string;
  date: string;
  clientCode: string;
  montantHT: number;
  montantTTC: number;
  tauxTVA: number;
  lignes: ComptaLigneFacture[];
  statut: 'BROUILLON' | 'ENVOYEE' | 'PAYEE' | 'ANNULEE';
  dateEcheance?: string;
  modeReglement?: string;
  reference?: string;
}

export interface ComptaLigneFacture {
  designation: string;
  quantite: number;
  prixUnitaire: number;
  montantHT: number;
  tauxTVA: number;
  compteComptable?: string;
}

export interface ComptaEcriture {
  date: string;
  libelle: string;
  journal: string;
  pieceComptable: string;
  lignes: ComptaLigneEcriture[];
}

export interface ComptaLigneEcriture {
  compteComptable: string;
  libelle: string;
  debit?: number;
  credit?: number;
  analytique?: string;
}

/**
 * Intégration comptabilité française
 */
export class ComptabiliteIntegration extends BaseIntegration {
  constructor(config: IntegrationConfig) {
    super({
      rateLimitRequests: 50,
      rateLimitWindow: 3600,
      timeout: 15000,
      retryAttempts: 3,
      ...config
    });
  }

  async testConnection(): Promise<IntegrationResponse<boolean>> {
    return await this.makeRequest('GET', '/api/ping');
  }

  async syncData(): Promise<IntegrationResponse<any>> {
    try {
      // Synchronisation bidirectionnelle
      const [clientsSync, facturesSync] = await Promise.all([
        this.syncClients(),
        this.syncFactures()
      ]);

      return {
        success: clientsSync.success && facturesSync.success,
        data: {
          clients: clientsSync.data,
          factures: facturesSync.data
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur synchronisation'
      };
    }
  }

  /**
   * Synchronisation des clients vers le logiciel comptable
   */
  async syncClients(): Promise<IntegrationResponse<{ created: number; updated: number }>> {
    try {
      // Récupération des clients ChantierPro
      const clients = await prisma.user.findMany({
        where: { role: 'CLIENT' },
        select: {
          id: true,
          nom: true,
          name: true,
          email: true,
          company: true,
          address: true,
          codePostal: true,
          ville: true,
          siret: true,
          phone: true,
          createdAt: true,
          updatedAt: true
        }
      });

      let created = 0;
      let updated = 0;

      // Envoi de chaque client vers la comptabilité
      for (const client of clients) {
        const comptaClient: ComptaClient = {
          code: this.generateClientCode(client),
          nom: client.company || client.nom || client.name || 'Client',
          adresse: client.address || '',
          codePostal: client.codePostal || '',
          ville: client.ville || '',
          siret: client.siret || undefined,
          numeroTVA: this.generateNumeroTVA(client.siret),
          modeReglement: 'VIREMENT',
          delaiReglement: 30
        };

        // Vérifier si le client existe déjà
        const existingCheck = await this.makeRequest('GET', `/api/clients/${comptaClient.code}`);
        
        if (existingCheck.success && existingCheck.data) {
          // Mise à jour
          const updateResult = await this.makeRequest('PUT', `/api/clients/${comptaClient.code}`, comptaClient);
          if (updateResult.success) updated++;
        } else {
          // Création
          const createResult = await this.makeRequest('POST', '/api/clients', comptaClient);
          if (createResult.success) created++;
        }

        // Pause pour respecter le rate limiting
        await this.delay(100);
      }

      return {
        success: true,
        data: { created, updated }
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur sync clients'
      };
    }
  }

  /**
   * Synchronisation des factures vers le logiciel comptable
   */
  async syncFactures(): Promise<IntegrationResponse<{ created: number; updated: number }>> {
    try {
      // Récupération des factures ChantierPro (devis acceptés)
      const factures = await prisma.devis.findMany({
        where: { 
          statut: { in: ['ACCEPTE', 'PAYE'] },
          type: 'FACTURE'
        },
        include: {
          client: true,
          ligneDevis: true,
          paiements: true
        },
        orderBy: { dateCreation: 'desc' },
        take: 100 // Limiter pour éviter les timeouts
      });

      let created = 0;
      let updated = 0;

      for (const facture of factures) {
        const comptaFacture: ComptaFacture = {
          numero: facture.numero,
          date: facture.dateCreation.toISOString().split('T')[0],
          clientCode: this.generateClientCode(facture.client),
          montantHT: facture.totalHT || facture.montant / (1 + (facture.tva / 100)),
          montantTTC: facture.totalTTC || facture.montant,
          tauxTVA: facture.tva,
          statut: this.mapStatutFacture(facture.statut),
          dateEcheance: facture.dateEcheance.toISOString().split('T')[0],
          modeReglement: 'VIREMENT',
          reference: facture.id,
          lignes: facture.ligneDevis.map(ligne => ({
            designation: ligne.description,
            quantite: ligne.quantite,
            prixUnitaire: ligne.prixUnit,
            montantHT: ligne.total,
            tauxTVA: facture.tva,
            compteComptable: this.getCompteComptableBTP(ligne.description)
          }))
        };

        // Vérifier si la facture existe
        const existingCheck = await this.makeRequest('GET', `/api/factures/${comptaFacture.numero}`);
        
        if (existingCheck.success && existingCheck.data) {
          // Mise à jour
          const updateResult = await this.makeRequest('PUT', `/api/factures/${comptaFacture.numero}`, comptaFacture);
          if (updateResult.success) updated++;
        } else {
          // Création
          const createResult = await this.makeRequest('POST', '/api/factures', comptaFacture);
          if (createResult.success) created++;
        }

        await this.delay(150);
      }

      return {
        success: true,
        data: { created, updated }
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur sync factures'
      };
    }
  }

  /**
   * Export des écritures comptables pour un chantier
   */
  async exportEcrituresChantier(chantierId: string): Promise<IntegrationResponse<ComptaEcriture[]>> {
    try {
      const chantier = await prisma.chantier.findUnique({
        where: { id: chantierId },
        include: {
          client: true,
          devis: {
            include: {
              ligneDevis: true,
              paiements: true
            }
          }
        }
      });

      if (!chantier) {
        return {
          success: false,
          error: 'Chantier non trouvé'
        };
      }

      const ecritures: ComptaEcriture[] = [];

      // Écriture de vente pour chaque facture
      for (const devis of chantier.devis.filter(d => d.type === 'FACTURE' && d.statut === 'ACCEPTE')) {
        const ecritureVente: ComptaEcriture = {
          date: devis.dateCreation.toISOString().split('T')[0],
          libelle: `Facture ${devis.numero} - ${chantier.nom}`,
          journal: 'VTE',
          pieceComptable: devis.numero,
          lignes: [
            // Débit client
            {
              compteComptable: '411000',
              libelle: `Client ${chantier.client.company || chantier.client.nom}`,
              debit: devis.totalTTC || devis.montant
            },
            // Crédit ventes
            ...devis.ligneDevis.map(ligne => ({
              compteComptable: this.getCompteComptableBTP(ligne.description),
              libelle: ligne.description,
              credit: ligne.total
            })),
            // Crédit TVA
            {
              compteComptable: '445571',
              libelle: 'TVA collectée',
              credit: (devis.totalTTC || devis.montant) - (devis.totalHT || devis.montant / (1 + devis.tva / 100))
            }
          ]
        };

        ecritures.push(ecritureVente);

        // Écritures de règlement
        for (const paiement of devis.paiements) {
          const ecritureReglement: ComptaEcriture = {
            date: paiement.datePaiement.toISOString().split('T')[0],
            libelle: `Règlement facture ${devis.numero}`,
            journal: 'BQ1',
            pieceComptable: paiement.reference || `REG${devis.numero}`,
            lignes: [
              {
                compteComptable: '512000',
                libelle: 'Banque',
                debit: paiement.montant
              },
              {
                compteComptable: '411000',
                libelle: `Client ${chantier.client.company || chantier.client.nom}`,
                credit: paiement.montant
              }
            ]
          };

          ecritures.push(ecritureReglement);
        }
      }

      // Export vers le logiciel comptable
      const exportResult = await this.makeRequest('POST', '/api/ecritures/batch', {
        ecritures,
        validation: true
      });

      return {
        success: exportResult.success,
        data: ecritures,
        error: exportResult.error
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur export écritures'
      };
    }
  }

  /**
   * Import des données comptables (balance, grand livre)
   */
  async importDonneesComptables(dateDebut: string, dateFin: string): Promise<IntegrationResponse<any>> {
    try {
      const [balanceResult, grandLivreResult] = await Promise.all([
        this.makeRequest('GET', `/api/balance?dateDebut=${dateDebut}&dateFin=${dateFin}`),
        this.makeRequest('GET', `/api/grand-livre?dateDebut=${dateDebut}&dateFin=${dateFin}&comptes=411000,701000,445571`)
      ]);

      if (!balanceResult.success || !grandLivreResult.success) {
        return {
          success: false,
          error: 'Erreur récupération données comptables'
        };
      }

      // Stockage en cache pour analyse
      await this.cache.set(`compta_balance_${dateDebut}_${dateFin}`, balanceResult.data, 24 * 60 * 60 * 1000);
      await this.cache.set(`compta_grand_livre_${dateDebut}_${dateFin}`, grandLivreResult.data, 24 * 60 * 60 * 1000);

      return {
        success: true,
        data: {
          balance: balanceResult.data,
          grandLivre: grandLivreResult.data
        }
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur import données'
      };
    }
  }

  // Méthodes utilitaires privées
  private generateClientCode(client: any): string {
    // Format: C + SIRET(6 premiers) ou C + ID(6 premiers)
    const base = client.siret ? client.siret.substring(0, 6) : client.id.substring(0, 6);
    return `C${base.toUpperCase()}`;
  }

  private generateNumeroTVA(siret?: string): string | undefined {
    if (!siret || siret.length < 14) return undefined;
    
    // Calcul simplifié du numéro de TVA intracommunautaire
    const siren = siret.substring(0, 9);
    const key = (12 + 3 * (parseInt(siren) % 97)) % 97;
    return `FR${key.toString().padStart(2, '0')}${siren}`;
  }

  private mapStatutFacture(statut: string): ComptaFacture['statut'] {
    const mapping: Record<string, ComptaFacture['statut']> = {
      'BROUILLON': 'BROUILLON',
      'ENVOYE': 'ENVOYEE',
      'ACCEPTE': 'ENVOYEE',
      'PAYE': 'PAYEE',
      'REFUSE': 'ANNULEE',
      'ANNULE': 'ANNULEE'
    };
    return mapping[statut] || 'BROUILLON';
  }

  private getCompteComptableBTP(description: string): string {
    const desc = description.toLowerCase();
    
    // Mapping des prestations BTP vers les comptes comptables
    if (desc.includes('maçonnerie') || desc.includes('gros œuvre')) return '701100';
    if (desc.includes('plomberie') || desc.includes('sanitaire')) return '701200';
    if (desc.includes('électricité') || desc.includes('électrique')) return '701300';
    if (desc.includes('peinture') || desc.includes('décoration')) return '701400';
    if (desc.includes('carrelage') || desc.includes('revêtement')) return '701500';
    if (desc.includes('menuiserie') || desc.includes('boiserie')) return '701600';
    if (desc.includes('toiture') || desc.includes('couverture')) return '701700';
    if (desc.includes('isolation') || desc.includes('thermique')) return '701800';
    if (desc.includes('terrassement') || desc.includes('vrd')) return '701900';
    
    // Compte générique pour les autres prestations
    return '701000';
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Configuration spécifique pour différents logiciels comptables
 */
export const ComptabiliteConfigs = {
  sage: {
    baseUrl: 'https://api.sage.com/v2',
    version: '2.0',
    timeout: 20000,
    rateLimitRequests: 100,
    rateLimitWindow: 3600
  },
  
  ciel: {
    baseUrl: 'https://api.ciel.com/v1',
    version: '1.0', 
    timeout: 15000,
    rateLimitRequests: 50,
    rateLimitWindow: 3600
  },
  
  quadra: {
    baseUrl: 'https://api.quadracompta.com/v1',
    version: '1.0',
    timeout: 10000,
    rateLimitRequests: 30,
    rateLimitWindow: 3600
  },
  
  ebp: {
    baseUrl: 'https://api.ebp.com/compta/v1',
    version: '1.0',
    timeout: 15000,
    rateLimitRequests: 60,
    rateLimitWindow: 3600
  }
};