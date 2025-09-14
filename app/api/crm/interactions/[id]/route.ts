import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Schema de validation pour mettre à jour une interaction
const UpdateInteractionSchema = z.object({
  type: z.enum(['APPEL', 'EMAIL', 'VISITE', 'REUNION', 'AUTRE']).optional(),
  titre: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  dateContact: z.string().datetime().optional(),
  prochaineSuite: z.string().datetime().optional(),
  dureeMinutes: z.number().int().positive().optional(),
  resultats: z.string().optional(),
  pieceJointe: z.string().url().optional(),
  localisation: z.string().optional(),
  rappelDate: z.string().datetime().optional(),
  statut: z.enum(['A_TRAITER', 'EN_COURS', 'TERMINE', 'REPORTE']).optional(),
  chantierId: z.string().cuid().optional(),
  devisId: z.string().cuid().optional(),
  opportuniteId: z.string().cuid().optional(),
  tags: z.string().optional(),
  importance: z.number().int().min(1).max(3).optional(),
  satisfaction: z.string().optional(),
});

// GET - Récupérer une interaction spécifique
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

    const interaction = await prisma.interactionClient.findUnique({
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
          }
        }
      }
    });

    if (!interaction) {
      return NextResponse.json(
        { error: 'Interaction non trouvée' },
        { status: 404 }
      );
    }

    return NextResponse.json(interaction);

  } catch (error) {
    console.error('Erreur lors de la récupération de l\'interaction:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de la récupération de l\'interaction' },
      { status: 500 }
    );
  }
}

// PUT - Mettre à jour une interaction
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

    // Vérifier que l'interaction existe
    const existingInteraction = await prisma.interactionClient.findUnique({
      where: { id: id }
    });

    if (!existingInteraction) {
      return NextResponse.json(
        { error: 'Interaction non trouvée' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validatedData = UpdateInteractionSchema.parse(body);

    // Préparer les données pour la mise à jour
    const updateData: any = { ...validatedData };
    
    if (validatedData.dateContact) {
      updateData.dateContact = new Date(validatedData.dateContact);
    }
    if (validatedData.prochaineSuite) {
      updateData.prochaineSuite = new Date(validatedData.prochaineSuite);
    }
    if (validatedData.rappelDate) {
      updateData.rappelDate = new Date(validatedData.rappelDate);
    }

    // Mettre à jour l'interaction
    const interaction = await prisma.interactionClient.update({
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
          }
        }
      }
    });

    // Log de l'action dans l'historique CRM
    await prisma.historiqueActionCRM.create({
      data: {
        action: 'MODIFICATION_INTERACTION',
        entite: 'interaction',
        entiteId: interaction.id,
        ancienneValeur: {
          titre: existingInteraction.titre,
          statut: existingInteraction.statut,
          type: existingInteraction.type
        },
        nouvelleValeur: {
          titre: interaction.titre,
          statut: interaction.statut,
          type: interaction.type
        },
        userId: session.user.id,
        userName: session.user.name || session.user.email || 'Utilisateur',
      }
    });

    return NextResponse.json(interaction);

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Erreur lors de la mise à jour de l\'interaction:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de la mise à jour de l\'interaction' },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer une interaction
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

    // Vérifier que l'interaction existe
    const existingInteraction = await prisma.interactionClient.findUnique({
      where: { id: id }
    });

    if (!existingInteraction) {
      return NextResponse.json(
        { error: 'Interaction non trouvée' },
        { status: 404 }
      );
    }

    // Supprimer l'interaction
    await prisma.interactionClient.delete({
      where: { id: id }
    });

    // Log de l'action dans l'historique CRM
    await prisma.historiqueActionCRM.create({
      data: {
        action: 'SUPPRESSION_INTERACTION',
        entite: 'interaction',
        entiteId: id,
        ancienneValeur: {
          titre: existingInteraction.titre,
          type: existingInteraction.type,
          clientId: existingInteraction.clientId
        },
        userId: session.user.id,
        userName: session.user.name || session.user.email || 'Utilisateur',
      }
    });

    return NextResponse.json({ message: 'Interaction supprimée avec succès' });

  } catch (error) {
    console.error('Erreur lors de la suppression de l\'interaction:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de la suppression de l\'interaction' },
      { status: 500 }
    );
  }
}