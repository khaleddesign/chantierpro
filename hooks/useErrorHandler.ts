"use client";

import { useState, useCallback } from "react";

interface ErrorHandlerOptions {
  showToast?: boolean;
  logToConsole?: boolean;
  fallbackMessage?: string;
}

interface ErrorHandlerResult {
  error: string | null;
  clearError: () => void;
  handleError: (error: unknown, context?: string) => void;
  isError: boolean;
}

/**
 * Hook générique pour la gestion d'erreurs
 * Centralise la gestion des erreurs avec options configurables
 */
export function useErrorHandler(options: ErrorHandlerOptions = {}): ErrorHandlerResult {
  const [error, setError] = useState<string | null>(null);

  const {
    showToast = true,
    logToConsole = true,
    fallbackMessage = "Une erreur inattendue s'est produite"
  } = options;

  const handleError = useCallback((error: unknown, context?: string) => {
    let errorMessage: string;

    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    } else {
      errorMessage = fallbackMessage;
    }

    // ✅ Logging conditionnel
    if (logToConsole) {
      console.error(`[${context || 'ErrorHandler'}]`, error);
    }

    // ✅ Affichage du toast conditionnel
    if (showToast) {
      // Ici on pourrait intégrer un système de toast global
      // Pour l'instant, on utilise console.warn pour la visibilité
      console.warn(`🚨 Erreur: ${errorMessage}`);
    }

    setError(errorMessage);
  }, [showToast, logToConsole, fallbackMessage]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    error,
    clearError,
    handleError,
    isError: !!error,
  };
}

/**
 * Hook pour la gestion des états de chargement multiples
 * Permet de gérer plusieurs opérations asynchrones simultanément
 */
export function useLoadingStates() {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});

  const setLoading = useCallback((key: string, loading: boolean) => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: loading
    }));
  }, []);

  const isLoading = useCallback((key: string) => {
    return loadingStates[key] || false;
  }, [loadingStates]);

  const isAnyLoading = Object.values(loadingStates).some(Boolean);

  return {
    setLoading,
    isLoading,
    isAnyLoading,
    loadingStates,
  };
}

/**
 * Hook pour la gestion des filtres et de la pagination
 * Standardise la gestion des filtres et de la pagination
 */
export function useFiltersAndPagination<T extends Record<string, any>>(
  initialFilters: Partial<T> = {},
  initialPagination = { page: 1, limit: 10, total: 0, totalPages: 0, hasNextPage: false, hasPrevPage: false }
) {
  const [filters, setFilters] = useState<Partial<T>>(initialFilters);
  const [pagination, setPagination] = useState(initialPagination);

  const updateFilters = useCallback((newFilters: Partial<T>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset à la page 1
  }, []);

  const updatePagination = useCallback((newPagination: Partial<typeof initialPagination>) => {
    setPagination(prev => ({ ...prev, ...newPagination }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(initialFilters);
    setPagination(initialPagination);
  }, [initialFilters, initialPagination]);

  return {
    filters,
    pagination,
    updateFilters,
    updatePagination,
    resetFilters,
    setFilters,
    setPagination,
  };
}