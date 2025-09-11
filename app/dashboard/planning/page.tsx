"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Calendar, Clock, MapPin, Users, CheckCircle2, AlertCircle, Plus, Filter } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface PlanningEvent {
  id: string;
  titre: string;
  type: 'RDV_CLIENT' | 'PLANNING_CHANTIER' | 'LIVRAISON' | 'INSPECTION' | 'REUNION' | 'AUTRE';
  dateDebut: string;
  dateFin: string;
  lieu?: string;
  description?: string;
  statut: 'PLANIFIE' | 'EN_COURS' | 'TERMINE' | 'ANNULE';
  organisateur?: {
    id: string;
    name: string;
    role: string;
  };
  participants?: {
    id: string;
    name: string;
    role: string;
  }[];
  chantier?: {
    id: string;
    nom: string;
  };
  notes?: string;
}

const eventTypeColors = {
  RDV_CLIENT: { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-200' },
  PLANNING_CHANTIER: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200' },
  LIVRAISON: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200' },
  INSPECTION: { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-200' },
  REUNION: { bg: 'bg-indigo-100', text: 'text-indigo-800', border: 'border-indigo-200' },
  AUTRE: { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-200' },
};

const eventTypeLabels = {
  RDV_CLIENT: 'RDV Client',
  PLANNING_CHANTIER: 'Planning Chantier',
  LIVRAISON: 'Livraison',
  INSPECTION: 'Inspection',
  REUNION: 'Réunion',
  AUTRE: 'Autre',
};

const statusColors = {
  PLANIFIE: { bg: 'bg-gray-100', text: 'text-gray-800', icon: '📅' },
  EN_COURS: { bg: 'bg-blue-100', text: 'text-blue-800', icon: '⏳' },
  TERMINE: { bg: 'bg-green-100', text: 'text-green-800', icon: '✅' },
  ANNULE: { bg: 'bg-red-100', text: 'text-red-800', icon: '❌' },
};

const statusLabels = {
  PLANIFIE: 'Planifié',
  EN_COURS: 'En cours',
  TERMINE: 'Terminé',
  ANNULE: 'Annulé',
};

export default function PlanningPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState<PlanningEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [typeFilter, setTypeFilter] = useState<string>('tous');
  const [statusFilter, setStatusFilter] = useState<string>('tous');

  // Données de démonstration - utilisées comme fallback
  const mockEvents: PlanningEvent[] = [
    {
      id: '1',
      titre: 'Début des travaux - Villa Moderne',
      type: 'PLANNING_CHANTIER',
      dateDebut: new Date().toISOString(),
      dateFin: new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString(), // +9h
      lieu: '123 Rue des Jardins, Lyon',
      description: 'Début des travaux de construction de la villa moderne',
      statut: 'PLANIFIE',
      organisateur: { id: '1', name: 'Jean Dupont', role: 'OUVRIER' },
      participants: [{ id: '2', name: 'Marie Martin', role: 'OUVRIER' }],
      chantier: { id: '1', nom: 'Villa Moderne' }
    },
    {
      id: '2',
      titre: 'RDV Client - Rénovation Appartement',
      type: 'RDV_CLIENT',
      dateDebut: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(), // +6h
      dateFin: new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString(), // +7h
      lieu: '456 Avenue de la République, Lyon',
      description: 'Point sur l\'avancement des travaux',
      statut: 'PLANIFIE',
      organisateur: { id: '3', name: 'Pierre Commercial', role: 'COMMERCIAL' },
      participants: [{ id: '4', name: 'Sophie Durand', role: 'CLIENT' }]
    },
    {
      id: '3',
      titre: 'Livraison Matériaux',
      type: 'LIVRAISON',
      dateDebut: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // +1j
      dateFin: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(), // +1j+1h
      lieu: '789 Rue de la Paix, Villeurbanne',
      description: 'Livraison carrelage et faïence',
      statut: 'PLANIFIE',
      organisateur: { id: '5', name: 'Marc Logistique', role: 'COMMERCIAL' }
    },
    {
      id: '4',
      titre: 'Inspection Finale - Maison Traditionnelle',
      type: 'INSPECTION',
      dateDebut: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // +2j
      dateFin: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000).toISOString(), // +2j+3h
      lieu: '321 Boulevard des Alpes, Lyon',
      description: 'Inspection finale avant remise des clés',
      statut: 'PLANIFIE',
      organisateur: { id: '6', name: 'Julie Inspectrice', role: 'ADMIN' },
      chantier: { id: '2', nom: 'Maison Traditionnelle' }
    }
  ];

  const fetchPlannings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/planning');
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.plannings) {
          setEvents(data.plannings);
        } else {
          // Utiliser les données mockées si l'API ne retourne pas de données
          setEvents(mockEvents);
        }
      } else {
        console.error('Erreur API planning:', response.status);
        setEvents(mockEvents);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des plannings:', error);
      setEvents(mockEvents);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlannings();
  }, []);

  const filteredEvents = events.filter(event => {
    const matchesType = typeFilter === 'tous' || event.type === typeFilter;
    const matchesStatus = statusFilter === 'tous' || event.statut === statusFilter;
    const eventDate = new Date(event.dateDebut).toISOString().split('T')[0];
    const matchesDate = !selectedDate || eventDate === selectedDate;
    return matchesType && matchesStatus && matchesDate;
  });

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const getEventsForDate = (date: string) => {
    return events.filter(event => {
      const eventDate = new Date(event.dateDebut).toISOString().split('T')[0];
      return eventDate === date;
    });
  };

  const today = new Date().toISOString().split('T')[0];
  const nextWeekDates = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i);
    return date.toISOString().split('T')[0];
  });

  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-white rounded-lg p-6 border">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
              <div className="space-y-4">
                <div className="bg-white rounded-lg p-4 border h-32"></div>
                <div className="bg-white rounded-lg p-4 border h-48"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* En-tête */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Planning</h1>
            <p className="text-gray-500">
              Gérez vos rendez-vous, chantiers et interventions
            </p>
          </div>
          <Link href="/dashboard/planning/nouveau">
            <Button className="flex items-center gap-2">
              <Plus size={18} />
              Nouvel événement
            </Button>
          </Link>
        </div>

        {/* Filtres */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar size={18} className="text-gray-400" />
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-auto"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Filter size={18} className="text-gray-400" />
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="tous">Tous les types</option>
                <option value="RDV_CLIENT">RDV Client</option>
                <option value="PLANNING_CHANTIER">Planning Chantier</option>
                <option value="LIVRAISON">Livraisons</option>
                <option value="INSPECTION">Inspections</option>
                <option value="REUNION">Réunions</option>
                <option value="AUTRE">Autre</option>
              </select>
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="tous">Tous les statuts</option>
              <option value="PLANIFIE">Planifiés</option>
              <option value="EN_COURS">En cours</option>
              <option value="TERMINE">Terminés</option>
              <option value="ANNULE">Annulés</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Liste des événements */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">
              {selectedDate ? `Événements du ${formatDate(selectedDate)}` : 'Tous les événements'}
            </h2>
            
            {filteredEvents.length === 0 ? (
              <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                <Calendar size={48} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun événement</h3>
                <p className="text-gray-500">
                  Aucun événement prévu pour cette période
                </p>
              </div>
            ) : (
              filteredEvents.map((event) => (
                <div key={event.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`px-3 py-1 rounded-full text-xs font-medium ${eventTypeColors[event.type].bg} ${eventTypeColors[event.type].text} ${eventTypeColors[event.type].border} border`}>
                        {eventTypeLabels[event.type]}
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[event.statut].bg} ${statusColors[event.statut].text}`}>
                        <span className="mr-1">{statusColors[event.statut].icon}</span>
                        {statusLabels[event.statut]}
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      {formatTime(event.dateDebut)} - {formatTime(event.dateFin)}
                    </div>
                  </div>

                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {event.titre}
                  </h3>

                  <div className="space-y-2 mb-4">
                    {event.lieu && (
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin size={16} className="mr-2 text-gray-400" />
                        {event.lieu}
                      </div>
                    )}
                    
                    {event.organisateur && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Users size={16} className="mr-2 text-gray-400" />
                        Organisateur: {event.organisateur.name}
                      </div>
                    )}
                    
                    {event.participants && event.participants.length > 0 && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Users size={16} className="mr-2 text-gray-400" />
                        Participants: {event.participants.map(p => p.name).join(', ')}
                      </div>
                    )}
                  </div>

                  {event.description && (
                    <p className="text-sm text-gray-600 mb-4">
                      {event.description}
                    </p>
                  )}

                  {event.chantier && (
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <div className="flex items-center text-sm text-gray-600">
                        <CheckCircle2 size={16} className="mr-2 text-indigo-400" />
                        Chantier: {event.chantier.nom}
                      </div>
                      <Button size="sm" variant="outline" onClick={() => window.location.href = `/dashboard/chantiers/${event.chantier?.id}`}>
                        Voir le chantier
                      </Button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Vue calendrier mini */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-900 mb-4">Cette semaine</h3>
              <div className="space-y-2">
                {nextWeekDates.map((date) => {
                  const dayEvents = getEventsForDate(date);
                  const isToday = date === today;
                  const isSelected = date === selectedDate;
                  
                  return (
                    <div
                      key={date}
                      onClick={() => setSelectedDate(date)}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        isSelected ? 'bg-indigo-100 border border-indigo-200' : 
                        isToday ? 'bg-blue-50 border border-blue-200' : 
                        'hover:bg-gray-50 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className={`font-medium ${isToday ? 'text-blue-700' : isSelected ? 'text-indigo-700' : 'text-gray-900'}`}>
                            {new Date(date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' })}
                          </div>
                          {isToday && <div className="text-xs text-blue-600">Aujourd'hui</div>}
                        </div>
                        {dayEvents.length > 0 && (
                          <div className="flex items-center space-x-1">
                            {dayEvents.slice(0, 2).map((event) => (
                              <div
                                key={event.id}
                                className={`w-2 h-2 rounded-full ${eventTypeColors[event.type].bg.replace('bg-', 'bg-opacity-60 bg-')}`}
                              />
                            ))}
                            {dayEvents.length > 2 && (
                              <span className="text-xs text-gray-500">+{dayEvents.length - 2}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Statistiques rapides */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-900 mb-4">Résumé</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Événements planifiés</span>
                  <span className="font-semibold text-gray-900">
                    {events.filter(e => e.statut === 'PLANIFIE').length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">En cours</span>
                  <span className="font-semibold text-blue-600">
                    {events.filter(e => e.statut === 'EN_COURS').length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Terminés cette semaine</span>
                  <span className="font-semibold text-green-600">
                    {events.filter(e => e.statut === 'TERMINE').length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}