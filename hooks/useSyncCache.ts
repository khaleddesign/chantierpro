"use client";

import { useState, useEffect, useCallback, useRef } from 'react';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  etag?: string;
  lastModified?: string;
  version: number;
}

interface SyncCacheConfig<T> {
  staleTime: number; // Temps avant que les données soient considérées obsolètes
  cacheTime: number; // Temps de rétention en cache
  refetchOnMount: boolean;
  refetchOnWindowFocus: boolean;
  retryAttempts: number;
  retryDelay: number;
  onSync?: (data: T) => void;
  onConflict?: (local: T, remote: T) => T; // Résolution de conflits
}

interface SyncState<T> {
  data: T | null;
  isLoading: boolean;
  isSyncing: boolean;
  isStale: boolean;
  error: string | null;
  lastSyncTime: number | null;
  conflictResolution: 'local' | 'remote' | 'merge' | null;
}

export function useSyncCache<T extends { id?: string; updatedAt?: string }>(
  key: string,
  fetcher: () => Promise<T>,
  config: Partial<SyncCacheConfig<T>> = {}
): SyncState<T> & {
  sync: () => Promise<void>;
  invalidate: () => void;
  updateLocal: (data: T) => void;
  resolveConflict: (resolution: 'local' | 'remote' | 'merge') => void;
} {
  const defaultConfig: SyncCacheConfig<T> = {
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    retryAttempts: 3,
    retryDelay: 1000,
    ...config
  };

  const [state, setState] = useState<SyncState<T>>({
    data: null,
    isLoading: false,
    isSyncing: false,
    isStale: false,
    error: null,
    lastSyncTime: null,
    conflictResolution: null
  });

  const cacheRef = useRef<Map<string, CacheEntry<T>>>(new Map());
  const retryTimeoutRef = useRef<NodeJS.Timeout>();
  const syncIntervalRef = useRef<NodeJS.Timeout>();

  // Vérifier si les données sont obsolètes
  const isStale = useCallback((entry: CacheEntry<T>): boolean => {
    return Date.now() - entry.timestamp > defaultConfig.staleTime;
  }, [defaultConfig.staleTime]);

  // Sauvegarder en cache avec métadonnées
  const saveToCache = useCallback((data: T, etag?: string, lastModified?: string) => {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      etag,
      lastModified,
      version: (cacheRef.current.get(key)?.version || 0) + 1
    };

    cacheRef.current.set(key, entry);
    
    // Nettoyer les anciennes entrées
    setTimeout(() => {
      const cutoff = Date.now() - defaultConfig.cacheTime;
      for (const [k, v] of cacheRef.current.entries()) {
        if (v.timestamp < cutoff) {
          cacheRef.current.delete(k);
        }
      }
    }, 1000);
  }, [key, defaultConfig.cacheTime]);

  // Détecter les conflits
  const detectConflict = useCallback((local: T, remote: T): boolean => {
    // Pour les tableaux, comparer les longueurs et les IDs
    if (Array.isArray(local) && Array.isArray(remote)) {
      if (local.length !== remote.length) return true;
      
      // Comparer les timestamps de modification
      const localTimestamps = local.map(item => 
        item.updatedAt ? new Date(item.updatedAt).getTime() : 0
      );
      const remoteTimestamps = remote.map(item => 
        item.updatedAt ? new Date(item.updatedAt).getTime() : 0
      );
      
      return !localTimestamps.every((time, index) => 
        Math.abs(time - remoteTimestamps[index]) <= 1000
      );
    }
    
    // Pour les objets simples
    if (!local.updatedAt || !remote.updatedAt) return false;
    
    const localTime = new Date(local.updatedAt).getTime();
    const remoteTime = new Date(remote.updatedAt).getTime();
    
    return Math.abs(localTime - remoteTime) > 1000; // Tolérance de 1s
  }, []);

  // Résoudre automatiquement les conflits
  const autoResolveConflict = useCallback((local: T, remote: T): T => {
    if (defaultConfig.onConflict) {
      return defaultConfig.onConflict(local, remote);
    }

    // Pour les tableaux, fusionner intelligemment
    if (Array.isArray(local) && Array.isArray(remote)) {
      // Stratégie simple : prendre le plus récent basé sur le dernier élément modifié
      const localLastUpdate = local.length > 0 ? 
        Math.max(...local.map(item => 
          item.updatedAt ? new Date(item.updatedAt).getTime() : 0
        )) : 0;
      const remoteLastUpdate = remote.length > 0 ? 
        Math.max(...remote.map(item => 
          item.updatedAt ? new Date(item.updatedAt).getTime() : 0
        )) : 0;
      
      return remoteLastUpdate > localLastUpdate ? remote : local;
    }

    // Pour les objets simples : prendre le plus récent
    if (local.updatedAt && remote.updatedAt) {
      const localTime = new Date(local.updatedAt).getTime();
      const remoteTime = new Date(remote.updatedAt).getTime();
      return remoteTime > localTime ? remote : local;
    }

    return remote; // Par défaut, favoriser le serveur
  }, [defaultConfig.onConflict]);

  // Synchronisation avec le serveur
  const sync = useCallback(async (force = false) => {
    const cachedEntry = cacheRef.current.get(key);
    
    if (!force && cachedEntry && !isStale(cachedEntry)) {
      setState(prev => ({ 
        ...prev, 
        data: cachedEntry.data, 
        isStale: false,
        error: null
      }));
      return;
    }

    setState(prev => ({ ...prev, isSyncing: true, error: null }));

    let retryCount = 0;
    const attemptSync = async (): Promise<void> => {
      try {
        const response = await fetch(`/api/sync/${key}`, {
          headers: {
            ...(cachedEntry?.etag && { 'If-None-Match': cachedEntry.etag }),
            ...(cachedEntry?.lastModified && { 'If-Modified-Since': cachedEntry.lastModified })
          }
        });

        if (response.status === 304) {
          // Pas de changement, actualiser timestamp
          if (cachedEntry) {
            saveToCache(cachedEntry.data, cachedEntry.etag, cachedEntry.lastModified);
            setState(prev => ({ 
              ...prev, 
              data: cachedEntry.data,
              isStale: false,
              isSyncing: false,
              lastSyncTime: Date.now()
            }));
          }
          return;
        }

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const remoteData: T = await response.json();
        const etag = response.headers.get('etag') || undefined;
        const lastModified = response.headers.get('last-modified') || undefined;

        // Vérifier les conflits
        if (cachedEntry && detectConflict(cachedEntry.data, remoteData)) {
          const resolved = autoResolveConflict(cachedEntry.data, remoteData);
          
          setState(prev => ({ 
            ...prev,
            data: resolved,
            conflictResolution: resolved === cachedEntry.data ? 'local' : 'remote',
            isSyncing: false,
            isStale: false,
            lastSyncTime: Date.now()
          }));

          saveToCache(resolved, etag, lastModified);
          defaultConfig.onSync?.(resolved);
        } else {
          // Pas de conflit, utiliser les données du serveur
          setState(prev => ({ 
            ...prev,
            data: remoteData,
            conflictResolution: null,
            isSyncing: false,
            isStale: false,
            lastSyncTime: Date.now()
          }));

          saveToCache(remoteData, etag, lastModified);
          defaultConfig.onSync?.(remoteData);
        }

      } catch (error) {
        retryCount++;
        if (retryCount <= defaultConfig.retryAttempts) {
          console.warn(`⚠️ Sync failed, retry ${retryCount}/${defaultConfig.retryAttempts}:`, error);
          retryTimeoutRef.current = setTimeout(
            attemptSync, 
            defaultConfig.retryDelay * Math.pow(2, retryCount - 1) // Backoff exponentiel
          );
        } else {
          setState(prev => ({ 
            ...prev,
            error: error instanceof Error ? error.message : 'Erreur de synchronisation',
            isSyncing: false
          }));
        }
      }
    };

    await attemptSync();
  }, [key, isStale, saveToCache, detectConflict, autoResolveConflict, defaultConfig]);

  // Mise à jour locale (optimiste)
  const updateLocal = useCallback((data: T) => {
    setState(prev => ({ ...prev, data, isStale: true }));
    saveToCache(data);
  }, [saveToCache]);

  // Invalider le cache
  const invalidate = useCallback(() => {
    cacheRef.current.delete(key);
    setState(prev => ({ ...prev, isStale: true }));
  }, [key]);

  // Résoudre manuellement un conflit
  const resolveConflict = useCallback((resolution: 'local' | 'remote' | 'merge') => {
    const cachedEntry = cacheRef.current.get(key);
    if (!cachedEntry || !state.conflictResolution) return;

    setState(prev => ({ ...prev, conflictResolution: resolution }));
    
    if (resolution === 'remote') {
      sync(true); // Forcer la synchronisation
    }
  }, [key, state.conflictResolution, sync]);

  // Charger depuis le cache au montage
  useEffect(() => {
    const cachedEntry = cacheRef.current.get(key);
    if (cachedEntry) {
      setState(prev => ({ 
        ...prev, 
        data: cachedEntry.data,
        isStale: isStale(cachedEntry),
        lastSyncTime: cachedEntry.timestamp
      }));

      if (defaultConfig.refetchOnMount || isStale(cachedEntry)) {
        sync();
      }
    } else if (defaultConfig.refetchOnMount) {
      sync();
    }
  }, [key, sync, isStale, defaultConfig.refetchOnMount]);

  // Synchronisation périodique
  useEffect(() => {
    if (defaultConfig.staleTime > 0) {
      syncIntervalRef.current = setInterval(() => {
        if (state.data) {
          sync();
        }
      }, defaultConfig.staleTime);

      return () => {
        if (syncIntervalRef.current) {
          clearInterval(syncIntervalRef.current);
        }
      };
    }
  }, [sync, state.data, defaultConfig.staleTime]);

  // Synchronisation au focus de la fenêtre
  useEffect(() => {
    if (defaultConfig.refetchOnWindowFocus) {
      const handleFocus = () => {
        if (state.data && isStale(cacheRef.current.get(key)!)) {
          sync();
        }
      };

      window.addEventListener('focus', handleFocus);
      return () => window.removeEventListener('focus', handleFocus);
    }
  }, [sync, state.data, isStale, key, defaultConfig.refetchOnWindowFocus]);

  // Nettoyage
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, []);

  return {
    ...state,
    sync,
    invalidate,
    updateLocal,
    resolveConflict
  };
}

// Interface pour les entités avec ID et timestamp
interface EntityWithTimestamp {
  id: string;
  updatedAt?: string;
}

// Version spécialisée de useSyncCache pour les tableaux
function useSyncCacheForArray<T extends EntityWithTimestamp>(
  key: string,
  fetcher: () => Promise<T[]>,
  config: Partial<SyncCacheConfig<T[]>> = {}
) {
  const defaultConfig: SyncCacheConfig<T[]> = {
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    retryAttempts: 3,
    retryDelay: 1000,
    ...config
  };

  const [state, setState] = useState<SyncState<T[]>>({
    data: null,
    isLoading: false,
    isSyncing: false,
    isStale: false,
    error: null,
    lastSyncTime: null,
    conflictResolution: null
  });

  const cacheRef = useRef<Map<string, CacheEntry<T[]>>>(new Map());
  const retryTimeoutRef = useRef<NodeJS.Timeout>();
  const syncIntervalRef = useRef<NodeJS.Timeout>();

  // Vérifier si les données sont obsolètes
  const isStale = useCallback((entry: CacheEntry<T[]>): boolean => {
    return Date.now() - entry.timestamp > defaultConfig.staleTime;
  }, [defaultConfig.staleTime]);

  // Sauvegarder en cache avec métadonnées
  const saveToCache = useCallback((data: T[], etag?: string, lastModified?: string) => {
    const entry: CacheEntry<T[]> = {
      data,
      timestamp: Date.now(),
      etag,
      lastModified,
      version: (cacheRef.current.get(key)?.version || 0) + 1
    };

    cacheRef.current.set(key, entry);
    
    // Nettoyer les anciennes entrées
    setTimeout(() => {
      const cutoff = Date.now() - defaultConfig.cacheTime;
      for (const [k, v] of cacheRef.current.entries()) {
        if (v.timestamp < cutoff) {
          cacheRef.current.delete(k);
        }
      }
    }, 1000);
  }, [key, defaultConfig.cacheTime]);

  // Détecter les conflits pour les tableaux
  const detectConflict = useCallback((local: T[], remote: T[]): boolean => {
    if (local.length !== remote.length) return true;
    
    // Comparer les timestamps de modification
    const localTimestamps = local.map(item => 
      item.updatedAt ? new Date(item.updatedAt).getTime() : 0
    );
    const remoteTimestamps = remote.map(item => 
      item.updatedAt ? new Date(item.updatedAt).getTime() : 0
    );
    
    return !localTimestamps.every((time, index) => 
      Math.abs(time - remoteTimestamps[index]) <= 1000
    );
  }, []);

  // Résoudre automatiquement les conflits pour les tableaux
  const autoResolveConflict = useCallback((local: T[], remote: T[]): T[] => {
    if (defaultConfig.onConflict) {
      return defaultConfig.onConflict(local, remote);
    }

    // Stratégie simple : prendre le plus récent basé sur le dernier élément modifié
    const localLastUpdate = local.length > 0 ? 
      Math.max(...local.map(item => 
        item.updatedAt ? new Date(item.updatedAt).getTime() : 0
      )) : 0;
    const remoteLastUpdate = remote.length > 0 ? 
      Math.max(...remote.map(item => 
        item.updatedAt ? new Date(item.updatedAt).getTime() : 0
      )) : 0;
    
    return remoteLastUpdate > localLastUpdate ? remote : local;
  }, [defaultConfig.onConflict]);

  // Synchronisation avec le serveur
  const sync = useCallback(async (force = false) => {
    const cachedEntry = cacheRef.current.get(key);
    
    if (!force && cachedEntry && !isStale(cachedEntry)) {
      setState(prev => ({ 
        ...prev, 
        data: cachedEntry.data, 
        isStale: false,
        error: null
      }));
      return;
    }

    setState(prev => ({ ...prev, isSyncing: true, error: null }));

    let retryCount = 0;
    const attemptSync = async (): Promise<void> => {
      try {
        const response = await fetch(`/api/sync/${key}`, {
          headers: {
            ...(cachedEntry?.etag && { 'If-None-Match': cachedEntry.etag }),
            ...(cachedEntry?.lastModified && { 'If-Modified-Since': cachedEntry.lastModified })
          }
        });

        if (response.status === 304) {
          // Pas de changement, actualiser timestamp
          if (cachedEntry) {
            saveToCache(cachedEntry.data, cachedEntry.etag, cachedEntry.lastModified);
            setState(prev => ({ 
              ...prev, 
              data: cachedEntry.data,
              isStale: false,
              isSyncing: false,
              lastSyncTime: Date.now()
            }));
          }
          return;
        }

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const remoteData: T[] = await response.json();
        const etag = response.headers.get('etag') || undefined;
        const lastModified = response.headers.get('last-modified') || undefined;

        // Vérifier les conflits
        if (cachedEntry && detectConflict(cachedEntry.data, remoteData)) {
          const resolved = autoResolveConflict(cachedEntry.data, remoteData);
          
          setState(prev => ({ 
            ...prev,
            data: resolved,
            conflictResolution: resolved === cachedEntry.data ? 'local' : 'remote',
            isSyncing: false,
            isStale: false,
            lastSyncTime: Date.now()
          }));

          saveToCache(resolved, etag, lastModified);
          defaultConfig.onSync?.(resolved);
        } else {
          // Pas de conflit, utiliser les données du serveur
          setState(prev => ({ 
            ...prev,
            data: remoteData,
            conflictResolution: null,
            isSyncing: false,
            isStale: false,
            lastSyncTime: Date.now()
          }));

          saveToCache(remoteData, etag, lastModified);
          defaultConfig.onSync?.(remoteData);
        }

      } catch (error) {
        retryCount++;
        if (retryCount <= defaultConfig.retryAttempts) {
          console.warn(`⚠️ Sync failed, retry ${retryCount}/${defaultConfig.retryAttempts}:`, error);
          retryTimeoutRef.current = setTimeout(
            attemptSync, 
            defaultConfig.retryDelay * Math.pow(2, retryCount - 1) // Backoff exponentiel
          );
        } else {
          setState(prev => ({ 
            ...prev,
            error: error instanceof Error ? error.message : 'Erreur de synchronisation',
            isSyncing: false
          }));
        }
      }
    };

    await attemptSync();
  }, [key, isStale, saveToCache, detectConflict, autoResolveConflict, defaultConfig]);

  // Mise à jour locale (optimiste)
  const updateLocal = useCallback((data: T[]) => {
    setState(prev => ({ ...prev, data, isStale: true }));
    saveToCache(data);
  }, [saveToCache]);

  // Invalider le cache
  const invalidate = useCallback(() => {
    cacheRef.current.delete(key);
    setState(prev => ({ ...prev, isStale: true }));
  }, [key]);

  // Résoudre manuellement un conflit
  const resolveConflict = useCallback((resolution: 'local' | 'remote' | 'merge') => {
    const cachedEntry = cacheRef.current.get(key);
    if (!cachedEntry || !state.conflictResolution) return;

    setState(prev => ({ ...prev, conflictResolution: resolution }));
    
    if (resolution === 'remote') {
      sync(true); // Forcer la synchronisation
    }
  }, [key, state.conflictResolution, sync]);

  // Charger depuis le cache au montage
  useEffect(() => {
    const cachedEntry = cacheRef.current.get(key);
    if (cachedEntry) {
      setState(prev => ({ 
        ...prev, 
        data: cachedEntry.data,
        isStale: isStale(cachedEntry),
        lastSyncTime: cachedEntry.timestamp
      }));

      if (defaultConfig.refetchOnMount || isStale(cachedEntry)) {
        sync();
      }
    } else if (defaultConfig.refetchOnMount) {
      sync();
    }
  }, [key, sync, isStale, defaultConfig.refetchOnMount]);

  // Synchronisation périodique
  useEffect(() => {
    if (defaultConfig.staleTime > 0) {
      syncIntervalRef.current = setInterval(() => {
        if (state.data) {
          sync();
        }
      }, defaultConfig.staleTime);

      return () => {
        if (syncIntervalRef.current) {
          clearInterval(syncIntervalRef.current);
        }
      };
    }
  }, [sync, state.data, defaultConfig.staleTime]);

  // Synchronisation au focus de la fenêtre
  useEffect(() => {
    if (defaultConfig.refetchOnWindowFocus) {
      const handleFocus = () => {
        if (state.data && isStale(cacheRef.current.get(key)!)) {
          sync();
        }
      };

      window.addEventListener('focus', handleFocus);
      return () => window.removeEventListener('focus', handleFocus);
    }
  }, [sync, state.data, isStale, key, defaultConfig.refetchOnWindowFocus]);

  // Nettoyage
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, []);

  return {
    ...state,
    sync,
    invalidate,
    updateLocal,
    resolveConflict
  };
}

// Hook spécialisé pour les listes d'entités avec synchronisation
export function useSyncEntityList<T extends EntityWithTimestamp>(
  entityType: string,
  fetcher: () => Promise<T[]>,
  config: Partial<SyncCacheConfig<T[]>> = {}
) {
  const syncCache = useSyncCacheForArray<T>(`${entityType}_list`, fetcher, config);

  const addEntity = useCallback((entity: T) => {
    if (syncCache.data) {
      const updated = [entity, ...syncCache.data];
      syncCache.updateLocal(updated);
    }
  }, [syncCache]);

  const updateEntity = useCallback((id: string, updates: Partial<T>) => {
    if (syncCache.data) {
      const updated = syncCache.data.map(item => 
        item.id === id ? { ...item, ...updates } as T : item
      );
      syncCache.updateLocal(updated);
    }
  }, [syncCache]);

  const removeEntity = useCallback((id: string) => {
    if (syncCache.data) {
      const updated = syncCache.data.filter(item => item.id !== id);
      syncCache.updateLocal(updated);
    }
  }, [syncCache]);

  return {
    ...syncCache,
    entities: syncCache.data || [],
    addEntity,
    updateEntity,
    removeEntity
  };
}

/**
 * Hook pour la gestion des événements personnalisés entre composants
 * Permet la communication entre hooks sans couplage direct
 */
export function useCustomEvents<T>(eventName: string) {
  const [lastEvent, setLastEvent] = useState<T | null>(null);

  const dispatchEvent = useCallback((data: T) => {
    window.dispatchEvent(new CustomEvent(eventName, { detail: data }));
  }, [eventName]);

  const addEventListener = useCallback((handler: (data: T) => void) => {
    const eventHandler = (event: Event) => {
      const customEvent = event as CustomEvent<T>;
      setLastEvent(customEvent.detail);
      handler(customEvent.detail);
    };

    window.addEventListener(eventName, eventHandler);
    
    return () => {
      window.removeEventListener(eventName, eventHandler);
    };
  }, [eventName]);

  return {
    dispatchEvent,
    addEventListener,
    lastEvent,
  };
}