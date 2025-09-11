'use client';

import { useState, useEffect } from 'react';
import { EtapeChantier, EtapeFormData } from '@/types/etapes';

interface UseEtapesOptions {
  chantierId: string;
  autoRefresh?: boolean;
}

export function useEtapes(options: UseEtapesOptions) {
  const [etapes, setEtapes] = useState<EtapeChantier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEtapes = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        chantierId: options.chantierId
      });

      const response = await fetch(`/api/etapes?${params}`);
      const data = await response.json();
      
      if (response.ok) {
        setEtapes(data.etapes || []);
      } else {
        setError(data.error || 'Erreur lors du chargement');
      }
    } catch (err) {
      setError('Erreur réseau');
      console.error('Erreur useEtapes:', err);
    } finally {
      setLoading(false);
    }
  };

  const createEtape = async (data: EtapeFormData & { chantierId: string; createdById: string }) => {
    try {
      const response = await fetch('/api/etapes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      const result = await response.json();
      
      if (response.ok) {
        await fetchEtapes();
        return result;
      } else {
        throw new Error(result.error || 'Erreur lors de la création');
      }
    } catch (err) {
      throw err;
    }
  };

  const updateEtape = async (id: string, data: Partial<EtapeFormData>) => {
    try {
      const response = await fetch(`/api/etapes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      const result = await response.json();
      
      if (response.ok) {
        await fetchEtapes();
        return result;
      } else {
        throw new Error(result.error || 'Erreur lors de la modification');
      }
    } catch (err) {
      throw err;
    }
  };

  const deleteEtape = async (id: string) => {
    try {
      const response = await fetch(`/api/etapes/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await fetchEtapes();
        return true;
      } else {
        const result = await response.json();
        throw new Error(result.error || 'Erreur lors de la suppression');
      }
    } catch (err) {
      throw err;
    }
  };

  useEffect(() => {
    if (options.chantierId) {
      fetchEtapes();
    }
  }, [options.chantierId]);

  useEffect(() => {
    if (options.autoRefresh && options.chantierId) {
      const interval = setInterval(() => {
        fetchEtapes();
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [options.autoRefresh, options.chantierId]);

  return {
    etapes,
    loading,
    error,
    actions: {
      fetchEtapes,
      createEtape,
      updateEtape,
      deleteEtape,
      refresh: fetchEtapes
    }
  };
}
