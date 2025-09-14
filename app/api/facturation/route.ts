import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Schema pour créer une facture
const FactureSchema = z.object({
  clientId: z.string().cuid(),
  devisId: z.string().cuid().optional(),
  chantierId: z.string().cuid().optional(),
  type: z.enum(['DEVIS', 'ACOMPTE', 'SITUATION', 'SOLDE', 'FACTURE_LIBRE']),
  
  // Montants
  montantHT: z.number().positive(),
  tauxTVA: z.number().min(0).max(30).default(20),
  montantTTC: z.number().positive(),
  
  // Échéances
  dateEmission: z.string().datetime(),
  dateEcheance: z.string().datetime(),
  
  // Paiement
  modePaiement: z.enum(['VIREMENT', 'CHEQUE', 'ESPECES', 'CB', 'PRELEVEMENT']).optional(),
  conditionsPaiement: z.string().default('30 jours'),
  
  // Détails
  objet: z.string().min(1),
  description: z.string().optional(),
  notes: z.string().optional(),
  
  // Facturation progressive
  pourcentageAvancement: z.number().min(0).max(100).optional(),
  montantDejaFacture: z.number().min(0).optional(),
  
  // Options
  envoyerParEmail: z.boolean().default(true),
  genererPDF: z.boolean().default(true)
});

// Schema pour les règles de facturation automatique
const RegleFacturationSchema = z.object({
  nom: z.string().min(1),
  actif: z.boolean().default(true),
  
  // Déclencheur
  declencheur: z.enum(['DEVIS_ACCEPTE', 'CHANTIER_TERMINE', 'ECHEANCE_PLANIFIEE', 'AVANCEMENT_CHANTIER']),
  conditions: z.object({
    pourcentageAvancement: z.number().min(0).max(100).optional(),
    delaiJours: z.number().positive().optional(),
    typeChantier: z.string().optional(),
    montantMin: z.number().optional()
  }).optional(),
  
  // Action
  actionFacturation: z.object({
    type: z.enum(['ACOMPTE', 'SITUATION', 'SOLDE', 'FACTURE_COMPLETE']),
    pourcentage: z.number().min(0).max(100).optional(),
    modeleFacture: z.string().optional()
  })
});

// GET - Récupérer les factures avec filtres et statistiques
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const statut = searchParams.get('statut') || 'all';
    const clientId = searchParams.get('clientId');
    const dateDebut = searchParams.get('dateDebut');
    const dateFin = searchParams.get('dateFin');

    // Construction des filtres
    let whereClause: any = {};
    
    if (statut !== 'all') {
      whereClause.statut = statut;
    }
    
    if (clientId) {
      whereClause.clientId = clientId;
    }
    
    if (dateDebut && dateFin) {
      whereClause.dateEmission = {
        gte: new Date(dateDebut),
        lte: new Date(dateFin)
      };
    }

    // Requêtes parallèles
    const [factures, totalCount, statistiques] = await Promise.all([
      // Récupération des factures
      prisma.devis.findMany({
        where: whereClause,
        include: {
          client: {
            select: {
              id: true,
              nom: true,
              name: true,
              email: true,
              company: true,
              address: true
            }
          },
          devis: {
            select: {
              id: true,
              numero: true,
              objet: true
            }
          },
          chantier: {
            select: {
              id: true,
              nom: true,
              statut: true
            }
          },
          paiements: {
            select: {
              id: true,
              montant: true,
              datePaiement: true,
              methode: true
            }
          }
        },
        orderBy: { dateCreation: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),

      // Comptage total
      prisma.devis.count({ where: whereClause }),

      // Statistiques
      prisma.devis.aggregate({
        where: whereClause,
        _sum: {
          totalTTC: true,
          montant: true
        },
        _count: {
          id: true
        }
      })
    ]);

    // Calcul des statistiques détaillées
    const statsDetaillees = await Promise.all([
      // Factures en retard
      prisma.devis.count({
        where: {
          ...whereClause,
          statut: 'EMISE',
          dateEcheance: { lt: new Date() }
        }
      }),
      
      // Factures du mois
      prisma.devis.aggregate({
        where: {
          ...whereClause,
          dateEmission: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        },
        _sum: { montantTTC: true },
        _count: { id: true }
      }),
      
      // Chiffre d'affaires encaissé
      prisma.devis.aggregate({
        where: {
          ...whereClause,
          statut: 'PAYEE'
        },
        _sum: { montantTTC: true }
      })
    ]);

    const [facturesRetard, facturesMois, caEncaisse] = statsDetaillees;

    return NextResponse.json({
      factures,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      },
      statistiques: {
        total: statistiques._count.id,
        montantTotal: statistiques._sum.montantTTC || 0,
        montantPaye: statistiques._sum.montantPaye || 0,
        montantImpaye: (statistiques._sum.montantTTC || 0) - (statistiques._sum.montantPaye || 0),
        facturesRetard,
        facturesMois: facturesMois._count.id,
        caMois: facturesMois._sum.montantTTC || 0,
        caEncaisse: caEncaisse._sum.montantTTC || 0
      }
    });

  } catch (error) {
    console.error('Erreur récupération factures:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST - Créer une nouvelle facture
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = FactureSchema.parse(body);

    // Génération du numéro de facture
    const numeroFacture = await genererNumeroFacture();

    // Création de la facture
    const facture = await prisma.devis.create({
      data: {
        numero: numeroFacture,
        clientId: validatedData.clientId,
        devisId: validatedData.devisId,
        chantierId: validatedData.chantierId,
        type: validatedData.type,
        objet: validatedData.objet,
        description: validatedData.description,
        
        // Montants
        montantHT: validatedData.montantHT,
        tauxTVA: validatedData.tauxTVA,
        montantTVA: validatedData.montantHT * (validatedData.tauxTVA / 100),
        montantTTC: validatedData.montantTTC,
        
        // Dates
        dateEmission: new Date(validatedData.dateEmission),
        dateEcheance: new Date(validatedData.dateEcheance),
        
        // Paiement
        modePaiementPrevu: validatedData.modePaiement,
        conditionsPaiement: validatedData.conditionsPaiement,
        
        // Progression
        pourcentageAvancement: validatedData.pourcentageAvancement,
        montantDejaFacture: validatedData.montantDejaFacture || 0,
        
        // Métadonnées
        statut: 'BROUILLON',
        createdBy: session.user.id,
        notes: validatedData.notes
      },
      include: {
        client: {
          select: {
            nom: true,
            name: true,
            email: true,
            company: true
          }
        }
      }
    });

    // Génération automatique du PDF si demandé
    if (validatedData.genererPDF) {
      await genererPDFFacture(facture.id);
    }

    // Envoi par email si demandé
    if (validatedData.envoyerParEmail && facture.client.email) {
      await envoyerFactureParEmail(facture.id);
    }

    // Log de l'action
    await prisma.historiqueActionCRM.create({
      data: {
        action: 'CREATION_FACTURE',
        entite: 'facture',
        entiteId: facture.id,
        nouvelleValeur: {
          numero: facture.numero,
          montantTTC: facture.montantTTC,
          type: facture.type
        },
        userId: session.user.id,
        userName: session.user.name || session.user.email || 'Utilisateur'
      }
    });

    return NextResponse.json(facture, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Erreur création facture:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// Fonction pour générer un numéro de facture unique
async function genererNumeroFacture(): Promise<string> {
  const annee = new Date().getFullYear();
  const mois = String(new Date().getMonth() + 1).padStart(2, '0');
  
  // Compter les factures du mois
  const debutMois = new Date(annee, new Date().getMonth(), 1);
  const finMois = new Date(annee, new Date().getMonth() + 1, 0);
  
  const nbFacturesMois = await prisma.devis.count({
    where: {
      dateEmission: {
        gte: debutMois,
        lte: finMois
      }
    }
  });

  const sequence = String(nbFacturesMois + 1).padStart(3, '0');
  return `F${annee}${mois}${sequence}`;
}

// Fonction pour générer le PDF de la facture (simulée)
async function genererPDFFacture(factureId: string): Promise<void> {
  console.log(`📄 Génération PDF pour facture ${factureId}`);
  
  // En production, ici on utiliserait jsPDF, Puppeteer, ou un service externe
  // Pour l'instant, on simule la génération
  
  await prisma.devis.update({
    where: { id: factureId },
    data: {
      pdfGenere: true,
      cheminPDF: `/factures/pdf/${factureId}.pdf`
    }
  });
}

// Fonction pour envoyer la facture par email (simulée)
async function envoyerFactureParEmail(factureId: string): Promise<void> {
  console.log(`📧 Envoi email pour facture ${factureId}`);
  
  // En production, utiliser un service d'emailing
  const facture = await prisma.devis.findUnique({
    where: { id: factureId },
    include: { client: true }
  });

  if (facture) {
    console.log(`📧 Email envoyé à: ${facture.client.email}`);
    
    await prisma.devis.update({
      where: { id: factureId },
      data: {
        emailEnvoye: true,
        dateEnvoiEmail: new Date()
      }
    });
  }
}

// POST - Endpoint pour facturation automatique
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    console.log('🤖 Démarrage de la facturation automatique');

    // Récupérer les devis acceptés non facturés
    const devisAcceptes = await prisma.devis.findMany({
      where: {
        statut: 'ACCEPTE',
        factures: {
          none: {}
        }
      },
      include: {
        client: true,
        chantier: true
      }
    });

    console.log(`📋 ${devisAcceptes.length} devis accepté(s) à facturer`);

    const facturesCreees = [];

    // Créer les factures automatiquement
    for (const devis of devisAcceptes) {
      try {
        const numeroFacture = await genererNumeroFacture();
        
        const facture = await prisma.devis.create({
          data: {
            numero: numeroFacture,
            clientId: devis.clientId,
            devisId: devis.id,
            chantierId: devis.chantierId,
            type: 'DEVIS',
            objet: `Facturation devis ${devis.numero} - ${devis.objet}`,
            
            montantHT: devis.montant,
            tauxTVA: devis.tauxTVA || 20,
            montantTVA: devis.montant * ((devis.tauxTVA || 20) / 100),
            montantTTC: devis.totalTTC || devis.montant * 1.2,
            
            dateEmission: new Date(),
            dateEcheance: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 jours
            
            conditionsPaiement: '30 jours',
            statut: 'EMISE',
            createdBy: session.user.id
          }
        });

        facturesCreees.push(facture);
        
        // Marquer le devis comme facturé
        await prisma.devis.update({
          where: { id: devis.id },
          data: { statut: 'FACTURE' }
        });

      } catch (error) {
        console.error(`❌ Erreur facturation devis ${devis.id}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      message: `${facturesCreees.length} facture(s) créée(s) automatiquement`,
      factures: facturesCreees
    });

  } catch (error) {
    console.error('Erreur facturation automatique:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}