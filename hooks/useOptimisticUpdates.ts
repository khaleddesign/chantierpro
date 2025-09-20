"use client";

import { useCallback, useState } from "react";

interface OptimisticUpdateOptions<T> {
  onSuccess?: (result: T) => void;
  onError?: (error: Error) => void;
  rollbackOnError?: boolean;
  sortKey?: keyof T; // Clé pour le tri lors du rollback
}

interface OptimisticCRUDResult<T> {
  create: (data: any) => Promise<T>;
  update: (id: string, data: any) => Promise<T>;
  delete: (id: string) => Promise<boolean>;
  loading: boolean;
  error: string | null;
}

/**
 * Hook générique pour les opérations CRUD optimistes
 * Gère automatiquement la mise à jour d'état et le rollback en cas d'erreur
 */
export function useOptimisticCRUD<T extends { id: string }>(
  entities: T[],
  setEntities: React.Dispatch<React.SetStateAction<T[]>>,
  baseUrl: string,
  options: OptimisticUpdateOptions<T> = {}
): OptimisticCRUDResult<T> {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = useCallback(async (data: any): Promise<T> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la création');
      }

      const result: T = await response.json();
      
      // ✅ Mise à jour optimiste immédiate
      setEntities(prev => [result, ...prev]);
      
      options.onSuccess?.(result);
      return result;

    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erreur inconnue');
      setError(error.message);
      options.onError?.(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [baseUrl, setEntities, options]);

  const update = useCallback(async (id: string, data: any): Promise<T> => {
    setLoading(true);
    setError(null);

    // ✅ Sauvegarde de l'état précédent pour rollback
    const previousEntity = entities.find(e => e.id === id);
    
    try {
      // ✅ Mise à jour optimiste immédiate
      setEntities(prev => prev.map(entity => 
        entity.id === id ? { ...entity, ...data } : entity
      ));

      const response = await fetch(`${baseUrl}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la mise à jour');
      }

      const result: T = await response.json();
      
      // ✅ Mise à jour avec la vraie réponse
      setEntities(prev => prev.map(entity => 
        entity.id === id ? result : entity
      ));
      
      options.onSuccess?.(result);
      return result;

    } catch (err) {
      // ✅ Rollback automatique en cas d'erreur
      if (options.rollbackOnError !== false && previousEntity) {
        setEntities(prev => prev.map(entity => 
          entity.id === id ? previousEntity : entity
        ));
      }
      
      const error = err instanceof Error ? err : new Error('Erreur inconnue');
      setError(error.message);
      options.onError?.(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [baseUrl, entities, setEntities, options]);

  const deleteEntity = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    // ✅ Sauvegarde de l'état précédent pour rollback
    const previousEntity = entities.find(e => e.id === id);
    
    try {
      // ✅ Suppression optimiste immédiate
      setEntities(prev => prev.filter(entity => entity.id !== id));

      const response = await fetch(`${baseUrl}/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la suppression');
      }

      options.onSuccess?.(previousEntity as T);
      return true;

    } catch (err) {
      // ✅ Rollback automatique en cas d'erreur
      if (options.rollbackOnError !== false && previousEntity) {
        setEntities(prev => {
          const newEntities = [...prev, previousEntity];
          // Tri optionnel si une clé de tri est fournie
          if (options.sortKey) {
            return newEntities.sort((a, b) => {
              const aValue = a[options.sortKey!];
              const bValue = b[options.sortKey!];
              if (typeof aValue === 'string' && typeof bValue === 'string') {
                return bValue.localeCompare(aValue);
              }
              return 0;
            });
          }
          return newEntities;
        });
      }
      
      const error = err instanceof Error ? err : new Error('Erreur inconnue');
      setError(error.message);
      options.onError?.(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [baseUrl, entities, setEntities, options]);

  return {
    create,
    update,
    delete: deleteEntity,
    loading,
    error,
  };
}
