'use client';

import { useState } from 'react';
import { useEtapes } from '@/hooks/useEtapes';
import { useAuth } from '@/hooks/useAuth';
import { EtapeChantier, ETAPE_STATUS_LABELS, ETAPE_STATUS_COLORS } from '@/types/etapes';
import { Calendar, Plus, ArrowRight, CheckCircle, Clock } from 'lucide-react';
import Link from 'next/link';

interface ChantierEtapesProps {
  chantierId: string;
}

export default function ChantierEtapes({ chantierId }: ChantierEtapesProps) {
  const { user } = useAuth();
  const { etapes, loading, error } = useEtapes({ chantierId });
  const [limit, setLimit] = useState(3);

  const canEdit = user && ['ADMIN', 'COMMERCIAL'].includes(user.role);
  const displayedEtapes = etapes.slice(0, limit);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit'
    });
  };

  const getProgressPercentage = () => {
    if (etapes.length === 0) return 0;
    const completed = etapes.filter(e => e.statut === 'TERMINE').length;
    return Math.round((completed / etapes.length) * 100);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-2">
            <div className="h-12 bg-gray-200 rounded"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <div className="text-red-600 text-center">
          <p>Erreur: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-full">
            <Calendar size={20} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Étapes du projet</h3>
            <p className="text-sm text-gray-500">
              {etapes.length} étape{etapes.length > 1 ? 's' : ''} • {getProgressPercentage()}% terminé
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {canEdit && (
            <Link
              href={`/dashboard/chantiers/${chantierId}/etapes`}
              className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              <Plus size={16} />
              <span>Gérer</span>
            </Link>
          )}
          
          {etapes.length > limit && (
            <Link
              href={`/dashboard/chantiers/${chantierId}/etapes`}
              className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm"
            >
              <span>Voir tout</span>
              <ArrowRight size={16} />
            </Link>
          )}
        </div>
      </div>

      {etapes.length > 0 && (
        <div className="mb-5">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Progression</span>
            <span className="font-medium">{getProgressPercentage()}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${getProgressPercentage()}%` }}
            ></div>
          </div>
        </div>
      )}

      {etapes.length === 0 ? (
        <div className="text-center py-10 bg-gray-50 rounded-lg border border-gray-100">
          <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center text-gray-400 mb-4">
            <Calendar size={24} />
          </div>
          <p className="text-gray-900 font-medium mb-2">Aucune étape définie</p>
          <p className="text-sm text-gray-500 mb-4 max-w-xs mx-auto">
            Organisez votre projet en étapes pour un meilleur suivi et une meilleure visibilité
          </p>
          {canEdit && (
            <Link
              href={`/dashboard/chantiers/${chantierId}/etapes`}
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              <Plus size={16} />
              Créer les étapes
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {displayedEtapes.map((etape, index) => (
            <div
              key={etape.id}
              className="flex items-center gap-4 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex-shrink-0">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                  etape.statut === 'TERMINE' ? 'bg-green-100 text-green-800' :
                  etape.statut === 'EN_COURS' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {etape.statut === 'TERMINE' ? <CheckCircle size={12} /> : (index + 1)}
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-gray-900 truncate">{etape.titre}</h4>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${ETAPE_STATUS_COLORS[etape.statut]}`}>
                    {ETAPE_STATUS_LABELS[etape.statut]}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Clock size={12} />
                    {formatDate(etape.dateDebut)} - {formatDate(etape.dateFin)}
                  </span>
                  {etape.description && (
                    <span className="truncate">{etape.description}</span>
                  )}
                </div>
              </div>
            </div>
          ))}

          {etapes.length > limit && (
            <div className="text-center pt-2">
              <Link
                href={`/dashboard/chantiers/${chantierId}/etapes`}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium inline-flex items-center gap-1"
              >
                <span>Voir {etapes.length - limit} étape{etapes.length - limit > 1 ? 's' : ''} de plus</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
