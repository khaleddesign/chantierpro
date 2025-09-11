'use client';

import { useState } from 'react';

interface DevisFiltersProps {
  activeTab: 'TOUS' | 'DEVIS' | 'FACTURE';
  onTabChange: (tab: 'TOUS' | 'DEVIS' | 'FACTURE') => void;
  statusFilter: string;
  onStatusChange: (status: string) => void;
  searchTerm: string;
  onSearchChange: (search: string) => void;
}

export default function DevisFilters({
  activeTab,
  onTabChange,
  statusFilter,
  onStatusChange,
  searchTerm,
  onSearchChange
}: DevisFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="flex flex-col sm:flex-row">
        <div className="flex overflow-x-auto">
          <button
            onClick={() => onTabChange('TOUS')}
            className={`px-4 py-3 text-sm font-medium whitespace-nowrap ${
              activeTab === 'TOUS'
                ? 'text-indigo-600 border-b-2 border-indigo-500'
                : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            TOUS
          </button>
          <button
            onClick={() => onTabChange('DEVIS')}
            className={`px-4 py-3 text-sm font-medium whitespace-nowrap ${
              activeTab === 'DEVIS'
                ? 'text-indigo-600 border-b-2 border-indigo-500'
                : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            DEVIS
          </button>
          <button
            onClick={() => onTabChange('FACTURE')}
            className={`px-4 py-3 text-sm font-medium whitespace-nowrap ${
              activeTab === 'FACTURE'
                ? 'text-indigo-600 border-b-2 border-indigo-500'
                : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            FACTURE
          </button>
        </div>
        
        <div className="flex-1 flex items-center justify-between p-3 border-t sm:border-t-0 sm:border-l border-gray-200">
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Rechercher..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
          
          <div className="ml-3 relative">
            <select
              value={statusFilter}
              onChange={(e) => onStatusChange(e.target.value)}
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            >
              <option value="TOUS">Tous les statuts</option>
              <option value="BROUILLON">Brouillon</option>
              <option value="ENVOYE">Envoyé</option>
              <option value="ACCEPTE">Accepté</option>
              <option value="REFUSE">Refusé</option>
              <option value="PAYE">Payé</option>
              <option value="ANNULE">Annulé</option>
            </select>
          </div>
          
          <div className="ml-3">
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center px-2 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <span className="sr-only">Filtres</span>
            </button>
          </div>
        </div>
      </div>
      
      {isOpen && (
        <div className="px-4 py-3 border-t border-gray-200 sm:p-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 p-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Date</label>
              <select className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                <option>Toutes dates</option>
                <option>Ce mois-ci</option>
                <option>Dernier mois</option>
                <option>Derniers 3 mois</option>
                <option>Personnalisé</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Client</label>
              <select className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                <option>Tous les clients</option>
                <option>Sophie Durand</option>
                <option>Marc Lefebvre</option>
                <option>Pierre Dubois</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Montant</label>
              <div className="mt-1 flex rounded-md shadow-sm">
                <input
                  type="number"
                  placeholder="Min"
                  className="focus:ring-indigo-500 focus:border-indigo-500 flex-1 block w-full rounded-none rounded-l-md sm:text-sm border-gray-300"
                />
                <input
                  type="number"
                  placeholder="Max"
                  className="focus:ring-indigo-500 focus:border-indigo-500 flex-1 block w-full rounded-none rounded-r-md sm:text-sm border-gray-300"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Chantier</label>
              <select className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                <option>Tous les chantiers</option>
                <option>Rénovation Villa Moderne</option>
                <option>Cuisine équipée moderne</option>
                <option>Terrasse bois composite</option>
              </select>
            </div>
          </div>
          
          <div className="px-4 py-3 bg-gray-50 text-right sm:px-6 border-t border-gray-200">
            <button
              type="button"
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Appliquer les filtres
            </button>
            <button
              type="button"
              className="ml-3 inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              onClick={() => {
                onSearchChange('');
                onStatusChange('TOUS');
                setIsOpen(false);
              }}
            >
              Réinitialiser
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
