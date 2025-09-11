import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { executeWorkflows } from '../route';

// GET - Endpoint pour exécuter les workflows périodiques (peut être appelé par un cron job)
export async function GET(request: NextRequest) {
  try {
    console.log('🚀 Démarrage de l\'exécution des workflows périodiques');

    // Récupérer les échéances proches (dans les prochaines 24h)
    const demain = new Date();
    demain.setDate(demain.getDate() + 1);
    
    const opportunitesEcheance = await prisma.opportunite.findMany({
      where: {
        dateCloturePrevisionnelle: {
          lte: demain,
          gte: new Date()
        },
        statut: { notIn: ['GAGNE', 'PERDU'] }
      },
      include: {
        client: {
          select: {
            id: true,
            nom: true,
            name: true,
            email: true,
            typeClient: true
          }
        }
      }
    });

    console.log(`📅 ${opportunitesEcheance.length} opportunité(s) avec échéance proche trouvée(s)`);

    // Déclencher les workflows pour chaque opportunité
    for (const opportunite of opportunitesEcheance) {
      await executeWorkflows('ECHEANCE_PROCHE', {
        opportuniteId: opportunite.id,
        clientId: opportunite.clientId,
        client: opportunite.client,
        priorite: opportunite.priorite,
        valeurEstimee: opportunite.valeurEstimee,
        dateCloturePrevisionnelle: opportunite.dateCloturePrevisionnelle?.toISOString(),
        dateCreation: opportunite.createdAt.toISOString(),
        type: 'opportunite'
      });
    }

    // Vérifier les clients sans interaction récente (plus de 7 jours)
    const il7jours = new Date();
    il7jours.setDate(il7jours.getDate() - 7);
    
    const clientsSansInteraction = await prisma.user.findMany({
      where: {
        role: 'CLIENT',
        interactions: {
          none: {
            createdAt: {
              gte: il7jours
            }
          }
        },
        createdAt: {
          lte: il7jours // Clients créés il y a plus de 7 jours
        }
      },
      include: {
        opportunites: {
          where: {
            statut: { notIn: ['GAGNE', 'PERDU'] }
          }
        }
      },
      take: 50 // Limiter pour éviter la surcharge
    });

    console.log(`💤 ${clientsSansInteraction.length} client(s) sans interaction récente trouvé(s)`);

    // Déclencher les workflows pour les clients inactifs
    for (const client of clientsSansInteraction) {
      await executeWorkflows('AUCUNE_INTERACTION', {
        clientId: client.id,
        client: {
          id: client.id,
          nom: client.nom,
          name: client.name,
          email: client.email,
          typeClient: client.typeClient
        },
        nombreJoursSansInteraction: Math.floor(
          (Date.now() - il7jours.getTime()) / (1000 * 60 * 60 * 24)
        ),
        opportunitesActives: client.opportunites.length,
        dateCreation: client.createdAt.toISOString(),
        type: 'client'
      });
    }

    // Statistiques d'exécution
    const stats = {
      opportunitesEcheance: opportunitesEcheance.length,
      clientsSansInteraction: clientsSansInteraction.length,
      timestamp: new Date().toISOString()
    };

    console.log('✅ Exécution des workflows périodiques terminée', stats);

    return NextResponse.json({
      success: true,
      message: 'Workflows périodiques exécutés avec succès',
      stats
    });

  } catch (error) {
    console.error('❌ Erreur lors de l\'exécution des workflows périodiques:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Erreur lors de l\'exécution des workflows périodiques',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    );
  }
}

// POST - Endpoint pour déclencher manuellement les workflows périodiques
export async function POST(request: NextRequest) {
  try {
    // Authentification simple pour éviter les abus
    const { authorization } = await request.json();
    
    if (authorization !== process.env.WORKFLOW_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    // Réutiliser la logique du GET
    return GET(request);

  } catch (error) {
    console.error('Erreur déclenchement manuel des workflows:', error);
    return NextResponse.json(
      { error: 'Erreur lors du déclenchement manuel' },
      { status: 500 }
    );
  }
}