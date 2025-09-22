# Plan de Migration pour ROUTE_NAME

## Route: ROUTE_FILE

### Méthodes HTTP détectées
METHODS

### Dépendances spécialisées
DEPENDENCIES

### Schémas Zod existants
SCHEMAS

### Actions requises
1. ✅ Backup créé
2. 🔄 Appliquer le template standardisé
3. 🔧 Adapter les dépendances spécialisées (si nécessaire)
4. 📋 Créer les schémas Zod manquants
5. 🧪 Tester la route migrée
6. 🚀 Déployer

### Template à appliquer
```typescript
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
import { ROUTE_NAME_QuerySchema, ROUTE_NAME_CreateSchema } from '@/lib/validations';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

// GET /api/ROUTE_NAME - Récupérer la liste
export const GET = withErrorHandling(async (request: NextRequest) => {
  const session = await requireAuth(['ADMIN', 'COMMERCIAL']);
  
  if (!checkRateLimit(`ROUTE_NAME:${session.user.id}`, 200, 15 * 60 * 1000)) {
    throw new APIError('Trop de requêtes, veuillez réessayer plus tard', 429);
  }

  const { searchParams } = new URL(request.url);
  
  const paramsValidation = validateAndSanitize(ROUTE_NAME_QuerySchema, {
    page: searchParams.get('page') || '1',
    limit: searchParams.get('limit') || '20',
    search: searchParams.get('search') || undefined
  });

  if (!paramsValidation.success) {
    throw new APIError(`Paramètres invalides: ${paramsValidation.errors?.join(', ')}`, 400);
  }

  const { page, limit, search } = paramsValidation.data!;
  const skip = (page - 1) * limit;

  // Logique métier spécifique à ROUTE_NAME
  const whereClause: any = {};
  if (search) {
    whereClause.OR = [
      { nom: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } }
    ];
  }

  const [data, total] = await Promise.all([
    prisma.ROUTE_NAME.findMany({
      where: whereClause,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" }
    }),
    prisma.ROUTE_NAME.count({ where: whereClause })
  ]);

  await logUserAction(
    session.user.id, 
    'GET_ROUTE_NAME', 
    'ROUTE_NAME', 
    undefined, 
    { search, page, limit },
    request
  );

  return createPaginatedResponse(data, total, page, limit, 'ROUTE_NAME récupérés avec succès');
});

// POST /api/ROUTE_NAME - Créer un nouvel élément
export const POST = withErrorHandling(async (request: NextRequest) => {
  const session = await requireAuth(['ADMIN', 'COMMERCIAL']);
  
  if (!checkRateLimit(`ROUTE_NAME:${session.user.id}`, 10, 15 * 60 * 1000)) {
    throw new APIError('Trop de créations, veuillez réessayer plus tard', 429);
  }

  const body = await request.json();
  
  const validation = validateAndSanitize(ROUTE_NAME_CreateSchema, body);
  if (!validation.success) {
    throw new APIError(`Données invalides: ${validation.errors?.join(', ')}`, 400);
  }

  const data = validation.data!;

  const newItem = await prisma.ROUTE_NAME.create({
    data: data
  });

  await logUserAction(
    session.user.id, 
    'CREATE_ROUTE_NAME', 
    'ROUTE_NAME', 
    newItem.id, 
    { nom: newItem.nom },
    request
  );

  return createSuccessResponse(newItem, 'ROUTE_NAME créé avec succès', 201);
});
```
