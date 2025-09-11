'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePlanning } from '@/hooks/usePlanning';

interface EventFormProps {
  initialData?: any;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function EventForm({ initialData, onSubmit, onCancel, isLoading }: EventFormProps) {
  const [formData, setFormData] = useState({
    titre: '',
    description: '',
    type: 'REUNION',
    dateDebut: '',
    dateFin: '',
    lieu: '',
    chantierId: '',
    participantIds: [],
    notes: '',
    ...initialData
  });

  const [conflicts, setConflicts] = useState([]);
  const [checkingConflicts, setCheckingConflicts] = useState(false);
  const { actions } = usePlanning();

  const checkConflicts = useCallback(async () => {
    if (!formData.dateDebut || !formData.dateFin) return;
    
    try {
      setCheckingConflicts(true);
      const conflictData = await actions.checkConflicts({
        dateDebut: formData.dateDebut,
        dateFin: formData.dateFin,
        participantIds: formData.participantIds
      });
      setConflicts(conflictData);
    } catch (error) {
      console.error('Erreur vérification conflits:', error);
    } finally {
      setCheckingConflicts(false);
    }
  }, [formData.dateDebut, formData.dateFin, formData.participantIds, actions]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      checkConflicts();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [checkConflicts]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const typeOptions = [
    { value: 'REUNION', label: '📋 Réunion' },
    { value: 'LIVRAISON', label: '🚚 Livraison' },
    { value: 'INSPECTION', label: '🔍 Inspection' },
    { value: 'AUTRE', label: '📌 Autre' }
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Titre de l'événement *
          </label>
          <input
            type="text"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={formData.titre}
            onChange={(e) => handleChange('titre', e.target.value)}
            placeholder="Ex: Réunion équipe chantier"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Type d'événement *
          </label>
          <select
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={formData.type}
            onChange={(e) => handleChange('type', e.target.value)}
          >
            {typeOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date et heure de début *
          </label>
          <input
            type="datetime-local"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={formData.dateDebut}
            onChange={(e) => handleChange('dateDebut', e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date et heure de fin *
          </label>
          <input
            type="datetime-local"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={formData.dateFin}
            onChange={(e) => handleChange('dateFin', e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Lieu
          </label>
          <input
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={formData.lieu}
            onChange={(e) => handleChange('lieu', e.target.value)}
            placeholder="Ex: Bureau, Chantier, Visioconférence"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Chantier (optionnel)
          </label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={formData.chantierId}
            onChange={(e) => handleChange('chantierId', e.target.value)}
          >
            <option value="">Aucun chantier</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description
        </label>
        <textarea
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          placeholder="Détails de l'événement..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Notes additionnelles
        </label>
        <textarea
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          value={formData.notes}
          onChange={(e) => handleChange('notes', e.target.value)}
          placeholder="Notes internes..."
        />
      </div>

      {conflicts.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-yellow-800 mb-2">
            ⚠️ Conflits détectés
          </h4>
          <ul className="text-sm text-yellow-700 space-y-1">
            {conflicts.map((conflict: any, index) => (
              <li key={index}>
                • Conflit avec "{conflict.titre}" le {new Date(conflict.dateDebut).toLocaleString('fr-FR')}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={isLoading || checkingConflicts}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
        >
          {isLoading || checkingConflicts ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Enregistrement...</span>
            </>
          ) : (
            <span>Enregistrer</span>
          )}
        </button>
      </div>
    </form>
  );
}
