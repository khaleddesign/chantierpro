import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Schema de validation pour créer une interaction
const InteractionSchema = z.object({
  clientId: z.string().cuid(),
  type: z.enum(['APPEL', 'EMAIL', 'VISITE', 'REUNION', 'AUTRE']),
  titre: z.string().min(1, 'Le titre est requis'),
  description: z.string().min(1, 'La description est requise'),
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

// GET - Récupérer les interactions
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
    const clientId = searchParams.get('clientId');
    const chantierId = searchParams.get('chantierId');
    const type = searchParams.get('type');
    const statut = searchParams.get('statut');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Construire les filtres
    const where: any = {};
    
    if (clientId) where.clientId = clientId;
    if (chantierId) where.chantierId = chantierId;
    if (type) where.type = type;
    if (statut) where.statut = statut;

    // Récupérer les interactions avec les relations
    const interactions = await prisma.interactionClient.findMany({
      where,
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
      },
      orderBy: { dateContact: 'desc' },
      skip: offset,
      take: limit,
    });

    // Compter le total pour la pagination
    const total = await prisma.interactionClient.count({ where });

    return NextResponse.json({
      interactions,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des interactions:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de la récupération des interactions' },
      { status: 500 }
    );
  }
}

// POST - Créer une nouvelle interaction
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = InteractionSchema.parse(body);

    // Vérifier que le client existe et est accessible
    const client = await prisma.user.findFirst({
      where: {
        id: validatedData.clientId,
        role: 'CLIENT'
      }
    });

    if (!client) {
      return NextResponse.json(
        { error: 'Client non trouvé' },
        { status: 404 }
      );
    }

    // Créer l'interaction
    const interaction = await prisma.interactionClient.create({
      data: {
        ...validatedData,
        dateContact: validatedData.dateContact ? new Date(validatedData.dateContact) : new Date(),
        prochaineSuite: validatedData.prochaineSuite ? new Date(validatedData.prochaineSuite) : undefined,
        rappelDate: validatedData.rappelDate ? new Date(validatedData.rappelDate) : undefined,
        createdBy: session.user.id,
        createdByName: session.user.name || session.user.email,
        statut: validatedData.statut || 'A_TRAITER',
        importance: validatedData.importance || 3,
      },
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
        action: 'CREATION_INTERACTION',
        entite: 'interaction',
        entiteId: interaction.id,
        nouvelleValeur: {
          type: interaction.type,
          titre: interaction.titre,
          clientId: interaction.clientId
        },
        userId: session.user.id,
        userName: session.user.name || session.user.email || 'Utilisateur',
      }
    });

    return NextResponse.json(interaction, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Erreur lors de la création de l\'interaction:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de la création de l\'interaction' },
      { status: 500 }
    );
  }
}