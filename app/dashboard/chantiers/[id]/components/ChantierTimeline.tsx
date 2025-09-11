'use client';

import { useState, useEffect } from 'react';
import { Calendar, Clock, Plus, User, MapPin, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import { useToasts } from '@/hooks/useToasts';

interface TimelineEvent {
  id: string;
  titre: string;
  description: string;
  date: string;
  type: 'DEBUT' | 'FIN' | 'ETAPE' | 'ATTENTE' | 'PROBLEME' | 'NOTE';
  createdBy: {
    id: string;
    name: string;
  };
}

interface ChantierTimelineProps {
  chantierId: string;
  initialTimeline?: TimelineEvent[];
}

export default function ChantierTimeline({ chantierId, initialTimeline = [] }: ChantierTimelineProps) {
  const [timeline, setTimeline] = useState<TimelineEvent[]>(initialTimeline);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEvent, setNewEvent] = useState({
    titre: '',
    description: '',
    type: 'ETAPE' as const
  });
  const { success, error } = useToasts();

  const fetchTimeline = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/chantiers/${chantierId}/timeline`);
      
      if (response.ok) {
        const data = await response.json();
        setTimeline(data.timeline || []);
      } else {
        console.error('Erreur chargement timeline:', response.status);
      }
    } catch (err) {
      console.error('Erreur timeline:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Si pas de données initiales, charger depuis l'API
    if (initialTimeline.length === 0) {
      fetchTimeline();
    }
  }, [chantierId]);

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'DEBUT':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'FIN':
        return <CheckCircle className="w-5 h-5 text-blue-600" />;
      case 'ETAPE':
        return <Clock className="w-5 h-5 text-blue-600" />;
      case 'ATTENTE':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'PROBLEME':
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
      default:
        return <Info className="w-5 h-5 text-gray-600" />;
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'DEBUT':
        return 'bg-green-50 border-green-200';
      case 'FIN':
        return 'bg-blue-50 border-blue-200';
      case 'ETAPE':
        return 'bg-blue-50 border-blue-200';
      case 'ATTENTE':
        return 'bg-yellow-50 border-yellow-200';
      case 'PROBLEME':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      return 'Hier à ' + date.toLocaleTimeString('fr-FR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else if (diffDays === 0) {
      return 'Aujourd\'hui à ' + date.toLocaleTimeString('fr-FR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else if (diffDays < 7) {
      return `Il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
    } else {
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const handleAddEvent = async () => {
    if (!newEvent.titre.trim()) {
      error('Erreur', 'Le titre est requis');
      return;
    }

    try {
      const response = await fetch('/api/timeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chantierId,
          titre: newEvent.titre,
          description: newEvent.description,
          type: newEvent.type,
          date: new Date().toISOString()
        })
      });

      if (response.ok) {
        const createdEvent = await response.json();
        setTimeline(prev => [createdEvent, ...prev]);
        setNewEvent({ titre: '', description: '', type: 'ETAPE' });
        setShowAddForm(false);
        success('Succès', 'Événement ajouté à la timeline');
      } else {
        const errorData = await response.json();
        error('Erreur', errorData.error || 'Erreur lors de l\'ajout');
      }
    } catch (err) {
      console.error('Erreur ajout événement:', err);
      error('Erreur', 'Erreur lors de l\'ajout de l\'événement');
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/4"></div>
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex gap-4">
              <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            </div>
          ))}
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
            <h3 className="text-lg font-semibold text-gray-900">Timeline du projet</h3>
            <p className="text-sm text-gray-500">
              {timeline.length} événement{timeline.length > 1 ? 's' : ''}
            </p>
          </div>
        </div>
        
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={16} />
          Ajouter événement
        </button>
      </div>

      {/* Formulaire d'ajout */}
      {showAddForm && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Titre *
              </label>
              <input
                type="text"
                value={newEvent.titre}
                onChange={(e) => setNewEvent(prev => ({ ...prev, titre: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ex: Livraison des matériaux"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={newEvent.description}
                onChange={(e) => setNewEvent(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Détails de l'événement..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type d'événement
              </label>
              <select
                value={newEvent.type}
                onChange={(e) => setNewEvent(prev => ({ ...prev, type: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="ETAPE">Étape</option>
                <option value="DEBUT">Début</option>
                <option value="FIN">Fin</option>
                <option value="ATTENTE">Attente</option>
                <option value="PROBLEME">Problème</option>
                <option value="NOTE">Note</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleAddEvent}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Ajouter
              </button>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setNewEvent({ titre: '', description: '', type: 'ETAPE' });
                }}
                className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {timeline.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-100">
          <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center text-gray-400 mb-4">
            <Calendar size={24} />
          </div>
          <p className="text-gray-900 font-medium mb-2">Aucun événement</p>
          <p className="text-sm text-gray-500 mb-4 max-w-xs mx-auto">
            La timeline permet de suivre les événements importants du chantier
          </p>
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={16} />
            Premier événement
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {timeline.map((event, index) => (
            <div key={event.id} className={`relative p-4 border rounded-lg ${getEventColor(event.type)}`}>
              {/* Ligne de connexion */}
              {index < timeline.length - 1 && (
                <div className="absolute left-8 top-12 bottom-0 w-0.5 bg-gray-300"></div>
              )}
              
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center">
                  {getEventIcon(event.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{event.titre}</h4>
                      {event.description && (
                        <p className="text-gray-600 text-sm mt-1">{event.description}</p>
                      )}
                    </div>
                    <div className="ml-4 text-right flex-shrink-0">
                      <p className="text-xs text-gray-500">{formatDate(event.date)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                    <User size={12} />
                    <span>{event.createdBy.name}</span>
                    <span>•</span>
                    <span className="capitalize">{event.type.toLowerCase()}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}