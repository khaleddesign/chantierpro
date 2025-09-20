"use client";

import { useState, useCallback, useEffect } from 'react';
import { useOptimisticUpdates } from './useOptimisticUpdates';
import { useSyncEntityList } from './useSyncCache';

interface EntityManagerConfig<T> {
  entityType: string;
  apiEndpoint: string;
  staleTime?: number;
  enableSync?: boolean;
  enableOptimistic?: boolean;
  onSuccess?: (entity: T) => void;
  onError?: (error: Error) => void;
}

interface EntityManagerState<T> {
  entities: T[];
  loading: boolean;
  error: string | null;
  isSyncing: boolean;
  lastSync: Date | null;
  pendingOperations: any[];
  hasPendingOperations: boolean;
}

interface EntityManagerActions<T> {
  create: (data: Omit<T, 'id'>) => Promise<{ success: boolean; data?: T; error?: string }>;
  update: (id: string, data: Partial<T>) => Promise<{ success: boolean; data?: T; error?: string }>;
  delete: (id: string) => Promise<{ success: boolean; error?: string }>;
  refresh: () => Promise<void>;
  clearError: () => void;
}

export function useEntityManager<T extends { id: string; updatedAt?: string }>(
  config: EntityManagerConfig<T>
): EntityManagerState<T> & EntityManagerActions<T> {
  const {
    entityType,
    apiEndpoint,
    staleTime = 5 * 60 * 1000, // 5 minutes
    enableSync = true,
    enableOptimistic = true,
    onSuccess,
    onError
  } = config;

  const [entities, setEntities] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Hook de synchronisation
  const syncCache = useSyncEntityList<T>(
    entityType,
    async () => {
      const response = await fetch(apiEndpoint);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      return data[entityType] || data.entities || data;
    },
    {
      staleTime,
      onSync: (data) => {
        setEntities(data);
        setError(null);
      },
      onConflict: (local, remote) => {
        // Stratégie de résolution de conflit : prendre le plus récent
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
    }
  );

  // Hook d'opérations optimistes
  const optimisticCRUD = useOptimisticUpdates(
    entities,
    setEntities,
    {
      onSuccess: (operation) => {
        console.log(`✅ Opération confirmée: ${operation.type} ${operation.entity.id}`);
      },
      onError: (operation, error) => {
        console.error(`❌ Opération échouée: ${operation.type} ${operation.entity.id}`, error);
      }
    }
  );

  // Actions CRUD
  const create = useCallback(async (data: Omit<T, 'id'>) => {
    if (enableOptimistic) {
      // Générer un ID temporaire pour l'entité
      const tempId = `temp_${Date.now()}`;
      const tempEntity = { ...data, id: tempId } as T;

      // Opération optimiste
      const operationId = optimisticCRUD.optimisticCreate(tempEntity);

      try {
        const response = await fetch(apiEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const realEntity: T = await response.json();
        
        // Remplacer l'entité temporaire par la vraie
        setEntities(prev => prev.map(entity => 
          entity.id === tempId ? realEntity : entity
        ));

        // Confirmer l'opération
        optimisticCRUD.confirmOperation(operationId);
        
        return { success: true, data: realEntity };
      } catch (error) {
        // Rejeter l'opération (rollback automatique)
        optimisticCRUD.rejectOperation(operationId, error as Error);
        return { success: false, error: error instanceof Error ? error.message : 'Erreur inconnue' };
      }
    } else {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(apiEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const newEntity: T = await response.json();
        setEntities(prev => [newEntity, ...prev]);
        onSuccess?.(newEntity);
        
        return { success: true, data: newEntity };
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Erreur inconnue');
        setError(error.message);
        onError?.(error);
        return { success: false, error: error.message };
      } finally {
        setLoading(false);
      }
    }
  }, [apiEndpoint, enableOptimistic, optimisticCRUD, onSuccess, onError]);

  const update = useCallback(async (id: string, data: Partial<T>) => {
    if (enableOptimistic) {
      // Opération optimiste
      const operationId = optimisticCRUD.optimisticUpdate(id, data);

      try {
        const response = await fetch(`${apiEndpoint}/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const updatedEntity: T = await response.json();
        
        // Mettre à jour avec les vraies données du serveur
        setEntities(prev => prev.map(entity => 
          entity.id === id ? updatedEntity : entity
        ));

        // Confirmer l'opération
        optimisticCRUD.confirmOperation(operationId);
        
        return { success: true, data: updatedEntity };
      } catch (error) {
        // Rejeter l'opération (rollback automatique)
        optimisticCRUD.rejectOperation(operationId, error as Error);
        return { success: false, error: error instanceof Error ? error.message : 'Erreur inconnue' };
      }
    } else {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`${apiEndpoint}/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const updatedEntity: T = await response.json();
        setEntities(prev => prev.map(entity => 
          entity.id === id ? updatedEntity : entity
        ));
        onSuccess?.(updatedEntity);
        
        return { success: true, data: updatedEntity };
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Erreur inconnue');
        setError(error.message);
        onError?.(error);
        return { success: false, error: error.message };
      } finally {
        setLoading(false);
      }
    }
  }, [apiEndpoint, enableOptimistic, optimisticCRUD, onSuccess, onError]);

  const deleteEntity = useCallback(async (id: string) => {
    if (enableOptimistic) {
      // Opération optimiste
      const operationId = optimisticCRUD.optimisticDelete(id);

      try {
        const response = await fetch(`${apiEndpoint}/${id}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        // Confirmer l'opération
        optimisticCRUD.confirmOperation(operationId);
        
        return { success: true };
      } catch (error) {
        // Rejeter l'opération (rollback automatique)
        optimisticCRUD.rejectOperation(operationId, error as Error);
        return { success: false, error: error instanceof Error ? error.message : 'Erreur inconnue' };
      }
    } else {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`${apiEndpoint}/${id}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        setEntities(prev => prev.filter(entity => entity.id !== id));
        
        return { success: true };
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Erreur inconnue');
        setError(error.message);
        onError?.(error);
        return { success: false, error: error.message };
      } finally {
        setLoading(false);
      }
    }
  }, [apiEndpoint, enableOptimistic, optimisticCRUD, onError]);

  const refresh = useCallback(async () => {
    if (enableSync) {
      await syncCache.sync();
    } else {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(apiEndpoint);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        const fetchedEntities = data[entityType] || data.entities || data;
        setEntities(fetchedEntities);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Erreur inconnue');
        setError(error.message);
      } finally {
        setLoading(false);
      }
    }
  }, [apiEndpoint, enableSync, syncCache, entityType]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Synchroniser les états
  useEffect(() => {
    if (enableSync && syncCache.data) {
      setEntities(syncCache.data);
    }
  }, [enableSync, syncCache.data]);

  return {
    // État
    entities,
    loading: loading || syncCache.isSyncing,
    error: error || syncCache.error,
    isSyncing: syncCache.isSyncing,
    lastSync: syncCache.lastSyncTime ? new Date(syncCache.lastSyncTime) : null,
    pendingOperations: optimisticCRUD.pendingOperations,
    hasPendingOperations: optimisticCRUD.hasPendingOperations,

    // Actions
    create,
    update,
    delete: deleteEntity,
    refresh,
    clearError
  };
}

// Hook spécialisé pour les clients
export function useClientsManager() {
  return useEntityManager({
    entityType: 'clients',
    apiEndpoint: '/api/crm/clients',
    staleTime: 2 * 60 * 1000, // 2 minutes
    enableSync: true,
    enableOptimistic: true,
    onSuccess: (client) => {
      console.log(`✅ Client ${client.id} opéré avec succès`);
    },
    onError: (error) => {
      console.error(`❌ Erreur client:`, error);
    }
  });
}

// Hook spécialisé pour les chantiers
export function useChantiersManager() {
  return useEntityManager({
    entityType: 'chantiers',
    apiEndpoint: '/api/chantiers',
    staleTime: 3 * 60 * 1000, // 3 minutes
    enableSync: true,
    enableOptimistic: true,
    onSuccess: (chantier) => {
      console.log(`✅ Chantier ${chantier.id} opéré avec succès`);
    },
    onError: (error) => {
      console.error(`❌ Erreur chantier:`, error);
    }
  });
}

// Hook spécialisé pour les devis
export function useDevisManager() {
  return useEntityManager({
    entityType: 'devis',
    apiEndpoint: '/api/devis',
    staleTime: 2 * 60 * 1000, // 2 minutes
    enableSync: true,
    enableOptimistic: true,
    onSuccess: (devis) => {
      console.log(`✅ Devis ${devis.id} opéré avec succès`);
    },
    onError: (error) => {
      console.error(`❌ Erreur devis:`, error);
    }
  });
}
