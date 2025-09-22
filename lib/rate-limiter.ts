import { NextRequest, NextResponse } from 'next/server';
import redis from './redis';

// Configuration du rate limiting par type d'endpoint
const RATE_LIMITS = {
  AUTH: { maxRequests: 3, windowMs: 15 * 60 * 1000 }, // 🔒 RENFORCÉ: 3 tentatives par 15 minutes pour auth
  UPLOAD: { maxRequests: 10, windowMs: 60 * 1000 }, // 10 uploads par minute
  API_READ: { maxRequests: 100, windowMs: 60 * 1000 }, // 100 lectures par minute
  API_WRITE: { maxRequests: 20, windowMs: 60 * 1000 }, // 20 écritures par minute
  FINANCIAL: { maxRequests: 5, windowMs: 60 * 1000 }, // 5 actions financières par minute
  DEFAULT: { maxRequests: 60, windowMs: 60 * 1000 } // 60 requêtes par minute par défaut
};

// Fallback store en mémoire si Redis n'est pas disponible
const memoryStore = new Map<string, { count: number; resetTime: number }>();

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
  const now = Date.now();
  const key = `ratelimit:${identifier}:${type}`;
  
  try {
    // Utiliser Redis si disponible
    if (redis) {
      const pipeline = redis.pipeline();
      pipeline.hgetall(key);
      pipeline.pttl(key);
      const results = await pipeline.exec();
      
      const current = results?.[0]?.[1] as { count?: string; resetTime?: string } | null;
      const ttl = results?.[1]?.[1] as number;
      
      if (!current || !current.count || ttl <= 0) {
        // Première requête ou clé expirée
        const resetTime = now + config.windowMs;
        const ttlSeconds = Math.ceil(config.windowMs / 1000);
        
        const pipeline = redis.pipeline();
        pipeline.hset(key, { count: '1', resetTime: resetTime.toString() });
        pipeline.expire(key, ttlSeconds);
        await pipeline.exec();
        
        return {
          allowed: true,
          remaining: config.maxRequests - 1,
          resetTime,
          totalRequests: config.maxRequests
        };
      }
      
      const count = parseInt(current.count, 10);
      const resetTime = parseInt(current.resetTime || '0', 10);
      
      if (count >= config.maxRequests) {
        return {
          allowed: false,
          remaining: 0,
          resetTime,
          totalRequests: config.maxRequests
        };
      }
      
      // Incrémenter le compteur
      await redis.hincrby(key, 'count', 1);
      
      return {
        allowed: true,
        remaining: config.maxRequests - (count + 1),
        resetTime,
        totalRequests: config.maxRequests
      };
    }
  } catch (error) {
    console.warn('Redis error in rate limiter, falling back to memory store:', error);
  }
  
  // Fallback sur le store en mémoire
  const current = memoryStore.get(key);
  
  if (!current || now > current.resetTime) {
    const resetTime = now + config.windowMs;
    memoryStore.set(key, { count: 1, resetTime });
    
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime,
      totalRequests: config.maxRequests
    };
  }
  
  if (current.count >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: current.resetTime,
      totalRequests: config.maxRequests
    };
  }
  
  current.count++;
  memoryStore.set(key, current);
  
  return {
    allowed: true,
    remaining: config.maxRequests - current.count,
    resetTime: current.resetTime,
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
    const identifier = `${ip}:${userAgent.slice(0, 50)}`; // Limiter la taille du User-Agent
    
    const result = await getRateLimit(identifier, type);
    
    if (!result.allowed) {
      const resetTimeSeconds = Math.ceil((result.resetTime - Date.now()) / 1000);
      
      return NextResponse.json(
        {
          error: 'Trop de requêtes. Veuillez réessayer plus tard.',
          retryAfter: resetTimeSeconds,
          type: 'RATE_LIMIT_EXCEEDED'
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': result.totalRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': Math.ceil(result.resetTime / 1000).toString(),
            'Retry-After': resetTimeSeconds.toString()
          }
        }
      );
    }
    
    // Ajouter les headers de rate limit à toute réponse valide
    const response = NextResponse.next();
    response.headers.set('X-RateLimit-Limit', result.totalRequests.toString());
    response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
    response.headers.set('X-RateLimit-Reset', Math.ceil(result.resetTime / 1000).toString());
    
    return null; // Continuer vers l'endpoint
  };
}

// Helper function pour appliquer le rate limiting dans les routes API
export function withRateLimit<T extends unknown[]>(
  handler: (...args: T) => Promise<NextResponse>,
  type: RateLimitType = 'DEFAULT'
) {
  return async (...args: T): Promise<NextResponse> => {
    const request = args[0] as NextRequest;
    const rateLimitResponse = await createRateLimitMiddleware(type)(request);
    
    if (rateLimitResponse) {
      return rateLimitResponse;
    }
    
    const result = await handler(...args);
    
    // Ajouter les headers de rate limit à la réponse finale
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : 
               request.headers.get('x-real-ip') || 
               'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const identifier = `${ip}:${userAgent.slice(0, 50)}`;
    
    const limitInfo = await getRateLimit(identifier, type);
    result.headers.set('X-RateLimit-Limit', limitInfo.totalRequests.toString());
    result.headers.set('X-RateLimit-Remaining', limitInfo.remaining.toString());
    result.headers.set('X-RateLimit-Reset', Math.ceil(limitInfo.resetTime / 1000).toString());
    
    return result;
  };
}

// Function pour obtenir des statistiques de rate limiting (monitoring)
export async function getRateLimitStats(): Promise<{
  totalKeys: number;
  typeBreakdown: Record<string, number>;
  topIdentifiers: Array<{ identifier: string; requests: number }>;
}> {
  const stats = {
    totalKeys: 0,
    typeBreakdown: {} as Record<string, number>,
    topIdentifiers: [] as Array<{ identifier: string; requests: number }>
  };
  
  try {
    if (redis) {
      // Utiliser Redis pour les statistiques
      const keys = await redis.keys('ratelimit:*');
      stats.totalKeys = keys.length;
      
      const identifierCounts = new Map<string, number>();
      
      for (const key of keys) {
        const parts = key.split(':');
        if (parts.length >= 3) {
          const identifier = parts[1];
          const type = parts[2];
          
          // Compter par type
          stats.typeBreakdown[type] = (stats.typeBreakdown[type] || 0) + 1;
          
          // Obtenir le compteur pour cet identifiant
          const data = await redis.hget(key, 'count');
          const count = parseInt(data || '0', 10);
          
          const currentCount = identifierCounts.get(identifier) || 0;
          identifierCounts.set(identifier, currentCount + count);
        }
      }
      
      // Top 10 des identifiants les plus actifs
      stats.topIdentifiers = Array.from(identifierCounts.entries())
        .map(([identifier, requests]) => ({ identifier, requests }))
        .sort((a, b) => b.requests - a.requests)
        .slice(0, 10);
    } else {
      // Fallback sur le store en mémoire
      stats.totalKeys = memoryStore.size;
      const identifierCounts = new Map<string, number>();
      
      for (const [key, value] of memoryStore.entries()) {
        const parts = key.split(':');
        if (parts.length >= 3) {
          const identifier = parts[1];
          const type = parts[2];
          
          // Compter par type
          stats.typeBreakdown[type] = (stats.typeBreakdown[type] || 0) + 1;
          
          // Compter les requêtes par identifiant
          const currentCount = identifierCounts.get(identifier) || 0;
          identifierCounts.set(identifier, currentCount + value.count);
        }
      }
      
      // Top 10 des identifiants les plus actifs
      stats.topIdentifiers = Array.from(identifierCounts.entries())
        .map(([identifier, requests]) => ({ identifier, requests }))
        .sort((a, b) => b.requests - a.requests)
        .slice(0, 10);
    }
  } catch (error) {
    console.error('Error getting rate limit stats:', error);
  }
  
  return stats;
}