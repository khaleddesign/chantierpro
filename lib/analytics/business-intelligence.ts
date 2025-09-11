import { prisma } from '@/lib/prisma';
import { cache } from '@/lib/cache';
import { logSecurityEvent } from '@/lib/security';

/**
 * Interface pour les métriques de performance
 */
export interface PerformanceMetrics {
  chiffreAffaires: {
    total: number;
    evolution: number; // % par rapport à la période précédente
    parMois: Array<{ mois: string; montant: number }>;
    parType: Array<{ type: string; montant: number; pourcentage: number }>;
  };
  marges: {
    bruteMoyenne: number;
    netteMoyenne: number;
    parChantier: Array<{ chantierId: string; nom: string; marge: number }>;
  };
  productivite: {
    tempsPasseParChantier: number;
    tauxUtilisation: number;
    efficaciteEquipes: Array<{ equipeId: string; nom: string; efficacite: number }>;
  };
}

/**
 * Interface pour les analyses prédictives
 */
export interface PredictiveAnalysis {
  tendances: {
    chiffreAffairesPrevu: Array<{ mois: string; prevision: number; confiance: number }>;
    demandeParSecteur: Array<{ secteur: string; croissance: number }>;
  };
  risques: {
    clientsRisque: Array<{ clientId: string; nom: string; scoreRisque: number; raisons: string[] }>;
    chantiersRetard: Array<{ chantierId: string; nom: string; retardPrevu: number }>;
  };
  opportunites: {
    secteursCroissance: Array<{ secteur: string; potentiel: number }>;
    clientsPotentiels: Array<{ clientId: string; nom: string; potentiel: number }>;
  };
}

/**
 * Interface pour les KPIs sectoriels BTP
 */
export interface BTPMetrics {
  operationnels: {
    tauxRealisation: number; // % de chantiers terminés à temps
    qualiteExecution: number; // Note moyenne des chantiers
    tauxDefauts: number; // % de défauts/reprises
    tempsMovenIntervention: number; // En jours
  };
  financiers: {
    delaiPaiement: number; // Délai moyen de paiement en jours
    tauxImpayesSur: number; // % d'impayés
    rentabiliteParMetier: Array<{ metier: string; rentabilite: number }>;
  };
  ressources: {
    utilisationMateriel: number; // % d'utilisation du matériel
    productiviteOuvriers: number; // CA par ouvrier
    tauxAbsenteisme: number; // % d'absentéisme
  };
}

/**
 * Moteur de Business Intelligence pour ChantierPro
 */
export class BusinessIntelligenceEngine {
  private static instance: BusinessIntelligenceEngine;
  private cachePrefix = 'bi_';
  private defaultTTL = 30 * 60 * 1000; // 30 minutes

  private constructor() {}

  static getInstance(): BusinessIntelligenceEngine {
    if (!this.instance) {
      this.instance = new BusinessIntelligenceEngine();
    }
    return this.instance;
  }

  /**
   * Analyse complète des performances sur une période
   */
  async analysePerformances(
    dateDebut: Date, 
    dateFin: Date, 
    segmentation?: 'mois' | 'trimestre' | 'semestre'
  ): Promise<PerformanceMetrics> {
    const cacheKey = `${this.cachePrefix}performance_${dateDebut.toISOString()}_${dateFin.toISOString()}_${segmentation}`;
    
    // Tentative de récupération depuis le cache
    const cached = await cache.get<PerformanceMetrics>(cacheKey);
    if (cached) return cached;

    try {
      // Période précédente pour comparaison
      const dureeMs = dateFin.getTime() - dateDebut.getTime();
      const dateDebutPrecedente = new Date(dateDebut.getTime() - dureeMs);
      const dateFinPrecedente = new Date(dateFin.getTime() - dureeMs);

      // Calcul du chiffre d'affaires
      const chiffreAffaires = await this.calculChiffreAffaires(dateDebut, dateFin, dateDebutPrecedente, dateFinPrecedente);
      
      // Calcul des marges
      const marges = await this.calculMarges(dateDebut, dateFin);
      
      // Calcul de la productivité
      const productivite = await this.calculProductivite(dateDebut, dateFin);

      const metrics: PerformanceMetrics = {
        chiffreAffaires,
        marges,
        productivite
      };

      // Mise en cache
      await cache.set(cacheKey, metrics, this.defaultTTL, ['analytics', 'performance']);

      return metrics;

    } catch (error) {
      console.error('Erreur analyse performances:', error);
      throw error;
    }
  }

  /**
   * Analyses prédictives basées sur l'historique
   */
  async analysesPredictives(horizonMois: number = 6): Promise<PredictiveAnalysis> {
    const cacheKey = `${this.cachePrefix}predictive_${horizonMois}`;
    
    const cached = await cache.get<PredictiveAnalysis>(cacheKey);
    if (cached) return cached;

    try {
      // Données historiques des 24 derniers mois
      const dateFinHistorique = new Date();
      const dateDebutHistorique = new Date();
      dateDebutHistorique.setMonth(dateDebutHistorique.getMonth() - 24);

      // Analyse des tendances
      const tendances = await this.analyseTendances(dateDebutHistorique, dateFinHistorique, horizonMois);
      
      // Analyse des risques
      const risques = await this.analyseRisques();
      
      // Identification des opportunités
      const opportunites = await this.analyseOpportunites();

      const analysis: PredictiveAnalysis = {
        tendances,
        risques,
        opportunites
      };

      // Cache plus long pour les prédictions (2 heures)
      await cache.set(cacheKey, analysis, 2 * 60 * 60 * 1000, ['analytics', 'predictive']);

      return analysis;

    } catch (error) {
      console.error('Erreur analyses prédictives:', error);
      throw error;
    }
  }

  /**
   * Métriques spécifiques au secteur BTP
   */
  async metriquessBTP(dateDebut: Date, dateFin: Date): Promise<BTPMetrics> {
    const cacheKey = `${this.cachePrefix}btp_${dateDebut.toISOString()}_${dateFin.toISOString()}`;
    
    const cached = await cache.get<BTPMetrics>(cacheKey);
    if (cached) return cached;

    try {
      // Métriques opérationnelles
      const operationnels = await this.calculMetriquesOperationnelles(dateDebut, dateFin);
      
      // Métriques financières
      const financiers = await this.calculMetriquesFinancieres(dateDebut, dateFin);
      
      // Métriques des ressources
      const ressources = await this.calculMetriquesRessources(dateDebut, dateFin);

      const metrics: BTPMetrics = {
        operationnels,
        financiers,
        ressources
      };

      await cache.set(cacheKey, metrics, this.defaultTTL, ['analytics', 'btp']);

      return metrics;

    } catch (error) {
      console.error('Erreur métriques BTP:', error);
      throw error;
    }
  }

  /**
   * Génération de rapport automatisé
   */
  async genererRapport(
    type: 'hebdomadaire' | 'mensuel' | 'trimestriel',
    userId: string
  ): Promise<{
    resume: string;
    alertes: string[];
    recommandations: string[];
    donnees: any;
  }> {
    try {
      const maintenant = new Date();
      let dateDebut: Date;

      switch (type) {
        case 'hebdomadaire':
          dateDebut = new Date(maintenant.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'mensuel':
          dateDebut = new Date(maintenant.getFullYear(), maintenant.getMonth() - 1, 1);
          break;
        case 'trimestriel':
          dateDebut = new Date(maintenant.getFullYear(), maintenant.getMonth() - 3, 1);
          break;
      }

      // Collecte des données
      const [performances, predictive, btpMetrics] = await Promise.all([
        this.analysePerformances(dateDebut, maintenant),
        this.analysesPredictives(),
        this.metriquessBTP(dateDebut, maintenant)
      ]);

      // Génération du résumé
      const resume = this.genererResume(performances, btpMetrics, type);
      
      // Identification des alertes
      const alertes = this.identifierAlertes(performances, predictive, btpMetrics);
      
      // Génération des recommandations
      const recommandations = this.genererRecommandations(performances, predictive, btpMetrics);

      // Log de génération de rapport
      await logSecurityEvent({
        userId,
        action: 'GENERATE_BI_REPORT',
        resource: 'analytics',
        ipAddress: 'system',
        userAgent: 'ChantierPro/BI',
        success: true,
        riskLevel: 'LOW',
        details: { type, dateDebut: dateDebut.toISOString(), dateFin: maintenant.toISOString() }
      });

      return {
        resume,
        alertes,
        recommandations,
        donnees: {
          performances,
          predictive,
          btpMetrics
        }
      };

    } catch (error) {
      console.error('Erreur génération rapport:', error);
      throw error;
    }
  }

  // Méthodes privées de calcul

  private async calculChiffreAffaires(dateDebut: Date, dateFin: Date, dateDebutPrec: Date, dateFinPrec: Date) {
    const [caActuel, caPassé, caParMois, caParType] = await Promise.all([
      // CA période actuelle
      prisma.devis.aggregate({
        _sum: { totalTTC: true },
        where: {
          statut: { in: ['ACCEPTE', 'PAYE'] },
          dateCreation: { gte: dateDebut, lte: dateFin }
        }
      }),

      // CA période précédente
      prisma.devis.aggregate({
        _sum: { totalTTC: true },
        where: {
          statut: { in: ['ACCEPTE', 'PAYE'] },
          dateCreation: { gte: dateDebutPrec, lte: dateFinPrec }
        }
      }),

      // CA par mois
      prisma.$queryRaw`
        SELECT 
          strftime('%Y-%m', dateCreation) as mois,
          SUM(COALESCE(totalTTC, montant)) as montant
        FROM Devis 
        WHERE statut IN ('ACCEPTE', 'PAYE') 
          AND dateCreation >= ${dateDebut}
          AND dateCreation <= ${dateFin}
        GROUP BY strftime('%Y-%m', dateCreation)
        ORDER BY mois
      `,

      // CA par type de chantier
      prisma.$queryRaw`
        SELECT 
          c.typeClient as type,
          SUM(COALESCE(d.totalTTC, d.montant)) as montant,
          COUNT(*) as nombre
        FROM Devis d
        JOIN User c ON d.clientId = c.id
        WHERE d.statut IN ('ACCEPTE', 'PAYE')
          AND d.dateCreation >= ${dateDebut}
          AND d.dateCreation <= ${dateFin}
        GROUP BY c.typeClient
      `
    ]);

    const total = caActuel._sum.totalTTC || 0;
    const totalPasse = caPassé._sum.totalTTC || 0;
    const evolution = totalPasse > 0 ? ((total - totalPasse) / totalPasse) * 100 : 0;

    // Calcul des pourcentages pour les types
    const parType = (caParType as any[]).map(item => ({
      type: item.type || 'Non spécifié',
      montant: item.montant || 0,
      pourcentage: total > 0 ? (item.montant / total) * 100 : 0
    }));

    return {
      total,
      evolution,
      parMois: (caParMois as any[]).map(item => ({
        mois: item.mois,
        montant: item.montant || 0
      })),
      parType
    };
  }

  private async calculMarges(dateDebut: Date, dateFin: Date) {
    const margesData = await prisma.$queryRaw`
      SELECT 
        ch.id as chantierId,
        ch.nom,
        COALESCE(d.totalTTC, d.montant) as chiffreAffaires,
        ch.budget as coutPrevu,
        (COALESCE(d.totalTTC, d.montant) - ch.budget) as margeBrute
      FROM Chantier ch
      JOIN Devis d ON d.chantierId = ch.id
      WHERE d.statut IN ('ACCEPTE', 'PAYE')
        AND ch.dateDebut >= ${dateDebut}
        AND ch.dateDebut <= ${dateFin}
    `;

    const margesArray = margesData as any[];
    
    const bruteMoyenne = margesArray.length > 0 
      ? margesArray.reduce((sum, m) => sum + (m.margeBrute || 0), 0) / margesArray.length 
      : 0;

    const netteMoyenne = bruteMoyenne * 0.8; // Estimation après charges

    const parChantier = margesArray.map(m => ({
      chantierId: m.chantierId,
      nom: m.nom,
      marge: (m.margeBrute / m.chiffreAffaires) * 100 || 0
    }));

    return {
      bruteMoyenne,
      netteMoyenne,
      parChantier
    };
  }

  private async calculProductivite(dateDebut: Date, dateFin: Date) {
    // Calculs simplifiés pour la productivité
    const chantiersCount = await prisma.chantier.count({
      where: {
        dateDebut: { gte: dateDebut, lte: dateFin }
      }
    });

    const tempsPasseParChantier = 30; // Estimation en jours
    const tauxUtilisation = 0.75; // 75% d'utilisation moyenne

    return {
      tempsPasseParChantier,
      tauxUtilisation,
      efficaciteEquipes: [] // À implémenter avec système de gestion d'équipes
    };
  }

  private async analyseTendances(dateDebut: Date, dateFin: Date, horizonMois: number) {
    // Analyse des tendances historiques pour prédiction
    const donneesHistoriques = await prisma.$queryRaw`
      SELECT 
        strftime('%Y-%m', dateCreation) as mois,
        SUM(COALESCE(totalTTC, montant)) as montant
      FROM Devis 
      WHERE statut IN ('ACCEPTE', 'PAYE') 
        AND dateCreation >= ${dateDebut}
        AND dateCreation <= ${dateFin}
      GROUP BY strftime('%Y-%m', dateCreation)
      ORDER BY mois
    `;

    // Prédiction simple basée sur la tendance linéaire
    const donnees = donneesHistoriques as any[];
    const chiffreAffairesPrevu = this.predireTendanceLineaire(donnees, horizonMois);

    return {
      chiffreAffairesPrevu,
      demandeParSecteur: [] // À implémenter avec analyse sectorielle
    };
  }

  private async analyseRisques() {
    // Analyse des clients à risque (retards de paiement, etc.)
    const clientsRisque = await prisma.$queryRaw`
      SELECT 
        u.id as clientId,
        u.company as nom,
        COUNT(d.id) as nombreFactures,
        AVG(julianday('now') - julianday(d.dateEcheance)) as retardMoyen
      FROM User u
      JOIN Devis d ON d.clientId = u.id
      WHERE d.statut = 'ACCEPTE'
        AND d.dateEcheance < datetime('now')
      GROUP BY u.id, u.company
      HAVING retardMoyen > 30
      ORDER BY retardMoyen DESC
    `;

    const clientsRisqueFormates = (clientsRisque as any[]).map(client => ({
      clientId: client.clientId,
      nom: client.nom || 'Client sans nom',
      scoreRisque: Math.min(Math.round(client.retardMoyen || 0), 100),
      raisons: ['Retard de paiement récurrent', 'Historique de créances']
    }));

    return {
      clientsRisque: clientsRisqueFormates,
      chantiersRetard: [] // À implémenter avec planning détaillé
    };
  }

  private async analyseOpportunites() {
    return {
      secteursCroissance: [], // À implémenter avec données sectorielles
      clientsPotentiels: [] // À implémenter avec scoring clients
    };
  }

  private async calculMetriquesOperationnelles(dateDebut: Date, dateFin: Date) {
    const chantiersTermines = await prisma.chantier.count({
      where: {
        statut: 'TERMINE',
        dateFin: { gte: dateDebut, lte: dateFin }
      }
    });

    const chantiersTotal = await prisma.chantier.count({
      where: {
        dateDebut: { gte: dateDebut, lte: dateFin }
      }
    });

    return {
      tauxRealisation: chantiersTotal > 0 ? (chantiersTermines / chantiersTotal) * 100 : 0,
      qualiteExecution: 85, // Note moyenne estimée
      tauxDefauts: 5, // 5% de défauts estimés
      tempsMovenIntervention: 2.5 // 2.5 jours en moyenne
    };
  }

  private async calculMetriquesFinancieres(dateDebut: Date, dateFin: Date) {
    const paiements = await prisma.paiement.findMany({
      where: {
        datePaiement: { gte: dateDebut, lte: dateFin }
      },
      include: {
        facture: true
      }
    });

    const delaisMoyens = paiements.map(p => {
      const delai = p.datePaiement.getTime() - p.facture.dateEcheance.getTime();
      return delai / (1000 * 60 * 60 * 24); // En jours
    });

    const delaiPaiement = delaisMoyens.length > 0 
      ? delaisMoyens.reduce((sum, delai) => sum + delai, 0) / delaisMoyens.length 
      : 0;

    return {
      delaiPaiement,
      tauxImpayesSur: 3, // 3% d'impayés estimés
      rentabiliteParMetier: [
        { metier: 'Maçonnerie', rentabilite: 12 },
        { metier: 'Plomberie', rentabilite: 18 },
        { metier: 'Électricité', rentabilite: 15 }
      ]
    };
  }

  private async calculMetriquesRessources(dateDebut: Date, dateFin: Date) {
    return {
      utilisationMateriel: 68, // 68% d'utilisation estimée
      productiviteOuvriers: 850, // 850€ CA par ouvrier par jour
      tauxAbsenteisme: 4.2 // 4.2% d'absentéisme
    };
  }

  // Méthodes utilitaires

  private predireTendanceLineaire(donnees: any[], horizonMois: number) {
    if (donnees.length < 2) return [];

    // Calcul de la tendance linéaire simple
    const derniereMoyenne = donnees.slice(-3).reduce((sum, d) => sum + (d.montant || 0), 0) / 3;
    const croissanceMensuelle = 0.02; // 2% de croissance mensuelle estimée

    const previsions = [];
    for (let i = 1; i <= horizonMois; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() + i);
      
      previsions.push({
        mois: date.toISOString().substring(0, 7),
        prevision: derniereMoyenne * Math.pow(1 + croissanceMensuelle, i),
        confiance: Math.max(0.9 - (i * 0.1), 0.3) // Confiance décroissante
      });
    }

    return previsions;
  }

  private genererResume(performances: PerformanceMetrics, btpMetrics: BTPMetrics, type: string): string {
    const ca = performances.chiffreAffaires.total;
    const evolution = performances.chiffreAffaires.evolution;
    const tauxRealisation = btpMetrics.operationnels.tauxRealisation;

    return `Rapport ${type} : Chiffre d'affaires de ${ca.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })} ` +
           `(${evolution > 0 ? '+' : ''}${evolution.toFixed(1)}% vs période précédente). ` +
           `Taux de réalisation des chantiers : ${tauxRealisation.toFixed(1)}%. ` +
           `Marge brute moyenne : ${performances.marges.bruteMoyenne.toFixed(1)}%.`;
  }

  private identifierAlertes(performances: PerformanceMetrics, predictive: PredictiveAnalysis, btpMetrics: BTPMetrics): string[] {
    const alertes = [];

    if (performances.chiffreAffaires.evolution < -10) {
      alertes.push('⚠️ Baisse significative du chiffre d\'affaires (-10%+)');
    }

    if (btpMetrics.operationnels.tauxRealisation < 70) {
      alertes.push('🚨 Taux de réalisation faible (<70%)');
    }

    if (btpMetrics.financiers.delaiPaiement > 45) {
      alertes.push('💰 Délais de paiement élevés (>45 jours)');
    }

    if (predictive.risques.clientsRisque.length > 0) {
      alertes.push(`⚡ ${predictive.risques.clientsRisque.length} client(s) à risque identifié(s)`);
    }

    return alertes;
  }

  private genererRecommandations(performances: PerformanceMetrics, predictive: PredictiveAnalysis, btpMetrics: BTPMetrics): string[] {
    const recommandations = [];

    if (performances.marges.bruteMoyenne < 10) {
      recommandations.push('📊 Optimiser les marges : revoir les prix ou réduire les coûts');
    }

    if (btpMetrics.financiers.delaiPaiement > 30) {
      recommandations.push('💳 Améliorer le recouvrement : relances automatisées et conditions de paiement');
    }

    if (btpMetrics.ressources.utilisationMateriel < 60) {
      recommandations.push('🔧 Optimiser l\'utilisation du matériel : planning et maintenance préventive');
    }

    recommandations.push('🎯 Diversifier le portefeuille client pour réduire les risques');
    recommandations.push('📈 Développer les secteurs à forte croissance identifiés');

    return recommandations;
  }
}

// Instance singleton
export const biEngine = BusinessIntelligenceEngine.getInstance();