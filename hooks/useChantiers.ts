"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { ChantierStatus } from "@prisma/client";

export interface Chantier {
  id: string;
  nom: string;
  description: string;
  adresse: string;
  statut: ChantierStatus;
  progression: number;
  dateDebut: string;
  dateFin: string;
  budget: number;
  superficie: string;
  photo?: string;
  photos?: string;
  lat?: number;
  lng?: number;
  client: {
    id: string;
    name: string;
    email: string;
    company?: string;
    phone?: string;
  };
  assignees?: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
  }>;
  etapes?: Array<{
    id: string;
    titre: string;
    description?: string;
    statut: string;
    dateDebut: string;
    dateFin: string;
    ordre: number;
  }>;
  _count?: {
    messages: number;
    comments: number;
    etapes: number;
    documents: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ChantierFormData {
  nom: string;
  description: string;
  adresse: string;
  clientId: string;
  dateDebut: string;
  dateFin: string;
  budget: number;
  superficie: string;
  photo?: string;
  lat?: number;
  lng?: number;
}

export interface ChantiersResponse {
  chantiers: Chantier[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

interface UseChantierFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: ChantierStatus | 'TOUS';
  clientId?: string;
}

export function useChantiers() {
  const { data: session } = useSession();
  const [chantiers, setChantiers] = useState<Chantier[]>([]);
  const [chantier, setChantier] = useState<Chantier | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });

  const clearError = () => setError(null);

  // Récupérer tous les chantiers avec filtres
  const fetchChantiers = useCallback(async (filters: UseChantierFilters = {}) => {
    if (!session) return;

    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (filters.page) params.set('page', filters.page.toString());
      if (filters.limit) params.set('limit', filters.limit.toString());
      if (filters.search) params.set('search', filters.search);
      if (filters.status && filters.status !== 'TOUS') params.set('status', filters.status);
      if (filters.clientId) params.set('clientId', filters.clientId);

      const response = await fetch(`/api/chantiers?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors du chargement des chantiers');
      }

      const data: ChantiersResponse = await response.json();
      setChantiers(data.chantiers);
      setPagination(data.pagination);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement des chantiers';
      setError(errorMessage);
      console.error('Erreur fetchChantiers:', err);
    } finally {
      setLoading(false);
    }
  }, [session]);

  // Récupérer un chantier spécifique
  const fetchChantier = useCallback(async (id: string) => {
    if (!session) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/chantiers/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors du chargement du chantier');
      }

      const data = await response.json();
      setChantier(data);
      return data;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement du chantier';
      setError(errorMessage);
      console.error('Erreur fetchChantier:', err);
    } finally {
      setLoading(false);
    }
  }, [session]);

  // Créer un nouveau chantier
  const createChantier = async (data: ChantierFormData) => {
    if (!session) {
      setError('Session expirée');
      return { success: false };
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/chantiers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la création du chantier');
      }

      const newChantier = await response.json();
      
      // Ajouter le nouveau chantier à la liste
      setChantiers(prev => [newChantier, ...prev]);
      
      return { success: true, data: newChantier };

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la création du chantier';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Mettre à jour un chantier
  const updateChantier = async (id: string, data: Partial<ChantierFormData>) => {
    if (!session) {
      setError('Session expirée');
      return { success: false };
    }

    try {
      setLoading(true);
      setError(null);

      console.log('=== updateChantier - Début ===');
      console.log('ID:', id);
      console.log('Data:', JSON.stringify(data, null, 2));

      const response = await fetch(`/api/chantiers/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la mise à jour du chantier');
      }

      const updatedChantier = await response.json();
      
      // Mettre à jour dans la liste
      setChantiers(prev => 
        prev.map(c => c.id === id ? updatedChantier : c)
      );
      
      // Mettre à jour le chantier courant si c'est le même
      if (chantier && chantier.id === id) {
        setChantier(updatedChantier);
      }
      
      return { success: true, data: updatedChantier };

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la mise à jour du chantier';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Supprimer un chantier
  const deleteChantier = async (id: string) => {
    if (!session) {
      setError('Session expirée');
      return { success: false };
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/chantiers/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la suppression du chantier');
      }

      // Supprimer de la liste
      setChantiers(prev => prev.filter(c => c.id !== id));
      
      // Clear le chantier courant si c'est le même
      if (chantier && chantier.id === id) {
        setChantier(null);
      }
      
      return { success: true };

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la suppression du chantier';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  return {
    chantiers,
    chantier,
    loading,
    error,
    pagination,
    fetchChantiers,
    fetchChantier,
    createChantier,
    updateChantier,
    deleteChantier,
    clearError,
  };
}