'use client';

import { useState } from 'react';
import { EtapeFormData, EtapeChantier } from '@/types/etapes';
import { X, Save } from 'lucide-react';

interface EtapeFormProps {
  etape?: EtapeChantier;
  onSubmit: (data: EtapeFormData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export default function EtapeForm({ etape, onSubmit, onCancel, loading }: EtapeFormProps) {
  const [formData, setFormData] = useState<EtapeFormData>({
    titre: etape?.titre || '',
    description: etape?.description || '',
    dateDebut: etape?.dateDebut ? etape.dateDebut.split('T')[0] : '',
    dateFin: etape?.dateFin ? etape.dateFin.split('T')[0] : '',
    statut: etape?.statut || 'A_FAIRE',
    ordre: etape?.ordre || 0
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.titre.trim()) {
      newErrors.titre = 'Le titre est requis';
    }

    if (!formData.dateDebut) {
      newErrors.dateDebut = 'La date de début est requise';
    }

    if (!formData.dateFin) {
      newErrors.dateFin = 'La date de fin est requise';
    }

    if (formData.dateDebut && formData.dateFin && formData.dateFin <= formData.dateDebut) {
      newErrors.dateFin = 'La date de fin doit être après la date de début';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Erreur soumission:', error);
    }
  };

  const handleChange = (field: keyof EtapeFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">
            {etape ? 'Modifier l\'étape' : 'Nouvelle étape'}
          </h2>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Titre *
            </label>
            <input
              type="text"
              value={formData.titre}
              onChange={(e) => handleChange('titre', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.titre ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Titre de l'étape"
            />
            {errors.titre && <p className="text-red-500 text-xs mt-1">{errors.titre}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              placeholder="Description de l'étape"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date début *
              </label>
              <input
                type="date"
                value={formData.dateDebut}
                onChange={(e) => handleChange('dateDebut', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.dateDebut ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.dateDebut && <p className="text-red-500 text-xs mt-1">{errors.dateDebut}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date fin *
              </label>
              <input
                type="date"
                value={formData.dateFin}
                onChange={(e) => handleChange('dateFin', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.dateFin ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.dateFin && <p className="text-red-500 text-xs mt-1">{errors.dateFin}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Statut
              </label>
              <select
                value={formData.statut}
                onChange={(e) => handleChange('statut', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="A_FAIRE">À faire</option>
                <option value="EN_COURS">En cours</option>
                <option value="TERMINE">Terminé</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ordre
              </label>
              <input
                type="number"
                value={formData.ordre}
                onChange={(e) => handleChange('ordre', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="0"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Save size={18} />
              {loading ? 'Enregistrement...' : 'Enregistrer'}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
