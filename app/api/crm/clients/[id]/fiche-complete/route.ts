import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Récupérer la fiche client complète (360°)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    // Récupérer toutes les données client en parallèle
    const [
      client,
      interactions,
      opportunites,
      chantiers,
      devis,
      documents,
      plannings,
      historiqueActions
    ] = await Promise.all([
      // Données client de base
      prisma.user.findUnique({
        where: { 
          id: id,
          role: 'CLIENT'
        },
        select: {
          id: true,
          nom: true,
          name: true,
          email: true,
          phone: true,
          company: true,
          address: true,
          image: true,
          
          // PHASE 1 - Nouveaux champs CRM
          telephoneFixe: true,
          telephoneMobile: true,
          siteWeb: true,
          linkedin: true,
          siret: true,
          codeApe: true,
          formeJuridique: true,
          capitalSocial: true,
          sourceProspect: true,
          notesCRM: true,
          priorite: true,
          score: true,
          prefEmail: true,
          prefTelephone: true,
          prefSMS: true,
          prefCourrier: true,
          
          // Champs existants BTP
          typeClient: true,
          secteurActivite: true,
          effectif: true,
          chiffreAffaires: true,
          adresse2: true,
          codePostal: true,
          ville: true,
          pays: true,
          sourceProspection: true,
          
          createdAt: true,
          updatedAt: true,
        }
      }),
      
      // Interactions récentes
      prisma.interactionClient.findMany({
        where: { clientId: id },
        orderBy: { dateContact: 'desc' },
        take: 10,
        select: {
          id: true,
          type: true,
          titre: true,
          description: true,
          dateContact: true,
          statut: true,
          importance: true,
          dureeMinutes: true,
          satisfaction: true,
          createdByName: true,
        }
      }),
      
      // Opportunités
      prisma.opportunite.findMany({
        where: { clientId: id },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          titre: true,
          valeurEstimee: true,
          statut: true,
          probabilite: true,
          priorite: true,
          dateCloturePrevisionnelle: true,
          etapeActuelle: true,
          typeProjet: true,
          createdAt: true,
        }
      }),
      
      // Chantiers
      prisma.chantier.findMany({
        where: { 
          clientId: id,
          deletedAt: null
        },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          nom: true,
          statut: true,
          progression: true,
          dateDebut: true,
          dateFin: true,
          budget: true,
          adresse: true,
          createdAt: true,
        }
      }),
      
      // Devis
      prisma.devis.findMany({
        where: { clientId: id },
        orderBy: { dateCreation: 'desc' },
        select: {
          id: true,
          numero: true,
          objet: true,
          montant: true,
          totalTTC: true,
          statut: true,
          dateCreation: true,
          dateEcheance: true,
          type: true,
        }
      }),
      
      // Documents
      prisma.document.findMany({
        where: {
          OR: [
            { uploader: { id: id } },
            { chantier: { clientId: id } }
          ]
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          nom: true,
          type: true,
          taille: true,
          createdAt: true,
          chantier: {
            select: { nom: true }
          }
        }
      }),
      
      // Plannings
      prisma.planning.findMany({
        where: {
          OR: [
            { organisateur: { id: id } },
            { participants: { some: { id: id } } },
            { chantier: { clientId: id } }
          ],
          dateDebut: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Derniers 30 jours
        },
        orderBy: { dateDebut: 'desc' },
        take: 5,
        select: {
          id: true,
          titre: true,
          type: true,
          dateDebut: true,
          dateFin: true,
          statut: true,
          chantier: {
            select: { nom: true }
          }
        }
      }),
      
      // Historique des actions CRM
      prisma.historiqueActionCRM.findMany({
        where: {
          OR: [
            { 
              entite: 'client',
              entiteId: id
            },
            {
              entite: 'interaction',
              entiteId: {
                in: await prisma.interactionClient.findMany({
                  where: { clientId: id },
                  select: { id: true }
                }).then(interactions => interactions.map(i => i.id))
              }
            },
            {
              entite: 'opportunite',
              entiteId: {
                in: await prisma.opportunite.findMany({
                  where: { clientId: id },
                  select: { id: true }
                }).then(opportunites => opportunites.map(o => o.id))
              }
            }
          ]
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: {
          id: true,
          action: true,
          entite: true,
          userName: true,
          createdAt: true,
        }
      })
    ]);

    if (!client) {
      return NextResponse.json(
        { error: 'Client non trouvé' },
        { status: 404 }
      );
    }

    // Calculer des statistiques
    const stats = {
      // Statistiques interactions
      totalInteractions: interactions.length,
      interactionsParType: interactions.reduce((acc, inter) => {
        acc[inter.type] = (acc[inter.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      
      // Statistiques opportunités
      totalOpportunites: opportunites.length,
      valeurTotalePipeline: opportunites
        .filter(o => !['GAGNE', 'PERDU'].includes(o.statut))
        .reduce((sum, o) => sum + o.valeurEstimee, 0),
      opportunitesGagnees: opportunites.filter(o => o.statut === 'GAGNE').length,
      
      // Statistiques chantiers
      totalChantiers: chantiers.length,
      chantiersActifs: chantiers.filter(c => c.statut === 'EN_COURS').length,
      chantiersTermines: chantiers.filter(c => c.statut === 'TERMINE').length,
      
      // Statistiques devis
      totalDevis: devis.length,
      montantTotalDevis: devis.reduce((sum, d) => sum + (d.totalTTC || d.montant), 0),
      devisEnAttente: devis.filter(d => d.statut === 'ENVOYE').length,
      devisAcceptes: devis.filter(d => d.statut === 'ACCEPTE').length,
      
      // Score client calculé
      scoreClient: calculateClientScore({
        interactions: interactions.length,
        opportunites: opportunites.length,
        chantiers: chantiers.length,
        devisAcceptes: devis.filter(d => d.statut === 'ACCEPTE').length,
        ancienneteJours: Math.floor((Date.now() - new Date(client.createdAt).getTime()) / (1000 * 60 * 60 * 24))
      })
    };

    // Récupérer les prochaines échéances
    const prochainesEcheances = await getProchainesEcheances(id);

    return NextResponse.json({
      client,
      interactions,
      opportunites,
      chantiers,
      devis,
      documents,
      plannings,
      historiqueActions,
      stats,
      prochainesEcheances
    });

  } catch (error) {
    console.error('Erreur lors de la récupération de la fiche client:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de la récupération de la fiche client' },
      { status: 500 }
    );
  }
}

// Fonction pour calculer un score client
function calculateClientScore(data: {
  interactions: number,
  opportunites: number,
  chantiers: number,
  devisAcceptes: number,
  ancienneteJours: number
}): number {
  let score = 0;
  
  // Points pour l'engagement (interactions)
  score += Math.min(data.interactions * 2, 20);
  
  // Points pour le potentiel commercial
  score += Math.min(data.opportunites * 5, 25);
  
  // Points pour les réalisations
  score += Math.min(data.chantiers * 10, 40);
  score += Math.min(data.devisAcceptes * 8, 32);
  
  // Points pour l'ancienneté (fidélité)
  if (data.ancienneteJours > 365) score += 10;
  else if (data.ancienneteJours > 180) score += 5;
  else if (data.ancienneteJours > 30) score += 2;
  
  return Math.min(score, 100);
}

// Fonction pour récupérer les prochaines échéances
async function getProchainesEcheances(clientId: string) {
  const maintenant = new Date();
  const dans30Jours = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  const [
    devisEcheances,
    rappelsInteractions,
    suiviOpportunites,
    planningsFuturs
  ] = await Promise.all([
    // Devis arrivant à échéance
    prisma.devis.findMany({
      where: {
        clientId,
        statut: 'ENVOYE',
        dateEcheance: {
          gte: maintenant,
          lte: dans30Jours
        }
      },
      select: {
        id: true,
        numero: true,
        objet: true,
        dateEcheance: true,
        montant: true
      }
    }),
    
    // Rappels d'interactions
    prisma.interactionClient.findMany({
      where: {
        clientId,
        rappelDate: {
          gte: maintenant,
          lte: dans30Jours
        }
      },
      select: {
        id: true,
        titre: true,
        rappelDate: true,
        type: true
      }
    }),
    
    // Suivis d'opportunités
    prisma.opportunite.findMany({
      where: {
        clientId,
        dateProchainSuivi: {
          gte: maintenant,
          lte: dans30Jours
        },
        statut: { notIn: ['GAGNE', 'PERDU'] }
      },
      select: {
        id: true,
        titre: true,
        dateProchainSuivi: true,
        valeurEstimee: true
      }
    }),
    
    // Plannings futurs
    prisma.planning.findMany({
      where: {
        OR: [
          { chantier: { clientId } },
          { participants: { some: { id: clientId } } }
        ],
        dateDebut: {
          gte: maintenant,
          lte: dans30Jours
        }
      },
      select: {
        id: true,
        titre: true,
        dateDebut: true,
        type: true,
        chantier: {
          select: { nom: true }
        }
      }
    })
  ]);

  return {
    devis: devisEcheances,
    interactions: rappelsInteractions,
    opportunites: suiviOpportunites,
    plannings: planningsFuturs
  };
}