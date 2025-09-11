import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const periode = searchParams.get("periode") || "30j";

    // Calculer les dates en fonction de la période
    const now = new Date();
    let dateDebut: Date;
    let periodeComparaison: Date;
    
    switch (periode) {
      case "7j":
        dateDebut = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        periodeComparaison = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
        break;
      case "30j":
        dateDebut = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        periodeComparaison = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
        break;
      case "90j":
        dateDebut = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        periodeComparaison = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
        break;
      case "1an":
        dateDebut = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        periodeComparaison = new Date(now.getTime() - 730 * 24 * 60 * 60 * 1000);
        break;
      default:
        dateDebut = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        periodeComparaison = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    }

    // Construction des conditions WHERE selon le rôle
    const userWhere: any = {};
    const opportuniteWhere: any = {};
    const interactionWhere: any = {};
    
    if (session.user.role === "COMMERCIAL") {
      userWhere.commercialId = session.user.id;
      opportuniteWhere.client = { commercialId: session.user.id };
      interactionWhere.client = { commercialId: session.user.id };
    } else if (session.user.role === "CLIENT") {
      userWhere.id = session.user.id;
      opportuniteWhere.clientId = session.user.id;
      interactionWhere.clientId = session.user.id;
    }
    // Admin voit tout

    // 1. STATISTIQUES CLIENTS
    const [totalClients, nouveauxClients, clientsPrecedents] = await Promise.all([
      // Total clients
      prisma.user.count({
        where: { 
          role: "CLIENT",
          ...userWhere
        }
      }),
      
      // Nouveaux clients (période actuelle)
      prisma.user.count({
        where: {
          role: "CLIENT",
          createdAt: { gte: dateDebut },
          ...userWhere
        }
      }),
      
      // Clients période précédente (pour calcul évolution)
      prisma.user.count({
        where: {
          role: "CLIENT",
          createdAt: { 
            gte: periodeComparaison,
            lt: dateDebut
          },
          ...userWhere
        }
      })
    ]);

    // 2. STATISTIQUES OPPORTUNITES
    const [opportunites, opportunitesPrecedentes, opportunitesGagnees] = await Promise.all([
      // Opportunités période actuelle
      prisma.opportunite.findMany({
        where: {
          createdAt: { gte: dateDebut },
          ...opportuniteWhere
        },
        include: {
          client: {
            select: {
              name: true,
              typeClient: true
            }
          }
        }
      }),
      
      // Opportunités période précédente
      prisma.opportunite.findMany({
        where: {
          createdAt: {
            gte: periodeComparaison,
            lt: dateDebut
          },
          ...opportuniteWhere
        }
      }),
      
      // Opportunités gagnées
      prisma.opportunite.findMany({
        where: {
          statut: "GAGNE",
          ...opportuniteWhere
        }
      })
    ]);

    // 3. STATISTIQUES INTERACTIONS
    const [interactions, interactionsPrecedentes] = await Promise.all([
      // Interactions période actuelle
      prisma.interactionClient.count({
        where: {
          dateContact: { gte: dateDebut },
          ...interactionWhere
        }
      }),
      
      // Interactions période précédente
      prisma.interactionClient.count({
        where: {
          dateContact: {
            gte: periodeComparaison,
            lt: dateDebut
          },
          ...interactionWhere
        }
      })
    ]);

    // 4. CALCULS STATISTIQUES
    const pipelineValue = opportunites.reduce((sum, opp) => sum + opp.valeurEstimee, 0);
    const pipelineValuePrecedent = opportunitesPrecedentes.reduce((sum, opp) => sum + opp.valeurEstimee, 0);
    
    const chiffreAffairesGagne = opportunitesGagnees.reduce((sum, opp) => sum + opp.valeurEstimee, 0);
    const ticketMoyen = opportunitesGagnees.length > 0 ? chiffreAffairesGagne / opportunitesGagnees.length : 0;
    
    const tauxConversion = opportunites.length > 0 ? 
      (opportunitesGagnees.filter(opp => opp.createdAt >= dateDebut).length / opportunites.length) * 100 : 0;

    // Évolutions
    const evolutionClients = clientsPrecedents > 0 ? 
      ((nouveauxClients - clientsPrecedents) / clientsPrecedents) * 100 : 0;
      
    const evolutionPipeline = pipelineValuePrecedent > 0 ? 
      ((pipelineValue - pipelineValuePrecedent) / pipelineValuePrecedent) * 100 : 0;

    // 5. RÉPARTITION PAR TYPE DE CLIENT
    const clientsParType = await prisma.user.groupBy({
      by: ['typeClient'],
      where: {
        role: "CLIENT",
        ...userWhere
      },
      _count: {
        id: true
      },
      _sum: {
        chiffreAffaires: true
      }
    });

    const repartitionClients = clientsParType.map(group => ({
      type: group.typeClient || 'NON_DEFINI',
      nombre: group._count.id,
      pourcentage: totalClients > 0 ? (group._count.id / totalClients) * 100 : 0,
      chiffreAffaires: group._sum.chiffreAffaires || 0
    }));

    // 6. SOURCES DE PROSPECTION (simulées pour l'instant)
    const sourceProspects = [
      {
        source: "Site Web",
        nombre: Math.floor(nouveauxClients * 0.4),
        tauxConversion: 15,
        valeurMoyenne: ticketMoyen * 0.8
      },
      {
        source: "Bouche à oreille",
        nombre: Math.floor(nouveauxClients * 0.3),
        tauxConversion: 25,
        valeurMoyenne: ticketMoyen * 1.2
      },
      {
        source: "Réseaux sociaux",
        nombre: Math.floor(nouveauxClients * 0.2),
        tauxConversion: 8,
        valeurMoyenne: ticketMoyen * 0.6
      },
      {
        source: "Publicité",
        nombre: Math.floor(nouveauxClients * 0.1),
        tauxConversion: 12,
        valeurMoyenne: ticketMoyen * 0.9
      }
    ];

    // 7. PERFORMANCE COMMERCIALE (pour les admins)
    let performanceCommerciale: any[] = [];
    if (session.user.role === "ADMIN") {
      const commerciaux = await prisma.user.findMany({
        where: { role: "COMMERCIAL" },
        select: {
          id: true,
          name: true,
          commerciaux: {
            select: {
              id: true,
              chiffreAffaires: true
            }
          },
          _count: {
            select: {
              commerciaux: true
            }
          }
        }
      });

      performanceCommerciale = await Promise.all(
        commerciaux.map(async (commercial) => {
          const opportunitesCommercial = await prisma.opportunite.findMany({
            where: {
              client: { commercialId: commercial.id },
              createdAt: { gte: dateDebut }
            }
          });

          const pipelineCommercial = opportunitesCommercial.reduce((sum, opp) => sum + opp.valeurEstimee, 0);
          const opportunitesGagneesCommercial = opportunitesCommercial.filter(opp => opp.statut === "GAGNE");
          const tauxConversionCommercial = opportunitesCommercial.length > 0 ?
            (opportunitesGagneesCommercial.length / opportunitesCommercial.length) * 100 : 0;

          return {
            commercial: commercial.name,
            nbClients: commercial._count.commerciaux,
            pipelineValue: pipelineCommercial,
            tauxConversion: tauxConversionCommercial,
            objectifMensuel: 50000 // Objectif fixe pour l'exemple
          };
        })
      );
    }

    // Construction de la réponse
    const analyticsData = {
      periode,
      
      // KPIs Clients
      totalClients,
      nouveauxClients,
      clientsActifs: totalClients, // Simplification
      tauxRetention: 85, // Valeur simulée
      
      // KPIs Commerciaux
      totalOpportunites: opportunites.length,
      pipelineValue,
      devisEnvoyes: opportunites.length, // Simplification
      tauxConversion: Math.round(tauxConversion * 10) / 10,
      ticketMoyen: Math.round(ticketMoyen),
      
      // KPIs Performance
      nbInteractions: interactions,
      tempsReponse: 4.5, // Heures - valeur simulée
      satisfactionClient: 4.2, // Sur 5 - valeur simulée
      
      // Évolutions
      evolutionClients: Math.round(evolutionClients * 10) / 10,
      evolutionPipeline: Math.round(evolutionPipeline * 10) / 10,
      evolutionConversion: 2.3, // Valeur simulée
      
      // Détails
      sourceProspects,
      performanceCommerciale,
      repartitionClients
    };

    return NextResponse.json(analyticsData);

  } catch (error) {
    console.error("Erreur lors du calcul des analytics:", error);
    return NextResponse.json(
      { error: "Erreur serveur interne" },
      { status: 500 }
    );
  }
}