'use client';

import { Calendar, Clock, Users, MapPin, Building } from 'lucide-react';

interface EventCardProps {
  planning: {
    id: string;
    titre: string;
    description?: string;
    type: string;
    dateDebut: string;
    dateFin: string;
    statut: string;
    lieu?: string;
    organisateur: {
      name: string;
      role: string;
    };
    participants?: Array<{
      name: string;
      role: string;
    }>;
    chantier?: {
      nom: string;
    };
  };
  onClick: () => void;
}

export default function EventCard({ planning, onClick }: EventCardProps) {
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'RDV_CLIENT': return 'border-l-blue-500 bg-blue-500/10';
      case 'PLANNING_CHANTIER': return 'border-l-green-500 bg-green-500/10';
      case 'LIVRAISON': return 'border-l-orange-500 bg-orange-500/10';
      case 'INSPECTION': return 'border-l-purple-500 bg-purple-500/10';
      case 'CONGES': return 'border-l-red-500 bg-red-500/10';
      default: return 'border-l-gray-500 bg-gray-500/10';
    }
  };

  const getStatusColor = (statut: string) => {
    switch (statut) {
      case 'PLANIFIE': return 'text-blue-300';
      case 'EN_COURS': return 'text-orange-300';
      case 'TERMINE': return 'text-green-300';
      case 'ANNULE': return 'text-red-300';
      case 'REPORTE': return 'text-yellow-300';
      default: return 'text-gray-300';
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Aujourd'hui";
    if (diffDays === 1) return "Demain";
    if (diffDays === -1) return "Hier";
    if (diffDays > 1 && diffDays <= 7) return `Dans ${diffDays} jours`;
    if (diffDays < -1 && diffDays >= -7) return `Il y a ${Math.abs(diffDays)} jours`;

    return date.toLocaleDateString('fr-FR', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDuration = () => {
    const start = new Date(planning.dateDebut);
    const end = new Date(planning.dateFin);
    const diffMs = end.getTime() - start.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    
    if (diffHours < 1) {
      const diffMinutes = Math.round(diffMs / (1000 * 60));
      return `${diffMinutes}min`;
    }
    
    if (diffHours >= 24) {
      const diffDays = Math.round(diffHours / 24);
      return `${diffDays} jour${diffDays > 1 ? 's' : ''}`;
    }
    
    return `${Math.round(diffHours)}h`;
  };

  return (
    <div
      onClick={onClick}
      className={`border-l-4 p-4 rounded-lg cursor-pointer hover:bg-white/15 transition-colors ${getTypeColor(planning.type)}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-semibold truncate mb-1">
            {planning.titre}
          </h3>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-blue-200">
              {planning.type.replace('_', ' ')}
            </span>
            <span className={`${getStatusColor(planning.statut)}`}>
              {planning.statut}
            </span>
          </div>
        </div>
        
        <div className="flex-shrink-0 text-right">
          <div className="text-white text-sm font-medium">
            {formatDate(planning.dateDebut)}
          </div>
          <div className="text-blue-200 text-xs">
            {getDuration()}
          </div>
        </div>
      </div>

      {planning.description && (
        <p className="text-blue-100 text-sm mb-3 line-clamp-2">
          {planning.description}
        </p>
      )}

      <div className="flex items-center gap-4 text-sm text-blue-200 mb-3">
        <div className="flex items-center gap-1">
          <Clock className="w-4 h-4" />
          <span>{formatTime(planning.dateDebut)} - {formatTime(planning.dateFin)}</span>
        </div>
        
        {planning.lieu && (
          <div className="flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            <span className="truncate">{planning.lieu}</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {planning.chantier && (
            <div className="flex items-center gap-1 text-sm text-orange-200">
              <Building className="w-4 h-4" />
              <span className="truncate">{planning.chantier.nom}</span>
            </div>
          )}
        </div>

        {planning.participants && planning.participants.length > 0 && (
          <div className="flex items-center gap-1 text-sm text-blue-200">
            <Users className="w-4 h-4" />
            <span>{planning.participants.length + 1} participant{planning.participants.length > 0 ? 's' : ''}</span>
          </div>
        )}
      </div>
    </div>
  );
}
