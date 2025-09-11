'use client';

import { useState } from 'react';
import { Search, Filter, Calendar, MapPin, Users } from 'lucide-react';

interface PlanningFiltersProps {
  onFiltersChange: (filters: {
    search: string;
    type: string;
    chantierId: string;
    dateDebut: string;
    dateFin: string;
  }) => void;
  chantiers?: Array<{ id: string; nom: string }>;
}

export default function PlanningFilters({ onFiltersChange, chantiers = [] }: PlanningFiltersProps) {
  const [filters, setFilters] = useState({
    search: '',
    type: '',
    chantierId: '',
    dateDebut: '',
    dateFin: ''
  });

  const [showAdvanced, setShowAdvanced] = useState(false);

  const updateFilters = (newFilters: Partial<typeof filters>) => {
    const updated = { ...filters, ...newFilters };
    setFilters(updated);
    onFiltersChange(updated);
  };

  const resetFilters = () => {
    const resetValues = {
      search: '',
      type: '',
      chantierId: '',
      dateDebut: '',
      dateFin: ''
    };
    setFilters(resetValues);
    onFiltersChange(resetValues);
  };

  const typeOptions = [
    { value: '', label: 'Tous les types' },
    { value: 'REUNION', label: '📋 Réunion' },
    { value: 'LIVRAISON', label: '🚚 Livraison' },
    { value: 'INSPECTION', label: '🔍 Inspection' },
    { value: 'AUTRE', label: '📌 Autre' }
  ];

  const getQuickDateRange = (range: string) => {
    const today = new Date();
    const start = new Date(today);
    const end = new Date(today);

    switch (range) {
      case 'today':
        break;
      case 'tomorrow':
        start.setDate(today.getDate() + 1);
        end.setDate(today.getDate() + 1);
        break;
      case 'thisWeek':
        start.setDate(today.getDate() - today.getDay());
        end.setDate(start.getDate() + 6);
        break;
      case 'nextWeek':
        start.setDate(today.getDate() - today.getDay() + 7);
        end.setDate(start.getDate() + 6);
        break;
      case 'thisMonth':
        start.setDate(1);
        end.setMonth(end.getMonth() + 1);
        end.setDate(0);
        break;
      default:
        return;
    }

    updateFilters({
      dateDebut: start.toISOString().split('T')[0],
      dateFin: end.toISOString().split('T')[0]
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium flex items-center">
          <Filter className="w-5 h-5 mr-2" />
          Filtres Planning
        </h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            {showAdvanced ? 'Filtres simples' : 'Filtres avancés'}
          </button>
          <button
            onClick={resetFilters}
            className="text-sm text-gray-600 hover:text-gray-800"
          >
            Réinitialiser
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un événement..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={filters.search}
            onChange={(e) => updateFilters({ search: e.target.value })}
          />
        </div>

        <select
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          value={filters.type}
          onChange={(e) => updateFilters({ type: e.target.value })}
        >
          {typeOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {chantiers.length > 0 && (
          <div className="relative">
            <MapPin className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <select
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={filters.chantierId}
              onChange={(e) => updateFilters({ chantierId: e.target.value })}
            >
              <option value="">Tous les chantiers</option>
              {chantiers.map(chantier => (
                <option key={chantier.id} value={chantier.id}>
                  {chantier.nom}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex space-x-2">
          <div className="relative flex-1">
            <Calendar className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <input
              type="date"
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={filters.dateDebut}
              onChange={(e) => updateFilters({ dateDebut: e.target.value })}
            />
          </div>
          <div className="flex-1">
            <input
              type="date"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={filters.dateFin}
              onChange={(e) => updateFilters({ dateFin: e.target.value })}
            />
          </div>
        </div>
      </div>

      {showAdvanced && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Périodes rapides
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'today', label: "Aujourd'hui" },
                { key: 'tomorrow', label: 'Demain' },
                { key: 'thisWeek', label: 'Cette semaine' },
                { key: 'nextWeek', label: 'Semaine prochaine' },
                { key: 'thisMonth', label: 'Ce mois' }
              ].map(period => (
                <button
                  key={period.key}
                  onClick={() => getQuickDateRange(period.key)}
                  className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                >
                  {period.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Statut
              </label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="">Tous les statuts</option>
                <option value="PLANIFIE">📅 Planifié</option>
                <option value="EN_COURS">⏳ En cours</option>
                <option value="TERMINE">✅ Terminé</option>
                <option value="ANNULE">❌ Annulé</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Organisateur
              </label>
              <div className="relative">
                <Users className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Nom de l'organisateur"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lieu
              </label>
              <input
                type="text"
                placeholder="Lieu de l'événement"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
