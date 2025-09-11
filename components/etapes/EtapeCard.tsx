'use client';

import { EtapeChantier, ETAPE_STATUS_LABELS, ETAPE_STATUS_COLORS } from '@/types/etapes';
import { Calendar, User, Edit, Trash2 } from 'lucide-react';

interface EtapeCardProps {
  etape: EtapeChantier;
  canEdit: boolean;
  onEdit?: (etape: EtapeChantier) => void;
  onDelete?: (id: string) => void;
  onStatusChange?: (id: string, status: 'A_FAIRE' | 'EN_COURS' | 'TERMINE') => void;
}

export default function EtapeCard({ etape, canEdit, onEdit, onDelete, onStatusChange }: EtapeCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getDuration = () => {
    const debut = new Date(etape.dateDebut);
    const fin = new Date(etape.dateFin);
    const diffTime = Math.abs(fin.getTime() - debut.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{etape.titre}</h3>
          {etape.description && (
            <p className="text-gray-600 text-sm mb-3">{etape.description}</p>
          )}
        </div>
        
        <div className="flex items-center gap-2 ml-4">
          {canEdit && onStatusChange && (
            <select
              value={etape.statut}
              onChange={(e) => onStatusChange(etape.id, e.target.value as any)}
              className="text-xs border border-gray-300 rounded px-2 py-1"
            >
              <option value="A_FAIRE">À faire</option>
              <option value="EN_COURS">En cours</option>
              <option value="TERMINE">Terminé</option>
            </select>
          )}
          
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${ETAPE_STATUS_COLORS[etape.statut]}`}>
            {ETAPE_STATUS_LABELS[etape.statut]}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="flex items-center text-sm text-gray-600">
          <Calendar size={16} className="mr-2" />
          <span>Début: {formatDate(etape.dateDebut)}</span>
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <Calendar size={16} className="mr-2" />
          <span>Fin: {formatDate(etape.dateFin)}</span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center text-sm text-gray-500">
          <User size={16} className="mr-2" />
          <span>Créé par {etape.createdBy.name}</span>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">
            {getDuration()} jour{getDuration() > 1 ? 's' : ''}
          </span>
          
          {canEdit && (
            <div className="flex gap-1">
              {onEdit && (
                <button
                  onClick={() => onEdit(etape)}
                  className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                >
                  <Edit size={16} />
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => onDelete(etape.id)}
                  className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
