'use client';

import { AlertTriangle, Clock, Users } from 'lucide-react';

interface ConflictAlertProps {
  conflicts: Array<{
    id: string;
    titre: string;
    dateDebut: string;
    dateFin: string;
    organisateur: {
      name: string;
    };
    participants?: Array<{
      name: string;
    }>;
    chantier?: {
      nom: string;
    };
  }>;
}

export default function ConflictAlert({ conflicts }: ConflictAlertProps) {
  if (conflicts.length === 0) return null;

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="glass p-6 border-l-4 border-orange-500">
      <div className="flex items-start gap-3 mb-4">
        <AlertTriangle className="w-6 h-6 text-orange-400 flex-shrink-0 mt-1" />
        <div>
          <h3 className="text-white font-semibold text-lg">
            Conflits détectés ({conflicts.length})
          </h3>
          <p className="text-orange-200 text-sm">
            Les personnes suivantes ont déjà des événements prévus pendant ce créneau
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {conflicts.map((conflict) => (
          <div
            key={conflict.id}
            className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4"
          >
            <div className="flex items-start justify-between mb-2">
              <h4 className="text-white font-medium">{conflict.titre}</h4>
              <div className="flex items-center gap-1 text-orange-200 text-sm">
                <Clock className="w-4 h-4" />
                <span>
                  {formatDateTime(conflict.dateDebut)} - {formatDateTime(conflict.dateFin)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4 text-sm">
              <div className="text-orange-200">
                Organisateur: {conflict.organisateur.name}
              </div>
              
              {conflict.participants && conflict.participants.length > 0 && (
                <div className="flex items-center gap-1 text-orange-200">
                  <Users className="w-4 h-4" />
                  <span>{conflict.participants.length} participant(s)</span>
                </div>
              )}
              
              {conflict.chantier && (
                <div className="text-orange-200">
                  Chantier: {conflict.chantier.nom}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 p-3 bg-orange-500/10 rounded-lg">
        <p className="text-orange-200 text-sm">
          💡 <strong>Conseil:</strong> Vérifiez avec les participants si ces conflits sont acceptables ou modifiez les horaires de votre événement.
        </p>
      </div>
    </div>
  );
}
