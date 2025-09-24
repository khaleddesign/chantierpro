// Force Node.js runtime for database operations
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
import { UserCreateSchema } from '@/lib/validations';
import { z } from 'zod';
import { Role } from "@prisma/client";
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// Schema de validation pour les paramètres GET
const GetUsersQuerySchema = z.object({
  page: z.string().transform(val => Math.max(1, parseInt(val) || 1)),
  limit: z.string().transform(val => Math.min(100, Math.max(1, parseInt(val) || 20))),
  search: z.string().optional(),
  role: z.enum(['ADMIN', 'COMMERCIAL', 'CLIENT', 'OUVRIER']).optional()
});

// GET /api/users - Récupérer la liste des utilisateurs
export const GET = withErrorHandling(async (request: NextRequest) => {
  // ✅ Authentification standardisée
  const session = await requireAuth(['ADMIN', 'COMMERCIAL']);
  
  // ✅ Rate limiting
  if (!checkRateLimit(`user:${session.user.id}`, 200, 15 * 60 * 1000)) {
    throw new APIError('Trop de requêtes, veuillez réessayer plus tard', 429);
  }

  const { searchParams } = new URL(request.url);
  
  // ✅ Validation automatique des paramètres
  const paramsValidation = validateAndSanitize(GetUsersQuerySchema, {
    page: searchParams.get('page') || '1',
    limit: searchParams.get('limit') || '20',
    search: searchParams.get('search') || undefined,
    role: searchParams.get('role') || undefined
  });

  if (!paramsValidation.success) {
    throw new APIError(`Paramètres invalides: ${paramsValidation.errors?.join(', ')}`, 400);
  }

  const { page, limit, search, role } = paramsValidation.data!;
  const skip = (page - 1) * limit;

  // ✅ Construction des filtres sécurisés
  const whereClause: any = {};
  
  if (role) {
    whereClause.role = role;
  }
  
  if (search) {
    whereClause.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { company: { contains: search, mode: "insensitive" } }
    ];
  }

  // ✅ Requête à la base de données
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where: whereClause,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        company: true,
        address: true,
        createdAt: true,
        // Exclure les champs sensibles
      }
    }),
    prisma.user.count({ where: whereClause })
  ]);

  // ✅ Audit trail
  await logUserAction(
    session.user.id, 
    'GET_USERS', 
    'users', 
    undefined, 
    { search, role, page, limit },
    request
  );

  // ✅ Réponse standardisée avec format attendu par le frontend
  return NextResponse.json({
    success: true,
    users: users,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1
    },
    message: 'Utilisateurs récupérés avec succès'
  });
});

// POST /api/users - Créer un nouvel utilisateur
export const POST = withErrorHandling(async (request: NextRequest) => {
  // ✅ Authentification admin uniquement
  const session = await requireAuth(['ADMIN']);
  
  // ✅ Rate limiting strict pour création
  if (!checkRateLimit(`user:${session.user.id}`, 10, 15 * 60 * 1000)) {
    throw new APIError('Trop de créations d\'utilisateurs, veuillez réessayer plus tard', 429);
  }

  const body = await request.json();
  
  // ✅ Validation avec schéma Zod
  const userValidation = validateAndSanitize(UserCreateSchema, body);
  if (!userValidation.success) {
    throw new APIError(`Données invalides: ${userValidation.errors?.join(', ')}`, 400);
  }

  const userData = userValidation.data as {
    name: string;
    email: string;
    password: string;
    role: Role;
    phone?: string;
    company?: string;
    address?: string;
  };

  // ✅ Vérification email unique
  const existingUser = await prisma.user.findUnique({
    where: { email: userData.email }
  });

  if (existingUser) {
    throw new APIError('Un utilisateur avec cet email existe déjà', 409);
  }

  // ✅ Hashage du mot de passe
  const hashedPassword = await bcrypt.hash(userData.password, 12);

  // ✅ Création de l'utilisateur
  const newUser = await prisma.user.create({
    data: {
      ...userData,
      password: hashedPassword,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      phone: true,
      company: true,
      address: true,
      createdAt: true,
    }
  });

  // ✅ Audit trail
  await logUserAction(
    session.user.id, 
    'CREATE_USER', 
    'users', 
    newUser.id, 
    { email: newUser.email, role: newUser.role },
    request
  );

  // ✅ Réponse standardisée
  return createSuccessResponse(newUser, 'Utilisateur créé avec succès', 201);
});