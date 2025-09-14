import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Schema de validation pour créer une opportunité
const OpportuniteSchema = z.object({
  clientId: z.string().cuid(),
  titre: z.string().min(1, 'Le titre est requis'),
  description: z.string().min(1, 'La description est requise'),
  valeurEstimee: z.number().positive('La valeur doit être positive'),
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

// GET - Récupérer les opportunités
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
    const statut = searchParams.get('statut');
    const priorite = searchParams.get('priorite');
    const assigneACommercial = searchParams.get('assigneACommercial');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Construire les filtres
    const where: any = {};
    
    if (clientId) where.clientId = clientId;
    if (statut) where.statut = statut;
    if (priorite) where.priorite = priorite;
    if (assigneACommercial) where.assigneACommercial = assigneACommercial;

    // Récupérer les opportunités avec les relations
    const opportunites = await prisma.opportunite.findMany({
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
            typeClient: true,
          }
        },
        relances: {
          orderBy: { dateRelance: 'desc' },
          take: 3
        },
        taches: {
          where: { statut: { not: 'TERMINE' } },
          orderBy: { dateEcheance: 'asc' },
          take: 5
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit,
    });

    // Compter le total pour la pagination
    const total = await prisma.opportunite.count({ where });

    // Statistiques rapides
    const stats = await prisma.opportunite.groupBy({
      by: ['statut'],
      _count: { _all: true },
      _sum: { valeurEstimee: true },
    });

    return NextResponse.json({
      opportunites,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      },
      stats
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des opportunités:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de la récupération des opportunités' },
      { status: 500 }
    );
  }
}

// POST - Créer une nouvelle opportunité
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
    const validatedData = OpportuniteSchema.parse(body);

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

    // Préparer les données pour la création
    const createData: any = {
      ...validatedData,
      statut: validatedData.statut || 'PROSPECT',
      probabilite: validatedData.probabilite || 50,
      priorite: validatedData.priorite || 'NORMALE',
    };

    // Gérer les dates
    if (validatedData.dateCloture) {
      createData.dateCloture = new Date(validatedData.dateCloture);
    }
    if (validatedData.dateCloturePrevisionnelle) {
      createData.dateCloturePrevisionnelle = new Date(validatedData.dateCloturePrevisionnelle);
    }
    if (validatedData.dateProchainSuivi) {
      createData.dateProchainSuivi = new Date(validatedData.dateProchainSuivi);
    }

    // Créer l'opportunité
    const opportunite = await prisma.opportunite.create({
      data: createData,
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
        action: 'CREATION_OPPORTUNITE',
        entite: 'opportunite',
        entiteId: opportunite.id,
        nouvelleValeur: {
          titre: opportunite.titre,
          valeurEstimee: opportunite.valeurEstimee,
          statut: opportunite.statut,
          clientId: opportunite.clientId
        },
        userId: session.user.id,
        userName: session.user.name || session.user.email || 'Utilisateur',
      }
    });

    // Créer une tâche de suivi automatique si date de suivi définie
    if (validatedData.dateProchainSuivi) {
      await prisma.tacheCommerciale.create({
        data: {
          opportuniteId: opportunite.id,
          titre: `Suivi de l'opportunité: ${opportunite.titre}`,
          description: `Prendre contact avec ${client.name || client.nom} pour faire le point sur l'opportunité.`,
          dateEcheance: new Date(validatedData.dateProchainSuivi),
          priorite: 'NORMALE',
          assigneTo: session.user.id,
          createdBy: session.user.id,
        }
      });
    }

    return NextResponse.json(opportunite, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Erreur lors de la création de l\'opportunité:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de la création de l\'opportunité' },
      { status: 500 }
    );
  }
}