import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ClientCreateSchema, ClientFiltersSchema, validateAndSanitize } from '@/lib/validations/crm';
import { 
  withErrorHandling, 
  requireAuth, 
  createSuccessResponse, 
  createErrorResponse,
  createPaginatedResponse,
  extractPaginationParams,
  logUserAction,
  checkRateLimit,
  sanitizeUserData,
  APIError
} from '@/lib/api-helpers';
import { z } from 'zod';
import type { Client, PaginatedResponse, APIResponse, CRMStats } from '@/types/crm';

// Schema pour valider les paramètres de requête GET
const GetClientsQuerySchema = z.object({
  page: z.string().transform(val => Math.max(1, parseInt(val) || 1)),
  limit: z.string().transform(val => Math.min(100, Math.max(1, parseInt(val) || 20))),
  search: z.string().optional(),
  typeClient: z.enum(['PARTICULIER', 'PROFESSIONNEL', 'SYNDIC', 'PROMOTEUR', 'TOUS']).optional(),
  ville: z.string().optional(),
  commercial: z.string().optional(),
  sortBy: z.enum(['name', 'email', 'createdAt', 'chiffreAffaires', 'typeClient']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional()
});

// GET /api/crm/clients - Récupérer la liste des clients avec pagination et filtres
export const GET = withErrorHandling(async (request: NextRequest) => {
  // Vérification de l'authentification et des permissions
  const session = await requireAuth(['ADMIN', 'COMMERCIAL']);
  
  // Rate limiting
  if (!checkRateLimit(`user:${session.user.id}`, 200, 15 * 60 * 1000)) {
    throw new APIError('Trop de requêtes, veuillez réessayer plus tard', 429);
  }

  const { searchParams } = new URL(request.url);
  
  // Validation et extraction des paramètres
  const paramsValidation = validateAndSanitize(GetClientsQuerySchema, {
    page: searchParams.get('page') || '1',
    limit: searchParams.get('limit') || '20',
    search: searchParams.get('search') || undefined,
    typeClient: searchParams.get('typeClient') || undefined,
    ville: searchParams.get('ville') || undefined,
    commercial: searchParams.get('commercial') || undefined,
    sortBy: searchParams.get('sortBy') || 'createdAt',
    sortOrder: searchParams.get('sortOrder') || 'desc'
  });

  if (!paramsValidation.success) {
    throw new APIError(
      `Paramètres invalides: ${paramsValidation.errors?.join(', ')}`, 
      400
    );
  }

  const { page, limit, search, typeClient, ville, commercial, sortBy, sortOrder } = paramsValidation.data!;
  const skip = (page - 1) * limit;

  // Construction des filtres avec sécurité
  let whereClause: any = {
    role: 'CLIENT'
  };

  // Restriction d'accès pour les commerciaux
  if (session.user.role === 'COMMERCIAL') {
    whereClause.OR = [
      { commercialId: session.user.id },
      { id: session.user.id }
    ];
  }

  // Filtres de recherche
  if (search && search.trim().length > 0) {
    whereClause.AND = [
      ...(Array.isArray(whereClause.AND) ? whereClause.AND : []),
      {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { company: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } }
        ]
      }
    ];
  }

  if (typeClient && typeClient !== 'TOUS') {
    whereClause.typeClient = typeClient;
  }

  if (ville && ville.trim().length > 0) {
    whereClause.ville = { contains: ville, mode: 'insensitive' };
  }

  if (commercial && commercial.trim().length > 0) {
    whereClause.commercialId = commercial;
  }

  // Configuration du tri
  const orderBy: any = {};
  if (sortBy) {
    orderBy[sortBy] = sortOrder;
  }

  try {
    // Exécution des requêtes en parallèle pour optimiser les performances
    const [clients, totalCount, stats] = await Promise.all([
      // Récupération des clients
      prisma.user.findMany({
        where: whereClause,
        include: {
          commercial: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          _count: {
            select: {
              chantiers: true,
              devis: true,
              interactions: true,
              opportunites: true
            }
          }
        },
        orderBy,
        skip,
        take: limit
      }),
      
      // Comptage total
      prisma.user.count({ where: whereClause }),
      
      // Statistiques CRM
      session.user.role === 'ADMIN' ? prisma.$transaction([
        prisma.user.count({ where: { role: 'CLIENT' } }),
        prisma.user.count({
          where: {
            role: 'CLIENT',
            createdAt: {
              gte: new Date(new Date().setDate(new Date().getDate() - 30))
            }
          }
        }),
        prisma.user.groupBy({
          by: ['typeClient'],
          where: { role: 'CLIENT' },
          _count: true,
          orderBy: { typeClient: 'asc' }
        }),
        prisma.user.aggregate({
          where: { role: 'CLIENT', chiffreAffaires: { not: null } },
          _sum: { chiffreAffaires: true },
          _avg: { chiffreAffaires: true }
        })
      ]) : Promise.resolve(null)
    ]);

    // Traitement des statistiques
    let crmStats: CRMStats | undefined;
    if (stats) {
      const [total, nouveaux, parType, aggregates] = stats;
      crmStats = {
        totalClients: total,
        nouveauxClients: nouveaux,
        leadsActifs: Math.floor(total * 0.3), // Estimation
        pipelineTotal: aggregates._sum.chiffreAffaires || 0,
        tauxConversion: 24, // À calculer dynamiquement
        chiffreAffairesPrevisionnel: (aggregates._avg.chiffreAffaires || 0) * 1.2
      };
    }

    // Nettoyage des données sensibles
    const sanitizedClients = clients.map(client => 
      sanitizeUserData(client, session.user.role === 'ADMIN')
    );

    // Log de l'action
    logUserAction(
      session.user.id, 
      'LIST_CLIENTS', 
      'clients',
      undefined,
      { filters: { search, typeClient, ville }, pagination: { page, limit } }
    );

    // Réponse avec pagination
    return NextResponse.json<APIResponse<{
      clients: any[];
      stats?: CRMStats;
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
      };
    }>>({
      success: true,
      data: {
        clients: sanitizedClients as any,
        stats: crmStats,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit),
          hasNext: page < Math.ceil(totalCount / limit),
          hasPrev: page > 1
        }
      },
      message: `${totalCount} client(s) trouvé(s)`
    });

  } catch (error) {
    console.error('Erreur récupération clients CRM:', error);
    throw new APIError('Erreur lors de la récupération des clients', 500);
  }
});

// POST /api/crm/clients - Créer un nouveau client
export const POST = withErrorHandling(async (request: NextRequest) => {
  // Vérification de l'authentification et des permissions
  const session = await requireAuth(['ADMIN', 'COMMERCIAL']);
  
  // Rate limiting plus strict pour les créations
  if (!checkRateLimit(`create:${session.user.id}`, 50, 15 * 60 * 1000)) {
    throw new APIError('Trop de créations, veuillez réessayer plus tard', 429);
  }

  const body = await request.json();
  
  // Validation stricte avec Zod
  const validation = validateAndSanitize(ClientCreateSchema, body);
  
  if (!validation.success) {
    throw new APIError(
      `Données invalides: ${validation.errors?.join(', ')}`, 
      400
    );
  }

  const clientData = validation.data!;

  try {
    // Vérification de l'unicité de l'email
    const existingUser = await prisma.user.findUnique({
      where: { email: clientData.email }
    });

    if (existingUser) {
      throw new APIError('Un utilisateur avec cet email existe déjà', 409);
    }

    // Transaction pour créer le client et l'interaction initiale
    const result = await prisma.$transaction(async (tx) => {
      // Création du client
      const client = await tx.user.create({
        data: {
          name: clientData.name,
          email: clientData.email,
          phone: clientData.phone || null,
          company: clientData.company || null,
          address: clientData.address || null,
          adresse2: clientData.address || null, // Utiliser le même champ pour adresse2
          ville: clientData.ville || null,
          codePostal: clientData.codePostal || null,
          role: 'CLIENT',
          typeClient: clientData.typeClient,
          secteurActivite: clientData.secteurActivite || null,
          effectif: clientData.effectif || null,
          chiffreAffaires: clientData.chiffreAffaires || null,
          commercialId: session.user.role === 'COMMERCIAL' 
            ? session.user.id 
            : clientData.commercialId || null
        },
        include: {
          commercial: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          _count: {
            select: {
              chantiers: true,
              devis: true,
              interactions: true,
              opportunites: true
            }
          }
        }
      });

      // Création de l'interaction initiale
      await tx.interactionClient.create({
        data: {
          clientId: client.id,
          createdBy: session.user.id,
          type: 'AUTRE',
          objet: 'Création du client',
          description: `Client créé via le CRM par ${session.user.name}`,
          dateContact: new Date()
        }
      });

      return client;
    });

    // Log de l'action
    logUserAction(
      session.user.id, 
      'CREATE_CLIENT', 
      'client', 
      result.id,
      { clientName: clientData.name, clientType: clientData.typeClient }
    );

    // Nettoyage des données sensibles
    const sanitizedClient = sanitizeUserData(result, session.user.role === 'ADMIN');

    return createSuccessResponse(
      sanitizedClient as any,
      'Client créé avec succès',
      201
    );

  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    console.error('Erreur création client:', error);
    throw new APIError('Erreur lors de la création du client', 500);
  }
});