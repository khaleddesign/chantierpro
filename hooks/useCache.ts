'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { appCache } from '@/lib/cache/application-cache';

interface UseCacheOptions<T> {
  enabled?: boolean;
  refreshInterval?: number;
  staleTime?: number;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  initialData?: T;
}

interface CacheState<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  lastUpdated: Date | null;
  isStale: boolean;
}

export function useCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: UseCacheOptions<T> = {}
) {
  const {
    enabled = true,
    refreshInterval,
    staleTime = 0,
    onSuccess,
    onError,
    initialData = null
  } = options;

  const [state, setState] = useState<CacheState<T>>({
    data: initialData,
    isLoading: false,
    error: null,
    lastUpdated: null,
    isStale: false
  });

  const fetcherRef = useRef(fetcher);
  const intervalRef = useRef<NodeJS.Timeout>();

  fetcherRef.current = fetcher;

  const fetchData = useCallback(async (useCache = true) => {
    if (!enabled) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      let data: T;

      if (useCache) {
        // Essayer de récupérer depuis le cache en premier
        const cached = await getCachedData(key);
        if (cached) {
          data = cached;
        } else {
          data = await fetcherRef.current();
          await setCachedData(key, data);
        }
      } else {
        // Forcer la récupération depuis la source
        data = await fetcherRef.current();
        await setCachedData(key, data);
      }

      const now = new Date();
      const isStale = staleTime > 0 && state.lastUpdated 
        ? (now.getTime() - state.lastUpdated.getTime()) > staleTime
        : false;

      setState({
        data,
        isLoading: false,
        error: null,
        lastUpdated: now,
        isStale
      });

      onSuccess?.(data);
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: err,
        isStale: true
      }));
      onError?.(err);
    }
  }, [key, enabled, staleTime, state.lastUpdated, onSuccess, onError]);

  const refetch = useCallback(() => {
    return fetchData(false);
  }, [fetchData]);

  const invalidate = useCallback(async () => {
    await invalidateCachedData(key);
    await fetchData(false);
  }, [key, fetchData]);

  useEffect(() => {
    if (enabled) {
      fetchData(true);
    }
  }, [enabled, key]);

  useEffect(() => {
    if (refreshInterval && refreshInterval > 0 && enabled) {
      intervalRef.current = setInterval(() => {
        fetchData(true);
      }, refreshInterval);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [refreshInterval, enabled, fetchData]);

  return {
    ...state,
    refetch,
    invalidate,
    isFresh: !state.isStale && state.data !== null
  };
}

// Hook pour les listes avec pagination
export function useCachedList<T>(
  key: string,
  fetcher: (page: number, limit: number) => Promise<{ data: T[]; total: number }>,
  options: UseCacheOptions<{ data: T[]; total: number }> & {
    page?: number;
    limit?: number;
  } = {}
) {
  const { page = 1, limit = 10, ...cacheOptions } = options;
  const cacheKey = `${key}:page:${page}:limit:${limit}`;

  return useCache(cacheKey, () => fetcher(page, limit), cacheOptions);
}

// Hook pour les données utilisateur
export function useUserCache<T>(
  userId: string,
  type: 'profile' | 'chantiers' | 'devis' | 'stats',
  fetcher?: () => Promise<T>,
  options: UseCacheOptions<T> = {}
) {
  const key = `user:${type}:${userId}`;
  
  const defaultFetcher = useCallback(async (): Promise<T> => {
    switch (type) {
      case 'profile':
        return (await appCache.getUserProfile(userId)) as T;
      default:
        throw new Error(`No default fetcher for type: ${type}`);
    }
  }, [userId, type]);

  return useCache(key, fetcher || defaultFetcher, options);
}

// Hook pour les données de chantier
export function useChantierCache<T>(
  chantierId: string,
  type: 'detail' | 'messages' | 'documents',
  fetcher: () => Promise<T>,
  options: UseCacheOptions<T> = {}
) {
  const key = `chantier:${type}:${chantierId}`;
  return useCache(key, fetcher, options);
}

// Hook pour la recherche avec cache
export function useSearchCache(
  query: string,
  userId: string,
  fetcher: (query: string) => Promise<any[]>,
  options: UseCacheOptions<any[]> = {}
) {
  const key = `search:${Buffer.from(query).toString('base64')}:${userId}`;
  
  return useCache(
    key,
    () => fetcher(query),
    {
      ...options,
      enabled: options.enabled !== false && query.length > 2
    }
  );
}

// Hook pour les statistiques du dashboard
export function useDashboardStatsCache(
  userId: string,
  fetcher: () => Promise<any>,
  options: UseCacheOptions<any> = {}
) {
  return useCache(
    `stats:dashboard:${userId}`,
    fetcher,
    {
      staleTime: 180000, // 3 minutes
      refreshInterval: 300000, // 5 minutes
      ...options
    }
  );
}

// Utilitaires pour interagir directement avec le cache
async function getCachedData(key: string) {
  try {
    // Cette fonction sera adaptée selon la structure de clé
    if (key.includes('user:profile:')) {
      const userId = key.split(':')[2];
      return await appCache.getUserProfile(userId);
    }
    // Ajouter d'autres cas selon les besoins
    return null;
  } catch {
    return null;
  }
}

async function setCachedData(key: string, data: any) {
  try {
    if (key.includes('user:profile:')) {
      const userId = key.split(':')[2];
      return await appCache.setUserProfile(userId, data);
    }
    // Ajouter d'autres cas selon les besoins
    return false;
  } catch {
    return false;
  }
}

async function invalidateCachedData(key: string) {
  try {
    if (key.includes('user:')) {
      const userId = key.split(':')[2];
      return await appCache.invalidateUserCache(userId);
    }
    if (key.includes('chantier:')) {
      const chantierId = key.split(':')[2];
      return await appCache.invalidateChantierCache(chantierId);
    }
    // Ajouter d'autres cas selon les besoins
  } catch (error) {
    console.error('Cache invalidation error:', error);
  }
}

// Hook pour surveiller l'état du cache global
export function useCacheStats() {
  const [stats, setStats] = useState({
    hits: 0,
    misses: 0,
    totalKeys: 0,
    memory: '0B'
  });

  const refreshStats = useCallback(async () => {
    try {
      const cacheStats = await appCache.getCacheStats();
      setStats(cacheStats);
    } catch (error) {
      console.error('Error fetching cache stats:', error);
    }
  }, []);

  useEffect(() => {
    refreshStats();
    const interval = setInterval(refreshStats, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [refreshStats]);

  return { stats, refreshStats };
}