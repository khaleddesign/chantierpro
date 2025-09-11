'use client';

import { useState, useEffect } from 'react';

export default function DevisStats() {
  const [stats, setStats] = useState({
    totalDevis: 0,
    totalFactures: 0,
    montantTotal: 0,
    enAttente: 0,
    loading: true,
    error: null as string | null
  });
  
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/devis/stats');
        if (!response.ok) {
          throw new Error('Erreur lors du chargement des statistiques');
        }
        
        const data = await response.json();
        setStats({
          totalDevis: data.totalDevis || 0,
          totalFactures: data.totalFactures || 0,
          montantTotal: data.montantTotal || 0,
          enAttente: data.enAttente || 0,
          loading: false,
          error: null
        });
      } catch (error) {
        console.error('Erreur chargement stats:', error);
        setStats(prev => ({
          ...prev,
          loading: false,
          error: 'Erreur lors du chargement des statistiques'
        }));
      }
    };
    
    fetchStats();
  }, []);
  
  // Format numérique français
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0
    }).format(num);
  };
  
  // Simuler des données pour la démo si loading
  const demoStats = {
    totalDevis: 4,
    totalFactures: 3,
    montantTotal: 45600,
    enAttente: 2
  };
  
  const displayStats = stats.loading ? demoStats : stats;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <dl>
            <dt className="text-sm font-medium text-gray-500 truncate">
              Total Devis
            </dt>
            <dd className="mt-1 text-3xl font-semibold text-indigo-600">
              {stats.loading ? (
                <div className="animate-pulse h-8 w-16 bg-gray-200 rounded"></div>
              ) : (
                displayStats.totalDevis
              )}
            </dd>
          </dl>
        </div>
      </div>
      
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <dl>
            <dt className="text-sm font-medium text-gray-500 truncate">
              Total Factures
            </dt>
            <dd className="mt-1 text-3xl font-semibold text-emerald-600">
              {stats.loading ? (
                <div className="animate-pulse h-8 w-16 bg-gray-200 rounded"></div>
              ) : (
                displayStats.totalFactures
              )}
            </dd>
          </dl>
        </div>
      </div>
      
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <dl>
            <dt className="text-sm font-medium text-gray-500 truncate">
              Montant Total
            </dt>
            <dd className="mt-1 text-3xl font-semibold text-blue-600">
              {stats.loading ? (
                <div className="animate-pulse h-8 w-28 bg-gray-200 rounded"></div>
              ) : (
                formatNumber(displayStats.montantTotal)
              )}
            </dd>
          </dl>
        </div>
      </div>
      
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <dl>
            <dt className="text-sm font-medium text-gray-500 truncate">
              En Attente
            </dt>
            <dd className="mt-1 text-3xl font-semibold text-amber-600">
              {stats.loading ? (
                <div className="animate-pulse h-8 w-16 bg-gray-200 rounded"></div>
              ) : (
                displayStats.enAttente
              )}
            </dd>
          </dl>
        </div>
      </div>
    </div>
  );
}
