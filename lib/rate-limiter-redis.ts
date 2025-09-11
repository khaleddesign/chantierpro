import { NextRequest, NextResponse } from 'next/server';
import redis from './redis';

// Configuration du rate limiting par type d'endpoint
const RATE_LIMITS = {
  AUTH: { maxRequests: 5, windowMs: 15 * 60 * 1000 }, // 5 tentatives par 15 minutes pour auth
  UPLOAD: { maxRequests: 10, windowMs: 60 * 1000 }, // 10 uploads par minute
  API_READ: { maxRequests: 100, windowMs: 60 * 1000 }, // 100 lectures par minute
  API_WRITE: { maxRequests: 20, windowMs: 60 * 1000 }, // 20 écritures par minute
  FINANCIAL: { maxRequests: 5, windowMs: 60 * 1000 }, // 5 actions financières par minute
  DEFAULT: { maxRequests: 60, windowMs: 60 * 1000 } // 60 requêtes par minute par défaut
};

export type RateLimitType = keyof typeof RATE_LIMITS;

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  totalRequests: number;
}

export async function getRateLimit(
  identifier: string,
  type: RateLimitType = 'DEFAULT'
): Promise<RateLimitResult> {
  const config = RATE_LIMITS[type];
  const key = `rate_limit:${identifier}:${type}`;
  
  const current = await redis.get(key);
  
  if (!current) {
    // Première requête dans cette fenêtre
    await redis.setex(key, Math.ceil(config.windowMs / 1000), '1');
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime: Date.now() + config.windowMs,
      totalRequests: config.maxRequests
    };
  }
  
  const count = parseInt(current);
  if (count >= config.maxRequests) {
    // Limite atteinte
    const ttl = await redis.ttl(key);
    return {
      allowed: false,
      remaining: 0,
      resetTime: Date.now() + (ttl * 1000),
      totalRequests: config.maxRequests
    };
  }
  
  // Incrémenter le compteur
  await redis.incr(key);
  const ttl = await redis.ttl(key);
  
  return {
    allowed: true,
    remaining: config.maxRequests - count - 1,
    resetTime: Date.now() + (ttl * 1000),
    totalRequests: config.maxRequests
  };
}

export function createRateLimitMiddleware(type: RateLimitType = 'DEFAULT') {
  return async (request: NextRequest): Promise<NextResponse | null> => {
    // Obtenir l'identifiant client (IP + User-Agent pour plus de précision)
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : 
               request.headers.get('x-real-ip') || 
               'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    
    // Créer un hash simple de l'IP + User-Agent pour l'identifiant
    const identifier = `${ip}:${userAgent.slice(0, 50)}`;
    
    const result = await getRateLimit(identifier, type);
    
    if (!result.allowed) {
      return NextResponse.json(
        {
          error: 'Trop de requêtes. Veuillez réessayer plus tard.',
          retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
          type: 'RATE_LIMIT_EXCEEDED'
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': result.totalRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': result.resetTime.toString(),
            'Retry-After': Math.ceil((result.resetTime - Date.now()) / 1000).toString()
          }
        }
      );
    }
    
    // Ajouter les headers de rate limiting à la réponse
    request.headers.set('X-RateLimit-Limit', result.totalRequests.toString());
    request.headers.set('X-RateLimit-Remaining', result.remaining.toString());
    request.headers.set('X-RateLimit-Reset', result.resetTime.toString());
    
    return null; // Continue le traitement
  };
}

// Fonction wrapper pour appliquer le rate limiting à une route API
export function withRateLimit<T extends unknown[]>(
  handler: (...args: T) => Promise<NextResponse>,
  type: RateLimitType = 'DEFAULT'
) {
  return async (...args: T): Promise<NextResponse> => {
    const request = args[0] as NextRequest;
    
    // Appliquer le rate limiting
    const rateLimitResponse = await createRateLimitMiddleware(type)(request);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }
    
    // Continuer avec le handler original
    const response = await handler(...args);
    
    // Ajouter les headers de rate limiting à la réponse
    const limit = request.headers.get('X-RateLimit-Limit');
    const remaining = request.headers.get('X-RateLimit-Remaining');
    const reset = request.headers.get('X-RateLimit-Reset');
    
    if (limit) response.headers.set('X-RateLimit-Limit', limit);
    if (remaining) response.headers.set('X-RateLimit-Remaining', remaining);
    if (reset) response.headers.set('X-RateLimit-Reset', reset);
    
    return response;
  };
}

// Fonction utilitaire pour obtenir des statistiques de rate limiting
export async function getRateLimitStats(
  identifier: string,
  type: RateLimitType = 'DEFAULT'
): Promise<{
  current: number;
  limit: number;
  remaining: number;
  resetTime: number;
}> {
  const config = RATE_LIMITS[type];
  const key = `rate_limit:${identifier}:${type}`;
  
  const current = await redis.get(key);
  const count = current ? parseInt(current) : 0;
  const ttl = await redis.ttl(key);
  
  return {
    current: count,
    limit: config.maxRequests,
    remaining: Math.max(0, config.maxRequests - count),
    resetTime: Date.now() + (ttl * 1000)
  };
}

// Fonction pour reset le rate limiting d'un utilisateur (admin)
export async function resetRateLimit(
  identifier: string,
  type: RateLimitType = 'DEFAULT'
): Promise<void> {
  const key = `rate_limit:${identifier}:${type}`;
  await redis.del(key);
}

// Fonction pour obtenir les statistiques générales
export async function getGlobalRateLimitStats(): Promise<{
  redisStatus: object;
  activeRateLimits: number;
}> {
  const redisStatus = redis.getConnectionStatus();
  
  // Cette fonction nécessiterait une implémentation plus complexe
  // pour compter toutes les clés de rate limiting actives
  return {
    redisStatus,
    activeRateLimits: 0 // À implémenter si nécessaire
  };
}