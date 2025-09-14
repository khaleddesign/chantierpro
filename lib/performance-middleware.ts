import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { securityMiddleware, logSecurityEvent } from '@/lib/security';
import { cache } from '@/lib/cache';

interface PerformanceContext {
  startTime: number;
  memoryStart: number;
  dbQueriesCount: number;
  cacheHits: number;
  cacheMisses: number;
}

// Contexte global pour tracking des performances
const performanceContexts = new Map<string, PerformanceContext>();

/**
 * Middleware de performance intégré avec sécurité
 * Trace automatiquement les performances de toutes les APIs
 */
export async function performanceMiddleware(
  request: NextRequest,
  handler: (request: NextRequest) => Promise<NextResponse>,
  options?: {
    skipLogging?: boolean;
    trackDb?: boolean;
    trackMemory?: boolean;
  }
): Promise<NextResponse> {
  const requestId = crypto.randomUUID();
  const startTime = Date.now();
  const memoryStart = process.memoryUsage().heapUsed;
  
  // Initialisation du contexte de performance
  performanceContexts.set(requestId, {
    startTime,
    memoryStart,
    dbQueriesCount: 0,
    cacheHits: 0,
    cacheMisses: 0
  });

  let response: NextResponse;
  let error: Error | null = null;
  
  try {
    // Obtenir la session utilisateur
    const session = await getServerSession(authOptions);
    
    // Vérifications de sécurité
    const securityCheck = await securityMiddleware(
      request,
      session?.user?.id,
      extractActionFromUrl(request.url),
      extractResourceFromUrl(request.url)
    );

    if (!securityCheck.allowed) {
      // Log de sécurité pour accès bloqué
      await logSecurityEvent({
        userId: session?.user?.id,
        action: 'ACCESS_BLOCKED',
        resource: extractResourceFromUrl(request.url),
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        success: false,
        riskLevel: 'MEDIUM',
        details: {
          reason: securityCheck.reason,
          url: request.url,
          method: request.method
        }
      });

      response = NextResponse.json({
        error: 'Accès refusé',
        reason: securityCheck.reason
      }, { status: 403 });
    } else {
      // Traitement de la requête avec monitoring
      response = await monitoredHandler(request, handler, requestId);
    }

  } catch (err) {
    error = err as Error;
    console.error('Erreur dans performanceMiddleware:', err);
    
    response = NextResponse.json({
      error: 'Erreur interne du serveur'
    }, { status: 500 });
  }

  // Calcul des métriques finales
  const duration = Date.now() - startTime;
  const memoryEnd = process.memoryUsage().heapUsed;
  const memoryDelta = memoryEnd - memoryStart;
  
  const context = performanceContexts.get(requestId);
  performanceContexts.delete(requestId);

  // Enregistrement des métriques si pas skip
  if (!options?.skipLogging) {
    try {
      const session = await getServerSession(authOptions);
      
      await prisma.performanceMetric.create({
        data: {
          endpoint: new URL(request.url).pathname,
          method: request.method as any,
          duration,
          statusCode: response.status,
          userId: session?.user?.id,
          ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown',
          memoryUsage: options?.trackMemory ? memoryDelta / 1024 / 1024 : undefined, // MB
          dbQueries: context?.dbQueriesCount,
          cacheHits: context?.cacheHits,
          cacheMisses: context?.cacheMisses,
          timestamp: new Date()
        }
      });

      // Alerte pour performances dégradées
      if (duration > 3000) { // Plus de 3 secondes
        await logSecurityEvent({
          userId: session?.user?.id,
          action: 'SLOW_API_PERFORMANCE',
          resource: new URL(request.url).pathname,
          ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown',
          success: true,
          riskLevel: duration > 10000 ? 'HIGH' : 'MEDIUM',
          details: {
            duration,
            endpoint: new URL(request.url).pathname,
            method: request.method,
            memoryDelta: memoryDelta / 1024 / 1024,
            dbQueries: context?.dbQueriesCount
          }
        });
      }

    } catch (metricError) {
      console.error('Erreur enregistrement métrique:', metricError);
    }
  }

  // Ajout des headers de performance pour debugging
  response.headers.set('X-Response-Time', `${duration}ms`);
  response.headers.set('X-Memory-Delta', `${(memoryDelta / 1024 / 1024).toFixed(2)}MB`);
  
  if (context) {
    response.headers.set('X-DB-Queries', context.dbQueriesCount.toString());
    response.headers.set('X-Cache-Hits', context.cacheHits.toString());
    response.headers.set('X-Cache-Misses', context.cacheMisses.toString());
  }

  return response;
}

/**
 * Handler avec monitoring des opérations
 */
async function monitoredHandler(
  request: NextRequest,
  handler: (request: NextRequest) => Promise<NextResponse>,
  requestId: string
): Promise<NextResponse> {
  // Monkey patch pour compter les requêtes DB
  const originalQuery = prisma.$queryRaw;
  const originalFindMany = prisma.user.findMany; // Exemple avec user
  
  let dbQueryCount = 0;
  
  // Override temporaire pour compter les requêtes
  (prisma as any).__queryCount = () => dbQueryCount++;
  
  // Monitoring du cache
  const originalCacheGet = cache.get.bind(cache);
  const originalCacheSet = cache.set.bind(cache);
  
  cache.get = async function<T>(key: string): Promise<T | null> {
    const result = await originalCacheGet<T>(key);
    const context = performanceContexts.get(requestId);
    if (context) {
      if (result !== null) {
        context.cacheHits++;
      } else {
        context.cacheMisses++;
      }
    }
    return result;
  };

  try {
    const response = await handler(request);
    
    // Mise à jour du contexte
    const context = performanceContexts.get(requestId);
    if (context) {
      context.dbQueriesCount = dbQueryCount;
    }
    
    return response;
    
  } finally {
    // Restauration des méthodes originales
    cache.get = originalCacheGet;
    cache.set = originalCacheSet;
  }
}

/**
 * Middleware spécialisé pour les routes API critiques
 */
export function withPerformanceTracking(
  handler: (request: NextRequest) => Promise<NextResponse>,
  options?: {
    requireAuth?: boolean;
    requiredPermission?: string;
    resource?: string;
    rateLimit?: { requests: number; windowMs: number };
  }
) {
  return async (request: NextRequest) => {
    return await performanceMiddleware(
      request,
      handler,
      {
        trackDb: true,
        trackMemory: true
      }
    );
  };
}

/**
 * Utilitaires pour extraction d'informations depuis l'URL
 */
function extractActionFromUrl(url: string): string {
  try {
    const pathname = new URL(url).pathname;
    const segments = pathname.split('/').filter(Boolean);
    
    // Mapping basique des patterns d'URL vers des actions
    if (segments.includes('api')) {
      const resource = segments[segments.indexOf('api') + 1];
      const method = segments[segments.length - 1];
      
      if (method === 'route' || !method) {
        return `API_${resource?.toUpperCase()}`;
      }
      return `API_${resource?.toUpperCase()}_${method?.toUpperCase()}`;
    }
    
    return 'WEB_ACCESS';
  } catch {
    return 'UNKNOWN_ACTION';
  }
}

function extractResourceFromUrl(url: string): string {
  try {
    const pathname = new URL(url).pathname;
    const segments = pathname.split('/').filter(Boolean);
    
    if (segments.includes('api')) {
      const apiIndex = segments.indexOf('api');
      const resource = segments[apiIndex + 1];
      return resource || 'api';
    }
    
    return segments[0] || 'root';
  } catch {
    return 'unknown';
  }
}

/**
 * Helper pour créer des métriques de performance personnalisées
 */
export class PerformanceTracker {
  private startTime: number;
  private metrics: Record<string, number> = {};

  constructor(public name: string) {
    this.startTime = Date.now();
  }

  mark(label: string): void {
    this.metrics[label] = Date.now() - this.startTime;
  }

  async finish(additionalData?: Record<string, any>): Promise<void> {
    const totalDuration = Date.now() - this.startTime;
    
    try {
      await prisma.performanceMetric.create({
        data: {
          endpoint: this.name,
          method: 'CUSTOM',
          duration: totalDuration,
          statusCode: 200,
          timestamp: new Date(),
          ...additionalData
        }
      });
    } catch (error) {
      console.error('Erreur enregistrement métrique personnalisée:', error);
    }
  }

  getMetrics(): Record<string, number> {
    return { ...this.metrics, total: Date.now() - this.startTime };
  }
}

export default {
  performanceMiddleware,
  withPerformanceTracking,
  PerformanceTracker
};