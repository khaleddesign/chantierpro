import { NextRequest, NextResponse } from 'next/server';
import { cache } from '@/lib/cache/redis-cache';

interface CacheMiddlewareOptions {
  ttl?: number;
  varyBy?: string[];
  skipCache?: (req: NextRequest) => boolean;
  generateKey?: (req: NextRequest) => string;
  onHit?: (key: string) => void;
  onMiss?: (key: string) => void;
  onError?: (error: Error) => void;
}

export function withCache(options: CacheMiddlewareOptions = {}) {
  const {
    ttl = 300, // 5 minutes par défaut
    varyBy = [],
    skipCache = () => false,
    generateKey,
    onHit,
    onMiss,
    onError
  } = options;

  return function cacheMiddleware(
    handler: (req: NextRequest) => Promise<NextResponse>
  ) {
    return async function cachedHandler(req: NextRequest): Promise<NextResponse> {
      // Ignorer le cache pour les méthodes non-GET
      if (req.method !== 'GET') {
        return handler(req);
      }

      // Vérifier si on doit ignorer le cache
      if (skipCache(req)) {
        return handler(req);
      }

      try {
        // Générer la clé de cache
        const cacheKey = generateKey ? 
          generateKey(req) : 
          generateDefaultCacheKey(req, varyBy);

        // Tentative de récupération depuis le cache
        const cachedResponse = await cache.get<{
          status: number;
          headers: Record<string, string>;
          body: string;
        }>(cacheKey, { namespace: 'api-responses' });

        if (cachedResponse) {
          onHit?.(cacheKey);
          
          // Créer la réponse depuis le cache
          const response = new NextResponse(cachedResponse.body, {
            status: cachedResponse.status,
            headers: {
              ...cachedResponse.headers,
              'X-Cache': 'HIT',
              'X-Cache-Key': cacheKey
            }
          });

          return response;
        }

        onMiss?.(cacheKey);

        // Exécuter le handler original
        const response = await handler(req);

        // Mettre en cache uniquement les réponses de succès
        if (response.status >= 200 && response.status < 300) {
          await cacheResponse(cacheKey, response, ttl);
        }

        // Ajouter les en-têtes de cache
        response.headers.set('X-Cache', 'MISS');
        response.headers.set('X-Cache-Key', cacheKey);

        return response;

      } catch (error) {
        const err = error instanceof Error ? error : new Error('Cache middleware error');
        onError?.(err);
        console.error('Cache middleware error:', err);
        
        // En cas d'erreur de cache, exécuter le handler original
        return handler(req);
      }
    };
  };
}

function generateDefaultCacheKey(req: NextRequest, varyBy: string[]): string {
  const url = new URL(req.url);
  const pathname = url.pathname;
  const searchParams = url.searchParams;
  
  let keyParts = [pathname];

  // Ajouter les paramètres de requête
  const sortedParams = Array.from(searchParams.entries()).sort();
  if (sortedParams.length > 0) {
    keyParts.push(sortedParams.map(([k, v]) => `${k}=${v}`).join('&'));
  }

  // Ajouter les en-têtes variables
  for (const header of varyBy) {
    const value = req.headers.get(header);
    if (value) {
      keyParts.push(`${header}:${value}`);
    }
  }

  return keyParts.join('|');
}

async function cacheResponse(
  key: string, 
  response: NextResponse, 
  ttl: number
): Promise<void> {
  try {
    // Cloner la réponse pour pouvoir la lire
    const responseClone = response.clone();
    const body = await responseClone.text();
    
    // Extraire les en-têtes importantes
    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      // Éviter de mettre en cache certains en-têtes
      if (!key.toLowerCase().startsWith('x-cache') && 
          key !== 'set-cookie' && 
          key !== 'authorization') {
        headers[key] = value;
      }
    });

    const cacheData = {
      status: response.status,
      headers,
      body
    };

    await cache.set(key, cacheData, {
      ttl,
      namespace: 'api-responses'
    });
  } catch (error) {
    console.error('Error caching response:', error);
  }
}

// Middleware spécialisés pour différents types d'endpoints

export const withUserCache = (userId?: string) => withCache({
  ttl: 600, // 10 minutes
  varyBy: ['authorization'],
  generateKey: (req) => {
    const url = new URL(req.url);
    const user = userId || req.headers.get('x-user-id') || 'anonymous';
    return `user:${user}:${url.pathname}:${url.search}`;
  },
  skipCache: (req) => {
    // Ignorer pour les utilisateurs non authentifiés si userId est requis
    return userId ? false : !req.headers.get('authorization');
  }
});

export const withChantierCache = (chantierId: string) => withCache({
  ttl: 300, // 5 minutes
  generateKey: (req) => {
    const url = new URL(req.url);
    return `chantier:${chantierId}:${url.pathname}:${url.search}`;
  }
});

export const withShortCache = withCache({
  ttl: 60 // 1 minute pour les données qui changent fréquemment
});

export const withLongCache = withCache({
  ttl: 3600 // 1 heure pour les données statiques
});

// Utilitaire pour invalider le cache d'une route
export async function invalidateRouteCache(pattern: string): Promise<void> {
  try {
    await cache.invalidateByPattern(`api-responses:${pattern}*`);
  } catch (error) {
    console.error('Error invalidating route cache:', error);
  }
}

// Middleware conditionnel basé sur les en-têtes
export function withConditionalCache(
  options: CacheMiddlewareOptions & {
    condition: (req: NextRequest) => boolean;
  }
) {
  const { condition, ...cacheOptions } = options;
  
  return withCache({
    ...cacheOptions,
    skipCache: (req) => {
      const shouldSkip = cacheOptions.skipCache?.(req) || false;
      return shouldSkip || !condition(req);
    }
  });
}

// Cache intelligent qui s'adapte selon le type de contenu
export const withSmartCache = withCache({
  ttl: 300,
  generateKey: (req) => {
    const url = new URL(req.url);
    const pathname = url.pathname;
    
    // TTL adaptatif selon le type d'endpoint
    let ttl = 300; // défaut 5 minutes
    
    if (pathname.includes('/stats')) ttl = 180; // 3 minutes pour les stats
    if (pathname.includes('/messages')) ttl = 60; // 1 minute pour les messages
    if (pathname.includes('/notifications')) ttl = 120; // 2 minutes pour les notifications
    if (pathname.includes('/search')) ttl = 300; // 5 minutes pour la recherche
    
    return `smart:${pathname}:${url.search}:ttl${ttl}`;
  },
  varyBy: ['authorization', 'accept-language'],
  onHit: (key) => console.log(`Cache HIT: ${key}`),
  onMiss: (key) => console.log(`Cache MISS: ${key}`)
});

// Middleware pour les API publiques avec cache long
export const withPublicCache = withCache({
  ttl: 3600, // 1 heure
  varyBy: ['accept-language'],
  skipCache: (req) => {
    // Ignorer le cache si des paramètres d'authentification sont présents
    return !!(req.headers.get('authorization') || req.headers.get('x-api-key'));
  }
});