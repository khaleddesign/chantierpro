"use client";

import { useState, useCallback, useRef } from 'react';

interface OptimisticOperation<T> {
  id: string;
  type: 'create' | 'update' | 'delete';
  entity: T;
  previousState?: T[];
  rollback: () => void;
  timestamp: number;
}

interface UseOptimisticUpdatesConfig<T> {
  onSuccess?: (operation: OptimisticOperation<T>) => void;
  onError?: (operation: OptimisticOperation<T>, error: Error) => void;
  timeout?: number; // Temps limite avant rollback automatique
}

export function useOptimisticUpdates<T extends { id: string }>(
  entities: T[],
  setEntities: React.Dispatch<React.SetStateAction<T[]>>,
  config: UseOptimisticUpdatesConfig<T> = {}
) {
  const [pendingOperations, setPendingOperations] = useState<Map<string, OptimisticOperation<T>>>(new Map());
  const timeoutRefs = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const { timeout = 10000 } = config; // 10s par défaut

  // Génère un ID unique pour chaque opération
  const generateOperationId = () => `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Rollback automatique après timeout
  const scheduleRollback = useCallback((operationId: string, operation: OptimisticOperation<T>) => {
    const timeoutId = setTimeout(() => {
      console.warn(`⚠️ Rollback automatique après timeout: ${operationId}`);
      operation.rollback();
      setPendingOperations(prev => {
        const newMap = new Map(prev);
        newMap.delete(operationId);
        return newMap;
      });
      config.onError?.(operation, new Error('Timeout: opération non confirmée'));
    }, timeout);

    timeoutRefs.current.set(operationId, timeoutId);
  }, [timeout, config]);

  // Confirme une opération (supprime le timeout de rollback)
  const confirmOperation = useCallback((operationId: string) => {
    const timeoutId = timeoutRefs.current.get(operationId);
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutRefs.current.delete(operationId);
    }

    const operation = pendingOperations.get(operationId);
    if (operation) {
      config.onSuccess?.(operation);
      setPendingOperations(prev => {
        const newMap = new Map(prev);
        newMap.delete(operationId);
        return newMap;
      });
    }
  }, [pendingOperations, config]);

  // Rejette une opération (déclenche le rollback)
  const rejectOperation = useCallback((operationId: string, error: Error) => {
    const operation = pendingOperations.get(operationId);
    if (operation) {
      operation.rollback();
      config.onError?.(operation, error);
      
      const timeoutId = timeoutRefs.current.get(operationId);
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutRefs.current.delete(operationId);
      }

      setPendingOperations(prev => {
        const newMap = new Map(prev);
        newMap.delete(operationId);
        return newMap;
      });
    }
  }, [pendingOperations, config]);

  // ✅ CRÉATION OPTIMISTE
  const optimisticCreate = useCallback((newEntity: T): string => {
    const operationId = generateOperationId();
    const previousState = [...entities];

    const operation: OptimisticOperation<T> = {
      id: operationId,
      type: 'create',
      entity: newEntity,
      previousState,
      rollback: () => {
        console.log(`🔄 Rollback CREATE: ${newEntity.id}`);
        setEntities(previousState);
      },
      timestamp: Date.now()
    };

    // Mise à jour optimiste immédiate
    setEntities(prev => [newEntity, ...prev]);

    // Enregistrer l'opération
    setPendingOperations(prev => new Map(prev).set(operationId, operation));
    scheduleRollback(operationId, operation);

    return operationId;
  }, [entities, setEntities, scheduleRollback]);

  // ✅ MISE À JOUR OPTIMISTE
  const optimisticUpdate = useCallback((entityId: string, updates: Partial<T>): string => {
    const operationId = generateOperationId();
    const previousState = [...entities];
    const entityIndex = entities.findIndex(e => e.id === entityId);
    
    if (entityIndex === -1) {
      throw new Error(`Entity ${entityId} not found for update`);
    }

    const updatedEntity = { ...entities[entityIndex], ...updates };

    const operation: OptimisticOperation<T> = {
      id: operationId,
      type: 'update',
      entity: updatedEntity,
      previousState,
      rollback: () => {
        console.log(`🔄 Rollback UPDATE: ${entityId}`);
        setEntities(previousState);
      },
      timestamp: Date.now()
    };

    // Mise à jour optimiste immédiate
    setEntities(prev => prev.map(entity => 
      entity.id === entityId ? updatedEntity : entity
    ));

    // Enregistrer l'opération
    setPendingOperations(prev => new Map(prev).set(operationId, operation));
    scheduleRollback(operationId, operation);

    return operationId;
  }, [entities, setEntities, scheduleRollback]);

  // ✅ SUPPRESSION OPTIMISTE
  const optimisticDelete = useCallback((entityId: string): string => {
    const operationId = generateOperationId();
    const previousState = [...entities];
    const entityToDelete = entities.find(e => e.id === entityId);

    if (!entityToDelete) {
      throw new Error(`Entity ${entityId} not found for deletion`);
    }

    const operation: OptimisticOperation<T> = {
      id: operationId,
      type: 'delete',
      entity: entityToDelete,
      previousState,
      rollback: () => {
        console.log(`🔄 Rollback DELETE: ${entityId}`);
        setEntities(previousState);
      },
      timestamp: Date.now()
    };

    // Suppression optimiste immédiate
    setEntities(prev => prev.filter(entity => entity.id !== entityId));

    // Enregistrer l'opération
    setPendingOperations(prev => new Map(prev).set(operationId, operation));
    scheduleRollback(operationId, operation);

    return operationId;
  }, [entities, setEntities, scheduleRollback]);

  // Nettoyage lors du démontage
  const cleanup = useCallback(() => {
    timeoutRefs.current.forEach(timeoutId => clearTimeout(timeoutId));
    timeoutRefs.current.clear();
    setPendingOperations(new Map());
  }, []);

  return {
    // Opérations optimistes
    optimisticCreate,
    optimisticUpdate,
    optimisticDelete,
    
    // Confirmation/rejet
    confirmOperation,
    rejectOperation,
    
    // État
    pendingOperations: Array.from(pendingOperations.values()),
    hasPendingOperations: pendingOperations.size > 0,
    
    // Utilitaires
    cleanup
  };
}

// Hook spécialisé pour les opérations CRUD avec API
export function useOptimisticCRUD<T extends { id: string }>(
  entities: T[],
  setEntities: React.Dispatch<React.SetStateAction<T[]>>,
  baseApiUrl: string
) {
  const optimistic = useOptimisticUpdates(entities, setEntities, {
    onSuccess: (operation) => {
      console.log(`✅ Opération confirmée: ${operation.type} ${operation.entity.id}`);
    },
    onError: (operation, error) => {
      console.error(`❌ Opération échouée: ${operation.type} ${operation.entity.id}`, error);
    }
  });

  // ✅ CRÉATION avec optimisme
  const createEntity = useCallback(async (data: Omit<T, 'id'>) => {
    // Générer un ID temporaire pour l'entité
    const tempId = `temp_${Date.now()}`;
    const tempEntity = { ...data, id: tempId } as T;

    // Opération optimiste
    const operationId = optimistic.optimisticCreate(tempEntity);

    try {
      const response = await fetch(baseApiUrl, {
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
      optimistic.confirmOperation(operationId);
      
      return { success: true, data: realEntity };

    } catch (error) {
      // Rejeter l'opération (rollback automatique)
      optimistic.rejectOperation(operationId, error as Error);
      return { success: false, error: error instanceof Error ? error.message : 'Erreur inconnue' };
    }
  }, [baseApiUrl, optimistic, setEntities]);

  // ✅ MISE À JOUR avec optimisme
  const updateEntity = useCallback(async (id: string, updates: Partial<T>) => {
    // Opération optimiste
    const operationId = optimistic.optimisticUpdate(id, updates);

    try {
      const response = await fetch(`${baseApiUrl}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
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
      optimistic.confirmOperation(operationId);
      
      return { success: true, data: updatedEntity };

    } catch (error) {
      // Rejeter l'opération (rollback automatique)
      optimistic.rejectOperation(operationId, error as Error);
      return { success: false, error: error instanceof Error ? error.message : 'Erreur inconnue' };
    }
  }, [baseApiUrl, optimistic, setEntities]);

  // ✅ SUPPRESSION avec optimisme
  const deleteEntity = useCallback(async (id: string) => {
    // Opération optimiste
    const operationId = optimistic.optimisticDelete(id);

    try {
      const response = await fetch(`${baseApiUrl}/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Confirmer l'opération
      optimistic.confirmOperation(operationId);
      
      return { success: true };

    } catch (error) {
      // Rejeter l'opération (rollback automatique)
      optimistic.rejectOperation(operationId, error as Error);
      return { success: false, error: error instanceof Error ? error.message : 'Erreur inconnue' };
    }
  }, [baseApiUrl, optimistic]);

  return {
    createEntity,
    updateEntity,
    deleteEntity,
    pendingOperations: optimistic.pendingOperations,
    hasPendingOperations: optimistic.hasPendingOperations,
    cleanup: optimistic.cleanup
  };
}
