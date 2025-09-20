import { useState, useEffect, useCallback } from 'react';
import type { Client, ClientFilters, APIResponse, UseClientsReturn } from '@/types/crm';

// Hook personnalisé pour gérer la liste des clients
export function useClients(initialFilters?: ClientFilters): UseClientsReturn {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState<ClientFilters>(initialFilters || {});

  const fetchClients = useCallback(async (clientFilters = filters, page = 1, limit = 20) => {
    try {
      setLoading(true);
      setError(null);

      // Construction des paramètres de requête
      const searchParams = new URLSearchParams();
      searchParams.append('page', page.toString());
      searchParams.append('limit', limit.toString());
      
      if (clientFilters.search) {
        searchParams.append('search', clientFilters.search);
      }
      if (clientFilters.typeClient && clientFilters.typeClient !== 'TOUS') {
        searchParams.append('typeClient', clientFilters.typeClient);
      }
      if (clientFilters.ville) {
        searchParams.append('ville', clientFilters.ville);
      }
      if (clientFilters.commercial) {
        searchParams.append('commercial', clientFilters.commercial);
      }

      const response = await fetch(`/api/crm/clients?${searchParams.toString()}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result: APIResponse<{
        clients: Client[];
        pagination: { total: number };
      }> = await response.json();

      if (result.success && result.data) {
        setClients(result.data.clients);
        setTotal(result.data.pagination.total);
      } else {
        throw new Error(result.error || 'Erreur lors du chargement des clients');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      console.error('Erreur fetchClients:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const refetch = useCallback(() => {
    return fetchClients();
  }, [fetchClients]);

  // Fonction pour appliquer de nouveaux filtres
  const updateFilters = useCallback((newFilters: Partial<ClientFilters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    return fetchClients(updatedFilters);
  }, [filters, fetchClients]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  // ✅ Listener pour les créations de clients
  useEffect(() => {
    const handleClientCreated = (event: CustomEvent) => {
      setClients(prev => [event.detail, ...prev]);
      setTotal(prev => prev + 1);
    };
    
    window.addEventListener('clientCreated', handleClientCreated as EventListener);
    return () => window.removeEventListener('clientCreated', handleClientCreated as EventListener);
  }, []);

  return {
    clients,
    loading,
    error,
    refetch,
    total,
    // Fonctions supplémentaires
    updateFilters,
    fetchClients
  } as UseClientsReturn & {
    updateFilters: (filters: Partial<ClientFilters>) => Promise<void>;
    fetchClients: (filters?: ClientFilters, page?: number, limit?: number) => Promise<void>;
  };
}

// Hook pour gérer un client spécifique
export function useClient(clientId: string) {
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClient = useCallback(async () => {
    if (!clientId) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/users/${clientId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result: APIResponse<Client> = await response.json();

      if (result.success && result.data) {
        setClient(result.data);
      } else {
        throw new Error(result.error || 'Client non trouvé');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      console.error('Erreur fetchClient:', err);
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  const updateClient = useCallback(async (data: Partial<Client>) => {
    if (!clientId) return;

    try {
      setError(null);

      const response = await fetch(`/api/users/${clientId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result: APIResponse<Client> = await response.json();

      if (result.success && result.data) {
        setClient(result.data);
        return result.data;
      } else {
        throw new Error(result.error || 'Erreur lors de la mise à jour');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      throw err;
    }
  }, [clientId]);

  const deleteClient = useCallback(async () => {
    if (!clientId) return;

    try {
      setError(null);

      const response = await fetch(`/api/users/${clientId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result: APIResponse = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Erreur lors de la suppression');
      }

      setClient(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      throw err;
    }
  }, [clientId]);

  useEffect(() => {
    fetchClient();
  }, [fetchClient]);

  return {
    client,
    loading,
    error,
    refetch: fetchClient,
    update: updateClient,
    delete: deleteClient
  };
}

// Hook pour créer un nouveau client
export function useCreateClient() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createClient = useCallback(async (clientData: Partial<Client>): Promise<Client> => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/crm/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(clientData),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result: APIResponse<Client> = await response.json();

      if (result.success && result.data) {
        // ✅ Notification pour la liste principale
        window.dispatchEvent(new CustomEvent('clientCreated', { 
          detail: result.data 
        }));
        
        return result.data;
      } else {
        throw new Error(result.error || 'Erreur lors de la création du client');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    createClient,
    loading,
    error
  };
}

// Hook pour les actions rapides sur les clients
export function useClientActions() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const callClient = useCallback((phoneNumber?: string) => {
    if (phoneNumber) {
      window.open(`tel:${phoneNumber}`, '_self');
    }
  }, []);

  const emailClient = useCallback((email?: string) => {
    if (email) {
      window.open(`mailto:${email}`, '_blank');
    }
  }, []);

  const createQuote = useCallback((clientId: string) => {
    window.open(`/dashboard/devis/nouveau?clientId=${clientId}`, '_blank');
  }, []);

  const scheduleAppointment = useCallback((clientId: string) => {
    window.open(`/dashboard/planning/nouveau?clientId=${clientId}`, '_blank');
  }, []);

  const viewProjects = useCallback((clientId: string) => {
    window.open(`/dashboard/chantiers?clientId=${clientId}`, '_blank');
  }, []);

  const exportClients = useCallback(async (clients: Client[], format: 'csv' | 'excel' = 'csv') => {
    try {
      setLoading(true);
      setError(null);

      if (format === 'csv') {
        const headers = ['Nom', 'Email', 'Téléphone', 'Entreprise', 'Type', 'Ville', 'Chiffre d\'affaires'];
        const csvData = clients.map(client => [
          client.name,
          client.email,
          client.phone || '',
          client.company || '',
          client.typeClient,
          client.ville || '',
          client.chiffreAffaires?.toString() || '0'
        ]);

        const csvContent = [headers, ...csvData]
          .map(row => row.map(field => `"${field}"`).join(','))
          .join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `clients_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        URL.revokeObjectURL(link.href);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de l\'export';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    callClient,
    emailClient,
    createQuote,
    scheduleAppointment,
    viewProjects,
    exportClients,
    loading,
    error
  };
}