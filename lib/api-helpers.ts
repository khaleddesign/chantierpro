import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import type { APIResponse, UserRole } from '@/types/crm';

// Classe personnalisée pour les erreurs API
export class APIError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'APIError';
  }
}

// Types pour éviter any
interface SecureLogger {
  error: (message: string, error: Error, metadata?: Record<string, unknown>, request?: NextRequest, userId?: string) => void;
  warn: (message: string, metadata?: Record<string, unknown>, request?: NextRequest, userId?: string) => void;
}

type CreateSafeErrorMessage = (error: unknown) => string;

// Fonction pour gérer les erreurs de manière centralisée et sécurisée
export async function handleAPIError(error: unknown, request?: NextRequest, userId?: string): Promise<NextResponse<APIResponse>> {
  // Import dynamique pour éviter les erreurs de dépendance circulaire
  let secureLogger: SecureLogger, createSafeErrorMessage: CreateSafeErrorMessage;
  try {
    const loggerModule = await import('@/lib/secure-logger');
    secureLogger = loggerModule.secureLogger;
    createSafeErrorMessage = loggerModule.createSafeErrorMessage;
  } catch (importError) {
    // Fallback si le logger n'est pas disponible
    console.error('Failed to import secure logger:', importError);
    secureLogger = { error: console.error, warn: console.warn };
    createSafeErrorMessage = () => 'Une erreur est survenue';
  }
  
  // Log sécurisé de l'erreur
  secureLogger.error(
    'API Error occurred',
    error instanceof Error ? error : new Error(String(error)),
    { 
      errorType: error instanceof APIError ? 'APIError' : 'UnknownError',
      originalMessage: String(error)
    },
    request,
    userId
  );

  if (error instanceof APIError) {
    return NextResponse.json<APIResponse>(
      {
        success: false,
        error: createSafeErrorMessage(error.message),
        message: error.code ? `Code: ${error.code}` : undefined
      },
      { status: error.statusCode }
    );
  }

  // Erreurs de validation Prisma
  if (error && typeof error === 'object' && 'code' in error) {
    const prismaError = error as { code: string; message: string };
    
    // Log spécifique pour les erreurs Prisma
    secureLogger.warn('Prisma database error', { 
      code: prismaError.code,
      type: 'database_error'
    }, request, userId);
    
    switch (prismaError.code) {
      case 'P2002':
        return NextResponse.json<APIResponse>(
          {
            success: false,
            error: 'Une ressource avec ces informations existe déjà'
          },
          { status: 409 }
        );
      case 'P2025':
        return NextResponse.json<APIResponse>(
          {
            success: false,
            error: 'Ressource non trouvée'
          },
          { status: 404 }
        );
      default:
        return NextResponse.json<APIResponse>(
          {
            success: false,
            error: createSafeErrorMessage('database')
          },
          { status: 500 }
        );
    }
  }

  // Erreur générique - utiliser un message sécurisé
  return NextResponse.json<APIResponse>(
    {
      success: false,
      error: createSafeErrorMessage(error)
    },
    { status: 500 }
  );
}

// Fonction pour vérifier l'authentification
export async function requireAuth(allowedRoles?: UserRole[]) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    throw new APIError('Authentication requise', 401);
  }

  if (allowedRoles && !allowedRoles.includes(session.user.role as UserRole)) {
    throw new APIError('Accès refusé - privilèges insuffisants', 403);
  }

  return session;
}

// Wrapper pour les handlers d'API avec gestion d'erreurs automatique et sécurisée
export function withErrorHandling<T extends unknown[]>(
  handler: (...args: T) => Promise<NextResponse>
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      return await handler(...args);
    } catch (error) {
      const request = args[0] as NextRequest;
      return handleAPIError(error, request);
    }
  };
}

// Fonction utilitaire pour créer des réponses de succès standardisées
export function createSuccessResponse<T>(
  data?: T,
  message?: string,
  status: number = 200
): NextResponse<APIResponse<T>> {
  return NextResponse.json<APIResponse<T>>(
    {
      success: true,
      data,
      message
    },
    { status }
  );
}

// Fonction utilitaire pour créer des réponses d'erreur standardisées
export function createErrorResponse(
  error: string,
  status: number = 400,
  message?: string
): NextResponse<APIResponse> {
  return NextResponse.json<APIResponse>(
    {
      success: false,
      error,
      message
    },
    { status }
  );
}

// Fonction pour valider et extraire les paramètres de pagination
export function extractPaginationParams(searchParams: URLSearchParams) {
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));
  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

// Fonction pour créer une réponse paginée
export function createPaginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
  message?: string
) {
  const totalPages = Math.ceil(total / limit);
  
  return createSuccessResponse({
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    }
  }, message);
}

// Fonction pour logger les actions utilisateur (audit trail) de manière sécurisée
export async function logUserAction(
  userId: string,
  action: string,
  resource: string,
  resourceId?: string,
  metadata?: Record<string, unknown>,
  request?: NextRequest
): Promise<void> {
  try {
    const { secureLogger } = await import('@/lib/secure-logger');
    
    secureLogger.audit(
      `User performed action: ${action} on ${resource}${resourceId ? ` (${resourceId})` : ''}`,
      {
        action,
        resource,
        resourceId,
        ...metadata
      },
      request,
      userId
    );
  } catch (error) {
    console.error('Failed to log user action:', error);
  }
}

// Fonction pour valider les UUIDs
export function isValidUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

// Fonction pour nettoyer les données sensibles avant de les retourner à l'API
export function sanitizeUserData<T extends Record<string, any>>(
  user: T,
  includePrivate: boolean = false
): any {
  const { password, refreshToken, ...publicData } = user;
  
  if (!includePrivate) {
    const { 
      chiffreAffaires, 
      commercialId, 
      prefEmail, 
      prefSMS, 
      prefAppel,
      ...safeData 
    } = publicData as any;
    return safeData;
  }
  
  return publicData;
}

// Rate limiting simple (à améliorer en production avec Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(
  identifier: string,
  maxRequests: number = 100,
  windowMs: number = 15 * 60 * 1000 // 15 minutes
): boolean {
  const now = Date.now();
  const userLimit = rateLimitStore.get(identifier);

  if (!userLimit || now > userLimit.resetTime) {
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + windowMs
    });
    return true;
  }

  if (userLimit.count >= maxRequests) {
    return false;
  }

  userLimit.count++;
  return true;
}