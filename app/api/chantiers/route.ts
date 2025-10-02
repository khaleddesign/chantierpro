// Force Node.js runtime pour les opérations de base de données
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest } from "next/server";
import { 
  withErrorHandling, 
  requireAuth, 
  createSuccessResponse,
  createPaginatedResponse,
  logUserAction,
  checkRateLimit,
  APIError
} from '@/lib/api-helpers';
import { validateAndSanitize } from '@/lib/validations/crm';
import { ChantiersQuerySchema, ChantierCreateSchema } from '@/lib/validations';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

// GET /api/chantiers - Récupérer la liste des chantiers
// VERSION: 2025-10-02-v5
export const GET = withErrorHandling(async (request: NextRequest) => {
  // Log immédiat pour vérifier que le handler s'exécute
  console.error('🚀🚀🚀 GET /api/chantiers HANDLER STARTED - VERSION 2025-10-02-v5 🚀🚀🚀');

  const session = await requireAuth(['ADMIN', 'COMMERCIAL', 'CLIENT'], request);
  console.error('✅ Session obtenue après requireAuth');

  if (!checkRateLimit(`chantiers:${session.user.id}`, 200, 15 * 60 * 1000)) {
    throw new APIError('Trop de requêtes, veuillez réessayer plus tard', 429);
  }

  const { searchParams } = new URL(request.url);

  const paramsValidation = validateAndSanitize(ChantiersQuerySchema, {
    page: searchParams.get('page') || '1',
    limit: searchParams.get('limit') || '20',
    search: searchParams.get('search') || undefined,
    status: searchParams.get('status') || undefined,
    clientId: searchParams.get('clientId') || undefined,
    includeDeleted: searchParams.get('includeDeleted') || undefined
  });

  if (!paramsValidation.success) {
    throw new APIError(`Paramètres invalides: ${paramsValidation.errors?.join(', ')}`, 400);
  }

  const { page, limit, search, status, clientId, includeDeleted } = paramsValidation.data as {
    page: number;
    limit: number;
    search?: string;
    status?: string;
    clientId?: string;
    includeDeleted?: boolean;
  };
  const skip = (page - 1) * limit;

  // Construction des filtres selon le rôle
  const whereClause: any = {};
  
  // Soft delete (sauf pour les admins qui demandent explicitement)
  if (!includeDeleted || session.user.role !== "ADMIN") {
    whereClause.deletedAt = null;
  }
  
  // Filtrage par rôle utilisateur
  if (session.user.role === "CLIENT") {
    whereClause.clientId = session.user.id;
  } else if (session.user.role === "COMMERCIAL") {
    // TEMPORAIRE: ne pas filtrer par commercial tant que commercialId n'est pas renseigné pour les clients
    // Objectif: débloquer l'affichage des chantiers pour les commerciaux
    console.log('🔍 Filtrage COMMERCIAL TEMPORAIRE (pas de filtre commercialId)', {
      userId: session.user.id,
      role: session.user.role
    });
    // whereClause.client = { commercialId: session.user.id };
  }
  
  // Ajouter le filtre clientId si spécifié
  if (clientId) {
    whereClause.clientId = clientId;
  }
  
  // Filtres de recherche
  if (search) {
    whereClause.OR = [
      { nom: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
      { adresse: { contains: search, mode: "insensitive" } },
      { client: { name: { contains: search, mode: "insensitive" } } }
    ];
  }
  
  if (status && status !== "TOUS") {
    whereClause.statut = status as any; // cast souple, enum côté Prisma
  }
  
  // Debug: Log des filtres appliqués
  console.log('🔍 Filtres appliqués:', {
    role: session.user.role,
    userId: session.user.id,
    whereClause: JSON.stringify(whereClause, null, 2)
  });
  const [chantiers, total] = await Promise.all([
    prisma.chantier.findMany({
      where: whereClause,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            company: true,
            phone: true,
            commercialId: true, // Ajouter commercialId pour debug
          }
        },
        _count: {
          select: {
            messages: true,
            comments: true,
            etapes: true,
            documents: true,
          }
        }
      }
    }),
    prisma.chantier.count({ where: whereClause })
  ]);

  // Debug: Log des résultats
  console.log('📊 Résultats API:', {
    chantiersTrouves: chantiers.length,
    total: total,
    premierChantier: chantiers[0] ? {
      id: chantiers[0].id,
      nom: chantiers[0].nom,
      clientId: chantiers[0].clientId,
      clientCommercialId: chantiers[0].client?.commercialId
    } : null
  });

  await logUserAction(
    session.user.id,
    'GET_CHANTIERS',
    'chantiers',
    undefined,
    { search, status, clientId, page, limit, total: chantiers.length },
    request
  );

  return createPaginatedResponse(chantiers, total, page, limit, 'Chantiers récupérés avec succès');
});

// POST /api/chantiers - Créer un nouveau chantier
// VERSION: 2025-10-02-v6 - FORCE REBUILD WITH NEW VALIDATION SCHEMA
export const POST = withErrorHandling(async (request: NextRequest) => {
  console.error('🚀🚀🚀 POST /api/chantiers HANDLER STARTED - VERSION 2025-10-02-v5 🚀🚀🚀');

  const session = await requireAuth(['ADMIN', 'COMMERCIAL'], request);
  console.error('✅ POST - Session obtenue après requireAuth');
  
  if (!checkRateLimit(`chantiers:${session.user.id}`, 10, 15 * 60 * 1000)) {
    throw new APIError('Trop de créations, veuillez réessayer plus tard', 429);
  }

  const body = await request.json();
  console.error('📦 POST - Body reçu:', JSON.stringify(body));

  const validation = validateAndSanitize(ChantierCreateSchema, body);
  console.error('🔍 POST - Validation result:', { success: validation.success, errors: validation.errors });

  if (!validation.success) {
    console.error('❌ POST - Validation échouée, throwing APIError');
    throw new APIError(`Données invalides: ${validation.errors?.join(', ')}`, 400);
  }

  console.error('✅ POST - Validation réussie');

  const chantierData = validation.data as {
    nom: string;
    description: string;
    adresse: string;
    clientId: string;
    dateDebut: string;
    dateFin: string;
    budget: number;
    superficie?: string;
    photo?: string;
    photos?: string;
    lat?: number;
    lng?: number;
  };

  // Vérifier que le client existe
  const client = await prisma.user.findUnique({
    where: { id: chantierData.clientId },
    select: { id: true, role: true, commercialId: true }
  });

  if (!client) {
    throw new APIError('Client non trouvé', 400);
  }

  // Vérifier les permissions pour les commerciaux
  if (session.user.role === "COMMERCIAL" && client.commercialId !== session.user.id) {
    throw new APIError('Permissions insuffisantes pour ce client', 403);
  }

  const newChantier = await prisma.chantier.create({
    data: {
      nom: chantierData.nom,
      description: chantierData.description,
      adresse: chantierData.adresse,
      clientId: chantierData.clientId,
      dateDebut: new Date(chantierData.dateDebut),
      dateFin: new Date(chantierData.dateFin),
      budget: chantierData.budget,
      superficie: chantierData.superficie || "",
      photo: chantierData.photo,
      photos: chantierData.photos,
      lat: chantierData.lat,
      lng: chantierData.lng
    },
    include: {
      client: {
        select: {
          id: true,
          name: true,
          email: true,
          company: true,
          phone: true,
        }
      }
    }
  });

  await logUserAction(
    session.user.id, 
    'CREATE_CHANTIER', 
    'chantiers', 
    newChantier.id, 
    { nom: newChantier.nom, clientId: newChantier.clientId, budget: newChantier.budget },
    request
  );

  return createSuccessResponse(newChantier, 'Chantier créé avec succès', 201);
});