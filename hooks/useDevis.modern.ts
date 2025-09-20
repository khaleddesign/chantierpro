"use client";

import { useState, useCallback, useEffect } from "react";
import { useSession } from "next-auth/react";
import { DevisStatus, DevisType } from "@prisma/client";
import { useOptimisticCRUD } from "./useOptimisticUpdates";
import { useSyncEntityList, useCustomEvents } from "./useSyncCache";
import { useErrorHandler, useFiltersAndPagination } from "./useErrorHandler";

// ✅ Types maintenus pour compatibilité
export interface Devis {
  id: string;
  numero: string;
  clientId: string;
  chantierId?: string;
  type: DevisType;
  objet: string;
  montant: number;
  totalHT: number;
  totalTVA: number;
  totalTTC: number;
  tva: number;
  statut: DevisStatus;
  dateCreation: string;
  dateEcheance: string;
  dateSignature?: string;
  consulteLe?: string;
  notes?: string;
  conditionsVente?: string;
  modalitesPaiement?: string;
  retenueGarantie?: number;
  autoliquidation: boolean;
  updatedAt?: string;
  client: {
    id: string;
    name: string;
    email: string;
    company?: string;
    phone?: string;
    address?: string;
    ville?: string;
    codePostal?: string;
  };
  chantier?: {
    id: string;
    nom: string;
    adresse?: string;
    description?: string;
  };
  ligneDevis: LigneDevis[];
  paiements?: Array<{
    id: string;
    montant: number;
    datePaiement: string;
    methode?: string;
    reference?: string;
  }>;
  _count?: {
    ligneDevis: number;
    paiements: number;
  };
}

export interface LigneDevis {
  id?: string;
  description: string;
  quantite: number;
  prixUnit: number;
  total: number;
  ordre: number;
}

export interface DevisFormData {
  clientId: string;
  chantierId?: string;
  type?: DevisType;
  objet?: string;
  dateEcheance: Date;
  lignes: Omit<LigneDevis, 'id' | 'total' | 'ordre'>[];
  notes?: string;
  conditionsVente?: string;
  modalitesPaiement?: string;
  tva?: number;
  retenueGarantie?: number;
  autoliquidation?: boolean;
}

interface UseDevisFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: DevisStatus | "TOUS";
  type?: DevisType;
  clientId?: string;
  chantierId?: string;
}

interface PaginationState {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

// ✅ HOOK MODERNE AVEC ARCHITECTURE ROBUSTE
export function useDevis() {
  const { data: session } = useSession();
  const errorHandler = useErrorHandler();
  
  // ✅ États locaux optimisés
  const [devis, setDevis] = useState<Devis[]>([]);
  const [currentDevis, setCurrentDevis] = useState<Devis | null>(null);
  
  // ✅ Gestion des filtres et pagination
  const { filters, pagination, updateFilters, updatePagination } = useFiltersAndPagination<UseDevisFilters>(
    { page: 1, limit: 10 },
    { page: 1, limit: 10, total: 0, totalPages: 0, hasNextPage: false, hasPrevPage: false }
  );

  // ✅ Système CRUD optimiste avec rollback automatique
  const optimisticCRUD = useOptimisticCRUD(devis, setDevis, '/api/devis');

  // ✅ Système de synchronisation intelligente avec cache
  const syncCache = useSyncEntityList<Devis>('devis', '/api/devis', setDevis, {
    autoSync: true,
    syncInterval: 60000, // 1 minute
    onSync: (entities) => {
      console.log(`🔄 ${entities.length} devis synchronisés`);
    },
    onError: (error) => {
      errorHandler.handleError(error, 'Devis Sync');
    }
  });

  // ✅ Système d'événements personnalisés pour communication inter-composants
  const customEvents = useCustomEvents<Devis>('devisUpdated');

  // ✅ Fonction de récupération avec gestion d'erreur robuste
  const fetchDevis = useCallback(async (customFilters: UseDevisFilters = {}) => {
    if (!session) return;

    try {
      const params = new URLSearchParams();
      
      const activeFilters = { ...filters, ...customFilters };
      
      if (activeFilters.page) params.append('page', activeFilters.page.toString());
      if (activeFilters.limit) params.append('limit', activeFilters.limit.toString());
      if (activeFilters.search) params.append('search', activeFilters.search);
      if (activeFilters.status && activeFilters.status !== 'TOUS') params.append('status', activeFilters.status);
      if (activeFilters.type) params.append('type', activeFilters.type);
      if (activeFilters.clientId) params.append('clientId', activeFilters.clientId);
      if (activeFilters.chantierId) params.append('chantierId', activeFilters.chantierId);

      const response = await fetch(`/api/devis?${params.toString()}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la récupération des devis');
      }

      const data = await response.json();
      setDevis(data.devis || []);
      updatePagination(data.pagination || {});

    } catch (err) {
      errorHandler.handleError(err, 'Fetch Devis');
    }
  }, [session, filters, updatePagination, errorHandler]);

  // ✅ Fonction de récupération par ID avec fallback
  const fetchDevisById = useCallback(async (id: string) => {
    if (!session) return null;

    try {
      const response = await fetch(`/api/devis/${id}`);
      
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          console.warn('Accès refusé API devis, utilisation des données de simulation');
          const mockDevis: Devis = {
            id,
            numero: `DEV-${Date.now()}`,
            clientId: 'client-1',
            client: { id: 'client-1', name: 'Sophie Durand', email: 'sophie.durand@email.com' },
            statut: 'BROUILLON',
            type: 'DEVIS',
            dateCreation: new Date().toISOString(),
            dateEcheance: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            ligneDevis: [],
            montant: 0,
            totalHT: 0,
            totalTVA: 0,
            totalTTC: 0,
            tva: 20,
            autoliquidation: false,
            objet: ''
          };
          setCurrentDevis(mockDevis);
          return mockDevis;
        }
        
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la récupération du devis');
      }

      const devis: Devis = await response.json();
      setCurrentDevis(devis);
      return devis;

    } catch (err) {
      errorHandler.handleError(err, 'Fetch Devis By ID');
      return null;
    }
  }, [session, errorHandler]);

  // ✅ Fonctions CRUD avec gestion optimiste
  const createDevis = useCallback(async (data: DevisFormData) => {
    if (!session) throw new Error('Session non trouvée');
    
    const result = await optimisticCRUD.createEntity(data as any);
    
    if (result.success) {
      // ✅ Mise à jour de la pagination
      updatePagination({
        total: pagination.total + 1,
        totalPages: Math.ceil((pagination.total + 1) / pagination.limit)
      });
      
      // ✅ Notification aux autres composants
      customEvents.dispatchEvent(result.data);
      
      return result.data;
    } else {
      throw new Error(result.error);
    }
  }, [session, optimisticCRUD, pagination, updatePagination, customEvents]);

  const updateDevis = useCallback(async (id: string, data: Partial<DevisFormData> & { statut?: DevisStatus; dateSignature?: Date }) => {
    if (!session) throw new Error('Session non trouvée');
    
    const result = await optimisticCRUD.updateEntity(id, data as any);
    
    if (result.success) {
      // ✅ Mise à jour du devis courant si nécessaire
      if (currentDevis?.id === id) {
        setCurrentDevis(result.data);
      }
      
      // ✅ Notification aux autres composants
      customEvents.dispatchEvent(result.data);
      
      return result.data;
    } else {
      throw new Error(result.error);
    }
  }, [session, optimisticCRUD, currentDevis, customEvents]);

  const deleteDevis = useCallback(async (id: string) => {
    if (!session) throw new Error('Session non trouvée');
    
    const result = await optimisticCRUD.deleteEntity(id);
    
    if (result.success) {
      // ✅ Mise à jour de la pagination
      updatePagination({
        total: Math.max(0, pagination.total - 1),
        totalPages: Math.ceil(Math.max(0, pagination.total - 1) / pagination.limit)
      });
      
      // ✅ Nettoyage du devis courant si nécessaire
      if (currentDevis?.id === id) {
        setCurrentDevis(null);
      }
      
      return true;
    } else {
      throw new Error(result.error);
    }
  }, [session, optimisticCRUD, pagination, updatePagination, currentDevis]);

  // ✅ Fonctions spécialisées
  const convertToFacture = useCallback(async (devisId: string) => {
    if (!session) throw new Error('Session non trouvée');

    try {
      const response = await fetch(`/api/devis/${devisId}/convert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ options: {} })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la conversion');
      }

      const result = await response.json();
      
      // ✅ Mise à jour optimiste du statut
      if (currentDevis && currentDevis.id === devisId) {
        setCurrentDevis(prev => prev ? { ...prev, statut: 'PAYE' } : null);
      }

      return result.facture;

    } catch (err) {
      errorHandler.handleError(err, 'Convert Devis');
      throw err;
    }
  }, [session, currentDevis, errorHandler]);

  const signDevis = useCallback(async (id: string, signature?: string) => {
    return updateDevis(id, { 
      statut: 'ACCEPTE', 
      dateSignature: new Date() 
    });
  }, [updateDevis]);

  // ✅ Fonction utilitaire pour les calculs
  const calculateTotals = useCallback((lignes: LigneDevis[], tva: number = 20, autoliquidation: boolean = false, retenueGarantie: number = 0) => {
    const totalHT = lignes.reduce((sum, ligne) => sum + (ligne.total ?? 0), 0);
    const totalTVA = autoliquidation ? 0 : (totalHT * (tva ?? 20)) / 100;
    const totalTTC = totalHT + totalTVA;
    const montantRetenue = (totalTTC * (retenueGarantie ?? 0)) / 100;
    const montantFinal = totalTTC - montantRetenue;

    return {
      totalHT,
      totalTVA,
      totalTTC,
      montantRetenue,
      montantFinal,
    };
  }, []);

  // ✅ Écoute des événements personnalisés
  useEffect(() => {
    const unsubscribe = customEvents.addEventListener((updatedDevis) => {
      // Mise à jour automatique si le devis modifié est dans la liste
      setDevis(prev => prev.map(d => d.id === updatedDevis.id ? updatedDevis : d));
    });

    return unsubscribe;
  }, [customEvents]);

  // ✅ Chargement initial
  useEffect(() => {
    if (session) {
      fetchDevis();
    }
  }, [session, fetchDevis]);

  return {
    // ✅ États
    devis,
    currentDevis,
    loading: syncCache.isSyncing,
    error: errorHandler.error,
    
    // ✅ Pagination et filtres
    pagination,
    filters,
    
    // ✅ Actions CRUD
    createDevis,
    updateDevis,
    deleteDevis,
    fetchDevis,
    fetchDevisById,
    
    // ✅ Actions spécialisées
    convertToFacture,
    signDevis,
    calculateTotals,
    
    // ✅ Gestion des filtres
    updateFilters,
    updatePagination,
    
    // ✅ Utilitaires
    clearError: errorHandler.clearError,
    setCurrentDevis,
    
    // ✅ Informations de synchronisation
    lastSync: syncCache.lastSync,
    isSyncing: syncCache.isSyncing,
    
    // ✅ Informations des opérations en attente
    pendingOperations: optimisticCRUD.pendingOperations,
    hasPendingOperations: optimisticCRUD.hasPendingOperations,
  };
}
