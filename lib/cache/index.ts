// Cache principal
export { RedisCache, cache } from './redis-cache';
export type { CacheOptions } from './redis-cache';
import { RedisCache } from './redis-cache';

// Cache spécialisé pour l'application
export { ApplicationCache, appCache } from './application-cache';
import { ApplicationCache } from './application-cache';

// Middleware de cache pour les API
export {
  withCache,
  withUserCache,
  withChantierCache,
  withShortCache,
  withLongCache,
  withSmartCache,
  withPublicCache,
  withConditionalCache,
  invalidateRouteCache
} from '../middleware/cache-middleware';

// Hooks React pour le cache
export {
  useCache,
  useCachedList,
  useUserCache,
  useChantierCache,
  useSearchCache,
  useDashboardStatsCache,
  useCacheStats
} from '../../hooks/useCache';

// Types et constantes
export const CACHE_NAMESPACES = {
  USERS: 'users',
  CHANTIERS: 'chantiers',
  DEVIS: 'devis',
  MESSAGES: 'messages',
  PLANNING: 'planning',
  DOCUMENTS: 'documents',
  CRM: 'crm',
  NOTIFICATIONS: 'notifications',
  STATS: 'stats',
  SEARCH: 'search',
  API_RESPONSES: 'api-responses'
} as const;

export const CACHE_TTL = {
  VERY_SHORT: 30,     // 30 secondes
  SHORT: 300,         // 5 minutes
  MEDIUM: 900,        // 15 minutes
  LONG: 3600,         // 1 heure
  VERY_LONG: 86400,   // 1 jour
  WEEK: 604800        // 1 semaine
} as const;

export const CACHE_TAGS = {
  USER: 'user',
  CHANTIER: 'chantier',
  DEVIS: 'devis',
  MESSAGE: 'message',
  PLANNING: 'planning',
  DOCUMENT: 'document',
  CRM: 'crm',
  NOTIFICATION: 'notification',
  STATS: 'stats'
} as const;

// Utilitaires pour la gestion du cache
export interface CacheStats {
  hits: number;
  misses: number;
  totalKeys: number;
  memory: string;
  hitRate: number;
}

export class CacheManager {
  static async getCacheStats(): Promise<CacheStats> {
    try {
      const redisCache = new RedisCache();
      const stats = await redisCache.getStats();
      const hitRate = stats.hits + stats.misses > 0 
        ? (stats.hits / (stats.hits + stats.misses)) * 100 
        : 0;
      
      return {
        ...stats,
        hitRate: parseFloat(hitRate.toFixed(2))
      };
    } catch (error) {
      return {
        hits: 0,
        misses: 0,
        totalKeys: 0,
        memory: '0MB',
        hitRate: 0
      };
    }
  }

  static async warmUpUserCache(userId: string): Promise<void> {
    try {
      // Pré-charger les données utilisateur essentielles
      const appCacheInstance = new ApplicationCache();
      await Promise.all([
        appCacheInstance.getUserProfile(userId),
        appCacheInstance.getDashboardStats(userId),
        appCacheInstance.getNotifications(userId)
      ]);
    } catch (error) {
      console.error('Error warming up user cache:', error);
    }
  }

  static async invalidateUserData(userId: string): Promise<void> {
    const appCacheInstance = new ApplicationCache();
    await appCacheInstance.invalidateUserCache(userId);
  }

  static async invalidateChantierData(chantierId: string): Promise<void> {
    const appCacheInstance = new ApplicationCache();
    await appCacheInstance.invalidateChantierCache(chantierId);
  }

  static async clearAllCaches(): Promise<void> {
    const redisCache = new RedisCache();
    await redisCache.flush();
  }

  static async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    details: string;
  }> {
    try {
      // Test simple de set/get
      const redisCache = new RedisCache();
      const testKey = 'health-check';
      const testValue = { timestamp: Date.now() };
      
      await redisCache.set(testKey, testValue, { ttl: 10 });
      const retrieved = await redisCache.get(testKey);
      await redisCache.del(testKey);
      
      if (retrieved && retrieved.timestamp === testValue.timestamp) {
        return {
          status: 'healthy',
          details: 'Cache is working properly'
        };
      } else {
        return {
          status: 'degraded',
          details: 'Cache data integrity issue'
        };
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        details: `Cache error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
}

// Factory functions pour créer des stratégies de cache courantes
export function createCacheStrategy(type: 'user' | 'chantier' | 'public' | 'search') {
  switch (type) {
    case 'user':
      return {
        ttl: CACHE_TTL.MEDIUM,
        namespace: CACHE_NAMESPACES.USERS,
        tags: [CACHE_TAGS.USER]
      };
    
    case 'chantier':
      return {
        ttl: CACHE_TTL.SHORT,
        namespace: CACHE_NAMESPACES.CHANTIERS,
        tags: [CACHE_TAGS.CHANTIER]
      };
    
    case 'public':
      return {
        ttl: CACHE_TTL.LONG,
        namespace: 'public'
      };
    
    case 'search':
      return {
        ttl: CACHE_TTL.SHORT,
        namespace: CACHE_NAMESPACES.SEARCH
      };
    
    default:
      return {
        ttl: CACHE_TTL.MEDIUM
      };
  }
}

// Configuration par défaut pour différents types d'endpoints
export const ENDPOINT_CACHE_CONFIG = {
  '/api/auth/me': createCacheStrategy('user'),
  '/api/chantiers': createCacheStrategy('chantier'),
  '/api/devis': { ttl: CACHE_TTL.MEDIUM, tags: [CACHE_TAGS.DEVIS] },
  '/api/messages': { ttl: CACHE_TTL.VERY_SHORT, tags: [CACHE_TAGS.MESSAGE] },
  '/api/planning': { ttl: CACHE_TTL.SHORT, tags: [CACHE_TAGS.PLANNING] },
  '/api/documents': { ttl: CACHE_TTL.MEDIUM, tags: [CACHE_TAGS.DOCUMENT] },
  '/api/stats': { ttl: CACHE_TTL.SHORT, tags: [CACHE_TAGS.STATS] },
  '/api/search': createCacheStrategy('search'),
  '/api/notifications': { ttl: CACHE_TTL.VERY_SHORT, tags: [CACHE_TAGS.NOTIFICATION] }
} as const;

// Helper pour générer des clés de cache cohérentes
export function generateCacheKey(
  type: string,
  identifier: string | number,
  suffix?: string
): string {
  const parts = [type, identifier.toString()];
  if (suffix) parts.push(suffix);
  return parts.join(':');
}

// Helper pour la sérialisation/désérialisation sécurisée
export function safeCacheSerialize(data: any): string {
  try {
    return JSON.stringify(data);
  } catch (error) {
    console.error('Cache serialization error:', error);
    return JSON.stringify({ error: 'Serialization failed' });
  }
}

export function safeCacheDeserialize<T>(data: string): T | null {
  try {
    return JSON.parse(data);
  } catch (error) {
    console.error('Cache deserialization error:', error);
    return null;
  }
}