'use client';

import { useState, useEffect } from 'react';

interface UsePlanningOptions {
  search?: string;
  type?: string;
  chantierId?: string;
  dateDebut?: string;
  dateFin?: string;
  autoRefresh?: boolean;
}

export function usePlanning(options: UsePlanningOptions = {}) {
  const [planning, setPlanning] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    pages: 0
  });

  const fetchPlanning = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString()
      });
      
      if (options.search) params.append('search', options.search);
      if (options.type) params.append('type', options.type);
      if (options.chantierId) params.append('chantierId', options.chantierId);
      if (options.dateDebut) params.append('dateDebut', options.dateDebut);
      if (options.dateFin) params.append('dateFin', options.dateFin);

      const response = await fetch(`/api/planning?${params}`);
      const data = await response.json();
      
      if (response.ok) {
        setPlanning(data.planning || []);
        setPagination(data.pagination || pagination);
      } else {
        setError(data.error || 'Erreur lors du chargement');
      }
    } catch (err) {
      setError('Erreur réseau');
      console.error('Erreur usePlanning:', err);
    } finally {
      setLoading(false);
    }
  };

  const createEvent = async (data: any) => {
    try {
      const response = await fetch('/api/planning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      const result = await response.json();
      
      if (response.ok) {
        await fetchPlanning();
        return result;
      } else {
        throw new Error(result.error || 'Erreur lors de la création');
      }
    } catch (err) {
      throw err;
    }
  };

  const updateEvent = async (id: string, data: any) => {
    try {
      const response = await fetch(`/api/planning/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      const result = await response.json();
      
      if (response.ok) {
        await fetchPlanning();
        return result;
      } else {
        throw new Error(result.error || 'Erreur lors de la modification');
      }
    } catch (err) {
      throw err;
    }
  };

  const deleteEvent = async (id: string) => {
    try {
      const response = await fetch(`/api/planning/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await fetchPlanning();
        return true;
      } else {
        const result = await response.json();
        throw new Error(result.error || 'Erreur lors de la suppression');
      }
    } catch (err) {
      throw err;
    }
  };

  const checkConflicts = async (eventData: any) => {
    try {
      const response = await fetch('/api/planning/conflicts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData)
      });

      const result = await response.json();
      
      if (response.ok) {
        return result.conflicts || [];
      } else {
        throw new Error(result.error || 'Erreur lors de la vérification des conflits');
      }
    } catch (err) {
      throw err;
    }
  };

  useEffect(() => {
    fetchPlanning();
  }, [options.search, options.type, options.chantierId, options.dateDebut, options.dateFin]);

  useEffect(() => {
    if (options.autoRefresh) {
      const interval = setInterval(() => {
        fetchPlanning(pagination.page);
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [options.autoRefresh, pagination.page]);

  return {
    planning,
    loading,
    error,
    pagination,
    actions: {
      fetchPlanning,
      createEvent,
      updateEvent,
      deleteEvent,
      checkConflicts,
      refresh: () => fetchPlanning(pagination.page),
      loadPage: fetchPlanning
    }
  };
}

export function usePlanningStats() {
  const [stats, setStats] = useState({
    totalEvents: 0,
    reunions: 0,
    livraisons: 0,
    inspections: 0,
    thisWeek: 0,
    thisMonth: 0,
    conflicts: 0
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/planning/stats');
      
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Erreur stats planning:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return { stats, loading, refresh: fetchStats };
}
