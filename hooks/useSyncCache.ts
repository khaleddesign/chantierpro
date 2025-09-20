"use client";

import { useEffect, useCallback, useState } from "react";

interface SyncCacheOptions<T> {
  autoSync?: boolean;
  syncInterval?: number;
  onSync?: (entities: T[]) => void;
  onError?: (error: Error) => void;
}

interface SyncEntityListResult<T> {
  sync: () => Promise<void>;
  invalidateCache: () => void;
  isSyncing: boolean;
  lastSync: Date | null;
}

/**
 * Hook pour la synchronisation intelligente avec cache
 * Gère la synchronisation automatique et la validation des données
 */
export function useSyncEntityList<T extends { id: string; updatedAt?: string }>(
  entityType: string,
  baseUrl: string,
  setEntities: React.Dispatch<React.SetStateAction<T[]>>,
  options: SyncCacheOptions<T> = {}
): SyncEntityListResult<T> {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [cacheKey, setCacheKey] = useState<string>('');

  const sync = useCallback(async (): Promise<void> => {
    setIsSyncing(true);
    
    try {
      // ✅ Génération d'une clé de cache basée sur le timestamp
      const currentCacheKey = `${entityType}-${Date.now()}`;
      
      const response = await fetch(`${baseUrl}?cache=${currentCacheKey}`);
      
      if (!response.ok) {
        throw new Error(`Erreur de synchronisation ${entityType}`);
      }

      const data = await response.json();
      const entities = data[entityType] || data.entities || data;
      
      if (Array.isArray(entities)) {
        setEntities(entities);
        setCacheKey(currentCacheKey);
        setLastSync(new Date());
        options.onSync?.(entities);
      }

    } catch (error) {
      const err = error instanceof Error ? error : new Error('Erreur de synchronisation');
      options.onError?.(err);
      console.error(`Erreur sync ${entityType}:`, err);
    } finally {
      setIsSyncing(false);
    }
  }, [entityType, baseUrl, setEntities, options]);

  const invalidateCache = useCallback(() => {
    setCacheKey('');
    setLastSync(null);
  }, []);

  // ✅ Synchronisation automatique
  useEffect(() => {
    if (options.autoSync !== false) {
      const interval = setInterval(() => {
        sync();
      }, options.syncInterval || 30000); // 30s par défaut

      return () => clearInterval(interval);
    }
  }, [sync, options.autoSync, options.syncInterval]);

  return {
    sync,
    invalidateCache,
    isSyncing,
    lastSync,
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
