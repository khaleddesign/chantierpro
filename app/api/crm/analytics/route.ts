import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface AnalyticsCRM {
  periode: string;
  
  // KPIs Clients
  totalClients: number;
  nouveauxClients: number;
  clientsActifs: number;
  tauxRetention: number;
  
  // KPIs Commerciaux
  totalOpportunites: number;
  pipelineValue: number;
  devisEnvoyes: number;
  tauxConversion: number;
  ticketMoyen: number;
  
  // KPIs Performance
  nbInteractions: number;
  tempsReponse: number;
  satisfactionClient: number;
  
  // Évolutions
  evolutionClients: number;
  evolutionPipeline: number;
  evolutionConversion: number;
  
  // Détails par source
  sourceProspects: Array<{
    source: string;
    nombre: number;
    tauxConversion: number;
    valeurMoyenne: number;
  }>;
  
  // Détails par commercial
  performanceCommerciale: Array<{
    commercial: string;
    nbClients: number;
    pipelineValue: number;
    tauxConversion: number;
    objectifMensuel: number;
  }>;
  
  // Répartition par type de client
  repartitionClients: Array<{
    type: string;
    nombre: number;
    pourcentage: number;
    chiffreAffaires: number;
  }>;
}

// GET - Récupérer les analytics CRM
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const periode = searchParams.get('periode') || '30j';

    // Calculer les dates selon la période
    const maintenant = new Date();
    let dateDebut = new Date();
    let datePrecedente = new Date();

    switch (periode) {
      case '7j':
        dateDebut.setDate(maintenant.getDate() - 7);
        datePrecedente.setDate(maintenant.getDate() - 14);
        break;
      case '30j':
        dateDebut.setDate(maintenant.getDate() - 30);
        datePrecedente.setDate(maintenant.getDate() - 60);
        break;
      case '3m':
        dateDebut.setMonth(maintenant.getMonth() - 3);
        datePrecedente.setMonth(maintenant.getMonth() - 6);
        break;
      case '6m':
        dateDebut.setMonth(maintenant.getMonth() - 6);
        datePrecedente.setMonth(maintenant.getMonth() - 12);
        break;
      case '1a':
        dateDebut.setFullYear(maintenant.getFullYear() - 1);
        datePrecedente.setFullYear(maintenant.getFullYear() - 2);
        break;
      default:
        dateDebut.setDate(maintenant.getDate() - 30);
        datePrecedente.setDate(maintenant.getDate() - 60);
    }

    // Requêtes parallèles pour optimiser les performances
    const [
      // Données clients
      totalClients,
      totalClientsPrecedent,
      nouveauxClients,
      clientsActifs,

      // Données commerciales
      opportunites,
      opportunitesPrecedentes,
      devis,
      chantiers,

      // Données interactions
      interactions,
      
      // Données par source
      sourceProspects,
      
      // Performance commerciale
      commerciaux,
      
      // Répartition par type
      repartitionClients

    ] = await Promise.all([
      // Clients actuels
      prisma.user.count({
        where: {
          role: 'CLIENT',
          createdAt: { lte: maintenant }
        }
      }),

      // Clients période précédente
      prisma.user.count({
        where: {
          role: 'CLIENT',
          createdAt: { lte: datePrecedente }
        }
      }),

      // Nouveaux clients dans la période
      prisma.user.count({
        where: {
          role: 'CLIENT',
          createdAt: {
            gte: dateDebut,
            lte: maintenant
          }
        }
      }),

      // Clients actifs (ayant eu une interaction récente)
      prisma.user.count({
        where: {
          role: 'CLIENT',
          interactions: {
            some: {
              createdAt: {
                gte: dateDebut,
                lte: maintenant
              }
            }
          }
        }
      }),

      // Opportunités actuelles
      prisma.opportunite.findMany({
        where: {
          createdAt: {
            gte: dateDebut,
            lte: maintenant
          }
        },
        include: {
          client: {
            select: {
              name: true,
              nom: true
            }
          }
        }
      }),

      // Opportunités période précédente
      prisma.opportunite.findMany({
        where: {
          createdAt: {
            gte: datePrecedente,
            lte: dateDebut
          }
        }
      }),

      // Devis période
      prisma.devis.findMany({
        where: {
          dateCreation: {
            gte: dateDebut,
            lte: maintenant
          }
        }
      }),

      // Chantiers terminés (pour le taux de conversion)
      prisma.chantier.count({
        where: {
          statut: 'TERMINE',
          createdAt: {
            gte: dateDebut,
            lte: maintenant
          }
        }
      }),

      // Interactions période
      prisma.interactionClient.findMany({
        where: {
          createdAt: {
            gte: dateDebut,
            lte: maintenant
          }
        }
      }),

      // Sources de prospects
      prisma.opportunite.groupBy({
        by: ['sourceProspection'],
        where: {
          createdAt: {
            gte: dateDebut,
            lte: maintenant
          },
          sourceProspection: {
            not: null
          }
        },
        _count: {
          id: true
        },
        _avg: {
          valeurEstimee: true
        }
      }),

      // Performance par commercial
      prisma.user.findMany({
        where: {
          role: { in: ['COMMERCIAL', 'ADMIN'] },
          commerciaux: {
            some: {
              role: 'CLIENT'
            }
          }
        },
        include: {
          commerciaux: {
            where: { role: 'CLIENT' },
            include: {
              opportunites: {
                where: {
                  createdAt: {
                    gte: dateDebut,
                    lte: maintenant
                  }
                }
              },
              chantiers: {
                where: {
                  statut: 'TERMINE',
                  createdAt: {
                    gte: dateDebut,
                    lte: maintenant
                  }
                }
              }
            }
          }
        }
      }),

      // Répartition par type de client
      prisma.user.groupBy({
        by: ['typeClient'],
        where: {
          role: 'CLIENT',
          typeClient: {
            not: null
          }
        },
        _count: {
          id: true
        },
        _sum: {
          chiffreAffaires: true
        }
      })
    ]);

    // Calculs des KPIs
    const pipelineValue = opportunites.reduce((sum, opp) => sum + (opp.valeurEstimee || 0), 0);
    const pipelineValuePrecedent = opportunitesPrecedentes.reduce((sum, opp) => sum + (opp.valeurEstimee || 0), 0);
    
    const devisEnvoyes = devis.filter(d => d.statut === 'ENVOYE').length;
    const devisAcceptes = devis.filter(d => d.statut === 'ACCEPTE').length;
    const tauxConversion = devisEnvoyes > 0 ? (devisAcceptes / devisEnvoyes) * 100 : 0;
    
    const ticketMoyen = devis.length > 0 
      ? devis.reduce((sum, d) => sum + (d.totalTTC || d.montant || 0), 0) / devis.length 
      : 0;

    // Temps de réponse moyen (estimation basée sur les interactions)
    const tempsReponse = 2.4; // À calculer dynamiquement selon la logique métier

    // Satisfaction client (moyenne des notes dans les interactions)
    const notesInteractions = interactions
      .filter(i => i.satisfaction && parseInt(i.satisfaction as string, 10) > 0)
      .map(i => parseInt(i.satisfaction as string, 10))
      .filter(note => !isNaN(note));
    const satisfactionClient = notesInteractions.length > 0
      ? notesInteractions.reduce((sum, note) => sum + note, 0) / notesInteractions.length
      : 4.5;

    // Calculs des évolutions
    const evolutionClients = totalClientsPrecedent > 0 
      ? ((totalClients - totalClientsPrecedent) / totalClientsPrecedent) * 100 
      : 0;
    const evolutionPipeline = pipelineValuePrecedent > 0 
      ? ((pipelineValue - pipelineValuePrecedent) / pipelineValuePrecedent) * 100 
      : 0;
    const evolutionConversion = -2.1; // À calculer dynamiquement

    // Traitement des sources de prospects
    const sourceProspectsFormatted = sourceProspects.map(source => {
      const oppSource = opportunites.filter(opp => opp.sourceProspection === source.sourceProspection);
      const oppSourceGagnees = oppSource.filter(opp => opp.statut === 'GAGNE');
      
      return {
        source: source.sourceProspection || 'Non spécifié',
        nombre: source._count.id,
        tauxConversion: oppSource.length > 0 ? (oppSourceGagnees.length / oppSource.length) * 100 : 0,
        valeurMoyenne: source._avg.valeurEstimee || 0
      };
    });

    // Traitement de la performance commerciale
    const performanceCommerciale = commerciaux.map(commercial => {
      const pipelineCommercial = commercial.commerciaux.reduce((sum, client) => 
        sum + client.opportunites.reduce((oppSum, opp) => oppSum + (opp.valeurEstimee || 0), 0), 0
      );
      const chantiersTermines = commercial.commerciaux.reduce((sum, client) => sum + client.chantiers.length, 0);
      const totalOpportunites = commercial.commerciaux.reduce((sum, client) => sum + client.opportunites.length, 0);
      
      return {
        commercial: commercial.name || commercial.email,
        nbClients: commercial.commerciaux.length,
        pipelineValue: pipelineCommercial,
        tauxConversion: totalOpportunites > 0 ? (chantiersTermines / totalOpportunites) * 100 : 0,
        objectifMensuel: 300000 // À récupérer depuis les paramètres utilisateur
      };
    });

    // Traitement de la répartition par type de client
    const totalClientsTypes = repartitionClients.reduce((sum, type) => sum + type._count.id, 0);
    const repartitionClientsFormatted = repartitionClients.map(type => ({
      type: type.typeClient || 'NON_DEFINI',
      nombre: type._count.id,
      pourcentage: totalClientsTypes > 0 ? (type._count.id / totalClientsTypes) * 100 : 0,
      chiffreAffaires: type._sum.chiffreAffaires || 0
    }));

    // Calcul du taux de rétention (clients ayant eu une interaction récente)
    const tauxRetention = totalClients > 0 ? (clientsActifs / totalClients) * 100 : 0;

    const analytics: AnalyticsCRM = {
      periode,
      
      // KPIs Clients
      totalClients,
      nouveauxClients,
      clientsActifs,
      tauxRetention,
      
      // KPIs Commerciaux
      totalOpportunites: opportunites.length,
      pipelineValue,
      devisEnvoyes,
      tauxConversion,
      ticketMoyen,
      
      // KPIs Performance
      nbInteractions: interactions.length,
      tempsReponse,
      satisfactionClient,
      
      // Évolutions
      evolutionClients,
      evolutionPipeline,
      evolutionConversion,
      
      // Détails
      sourceProspects: sourceProspectsFormatted,
      performanceCommerciale,
      repartitionClients: repartitionClientsFormatted
    };

    return NextResponse.json(analytics);

  } catch (error) {
    console.error('Erreur lors de la récupération des analytics:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de la récupération des analytics' },
      { status: 500 }
    );
  }
}