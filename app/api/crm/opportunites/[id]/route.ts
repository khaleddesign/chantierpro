import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { executeWorkflows } from '@/lib/services/workflow-service';

// Schema de validation pour mettre à jour une opportunité
const UpdateOpportuniteSchema = z.object({
  titre: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  valeurEstimee: z.number().positive().optional(),
  probabilite: z.number().int().min(0).max(100).optional(),
  statut: z.enum(['PROSPECT', 'QUALIFIE', 'PROPOSITION', 'NEGOCIATION', 'GAGNE', 'PERDU']).optional(),
  dateCloture: z.string().datetime().optional(),
  dateCloturePrevisionnelle: z.string().datetime().optional(),
  sourceProspection: z.string().optional(),
  concurrents: z.string().optional(),
  motifRefus: z.string().optional(),
  commissionAgent: z.number().optional(),
  dateProchainSuivi: z.string().datetime().optional(),
  priorite: z.enum(['BASSE', 'NORMALE', 'HAUTE', 'CRITIQUE']).optional(),
  tagsMetier: z.string().optional(),
  assigneACommercial: z.string().optional(),
  etapeActuelle: z.string().optional(),
  tempsEstime: z.number().int().positive().optional(),
  budgetClient: z.number().positive().optional(),
  delaiSouhaite: z.string().optional(),
  typeProjet: z.string().optional(),
  devisAssocie: z.string().optional(),
  chantierId: z.string().optional(),
});

// GET - Récupérer une opportunité spécifique
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

    const opportunite = await prisma.opportunite.findUnique({
      where: { id: id },
      include: {
        client: {
          select: {
            id: true,
            nom: true,
            name: true,
            email: true,
            company: true,
            phone: true,
            address: true,
            typeClient: true,
            secteurActivite: true,
            chiffreAffaires: true,
          }
        },
        relances: {
          orderBy: { dateRelance: 'desc' },
        },
        taches: {
          orderBy: { dateEcheance: 'asc' },
        }
      }
    });

    if (!opportunite) {
      return NextResponse.json(
        { error: 'Opportunité non trouvée' },
        { status: 404 }
      );
    }

    // Récupérer l'historique des actions pour cette opportunité
    const historique = await prisma.historiqueActionCRM.findMany({
      where: {
        entite: 'opportunite',
        entiteId: id
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    return NextResponse.json({
      ...opportunite,
      historique
    });

  } catch (error) {
    console.error('Erreur lors de la récupération de l\'opportunité:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de la récupération de l\'opportunité' },
      { status: 500 }
    );
  }
}

// PUT - Mettre à jour une opportunité
export async function PUT(
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

    // Vérifier que l'opportunité existe
    const existingOpportunite = await prisma.opportunite.findUnique({
      where: { id: id }
    });

    if (!existingOpportunite) {
      return NextResponse.json(
        { error: 'Opportunité non trouvée' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validatedData = UpdateOpportuniteSchema.parse(body);

    // Préparer les données pour la mise à jour
    const updateData: any = { ...validatedData };
    
    // Gérer les dates
    if (validatedData.dateCloture) {
      updateData.dateCloture = new Date(validatedData.dateCloture);
    }
    if (validatedData.dateCloturePrevisionnelle) {
      updateData.dateCloturePrevisionnelle = new Date(validatedData.dateCloturePrevisionnelle);
    }
    if (validatedData.dateProchainSuivi) {
      updateData.dateProchainSuivi = new Date(validatedData.dateProchainSuivi);
    }

    // Mettre à jour l'opportunité
    const opportunite = await prisma.opportunite.update({
      where: { id: id },
      data: updateData,
      include: {
        client: {
          select: {
            id: true,
            nom: true,
            name: true,
            email: true,
            company: true,
            phone: true,
            typeClient: true,
          }
        }
      }
    });

    // Log de l'action dans l'historique CRM
    await prisma.historiqueActionCRM.create({
      data: {
        action: 'MODIFICATION_OPPORTUNITE',
        entite: 'opportunite',
        entiteId: opportunite.id,
        ancienneValeur: {
          titre: existingOpportunite.titre,
          statut: existingOpportunite.statut,
          valeurEstimee: existingOpportunite.valeurEstimee,
          probabilite: existingOpportunite.probabilite
        },
        nouvelleValeur: {
          titre: opportunite.titre,
          statut: opportunite.statut,
          valeurEstimee: opportunite.valeurEstimee,
          probabilite: opportunite.probabilite
        },
        userId: session.user.id,
        userName: session.user.name || session.user.email || 'Utilisateur',
      }
    });

    // Logique d'automatisation selon le changement de statut
    if (validatedData.statut && validatedData.statut !== existingOpportunite.statut) {
      await handleStatutChange(opportunite, validatedData.statut, session.user.id);
      
      // Déclencher les workflows automatiques
      await executeWorkflows('CHANGEMENT_STATUT', {
        opportuniteId: opportunite.id,
        clientId: opportunite.clientId,
        userId: session.user.id,
        ancienStatut: existingOpportunite.statut,
        nouveauStatut: validatedData.statut,
        client: opportunite.client,
        priorite: opportunite.priorite,
        valeurEstimee: opportunite.valeurEstimee,
        dateCreation: opportunite.createdAt.toISOString(),
        type: 'opportunite'
      });
    }

    return NextResponse.json(opportunite);

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Erreur lors de la mise à jour de l\'opportunité:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de la mise à jour de l\'opportunité' },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer une opportunité
export async function DELETE(
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

    // Vérifier que l'opportunité existe
    const existingOpportunite = await prisma.opportunite.findUnique({
      where: { id: id }
    });

    if (!existingOpportunite) {
      return NextResponse.json(
        { error: 'Opportunité non trouvée' },
        { status: 404 }
      );
    }

    // Supprimer l'opportunité et toutes les données liées
    await prisma.$transaction([
      // Supprimer les tâches liées
      prisma.tacheCommerciale.deleteMany({
        where: { opportuniteId: id }
      }),
      // Supprimer les relances liées
      prisma.relanceCommerciale.deleteMany({
        where: { opportuniteId: id }
      }),
      // Supprimer l'opportunité
      prisma.opportunite.delete({
        where: { id: id }
      })
    ]);

    // Log de l'action dans l'historique CRM
    await prisma.historiqueActionCRM.create({
      data: {
        action: 'SUPPRESSION_OPPORTUNITE',
        entite: 'opportunite',
        entiteId: id,
        ancienneValeur: {
          titre: existingOpportunite.titre,
          valeurEstimee: existingOpportunite.valeurEstimee,
          statut: existingOpportunite.statut,
          clientId: existingOpportunite.clientId
        },
        userId: session.user.id,
        userName: session.user.name || session.user.email || 'Utilisateur',
      }
    });

    return NextResponse.json({ message: 'Opportunité supprimée avec succès' });

  } catch (error) {
    console.error('Erreur lors de la suppression de l\'opportunité:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de la suppression de l\'opportunité' },
      { status: 500 }
    );
  }
}

// Fonction auxiliaire pour gérer les changements de statut
async function handleStatutChange(opportunite: any, nouveauStatut: string, userId: string) {
  try {
    switch (nouveauStatut) {
      case 'GAGNE':
        // Opportunité gagnée - mettre la probabilité à 100% et la date de clôture à maintenant
        await prisma.opportunite.update({
          where: { id: opportunite.id },
          data: {
            probabilite: 100,
            dateCloture: new Date()
          }
        });
        
        // Créer une tâche pour transformer en devis si pas encore fait
        if (!opportunite.devisAssocie) {
          await prisma.tacheCommerciale.create({
            data: {
              opportuniteId: opportunite.id,
              titre: `Créer devis pour: ${opportunite.titre}`,
              description: `Opportunité gagnée - créer le devis pour le client.`,
              dateEcheance: new Date(Date.now() + 24 * 60 * 60 * 1000), // Demain
              priorite: 'HAUTE',
              assigneTo: userId,
              createdBy: userId,
            }
          });
        }
        break;

      case 'PERDU':
        // Opportunité perdue - mettre la probabilité à 0% et la date de clôture
        await prisma.opportunite.update({
          where: { id: opportunite.id },
          data: {
            probabilite: 0,
            dateCloture: new Date()
          }
        });
        break;

      case 'PROPOSITION':
        // Créer une tâche de relance automatique dans 5 jours
        await prisma.tacheCommerciale.create({
          data: {
            opportuniteId: opportunite.id,
            titre: `Relancer proposition: ${opportunite.titre}`,
            description: `Relancer le client suite à l'envoi de la proposition.`,
            dateEcheance: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // Dans 5 jours
            priorite: 'NORMALE',
            assigneTo: userId,
            createdBy: userId,
          }
        });
        break;
    }
  } catch (error) {
    console.error('Erreur lors de l\'automatisation du changement de statut:', error);
  }
}