'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  MessageSquare, Plus, Phone, Mail, Calendar, MapPin, Clock, 
  Users, Filter, Search, Download, Eye, Edit, Archive,
  CheckCircle, AlertCircle, Play, Pause, User, Building,
  Target, FileText, Star, Tag
} from 'lucide-react';
import Link from 'next/link';

interface InteractionClient {
  id: string;
  type: 'APPEL' | 'EMAIL' | 'VISITE' | 'REUNION' | 'AUTRE';
  objet: string;
  description: string;
  dateContact: string;
  prochaineSuite?: string;
  dureeMinutes?: number;
  resultats?: string;
  pieceJointe?: string;
  localisation?: string;
  rappelDate?: string;
  statut: 'A_TRAITER' | 'EN_COURS' | 'TERMINE' | 'REPORTE';
  client: {
    id: string;
    name: string;
    email: string;
    company?: string;
    typeClient: string;
  };
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export default function InteractionsPage() {
  const [interactions, setInteractions] = useState<InteractionClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedInteraction, setSelectedInteraction] = useState<InteractionClient | null>(null);
  const [filters, setFilters] = useState({
    search: '',
    type: 'TOUS',
    statut: 'TOUS',
    client: '',
    dateDebut: '',
    dateFin: ''
  });

  const [newInteraction, setNewInteraction] = useState({
    clientId: '',
    type: 'APPEL' as const,
    objet: '',
    description: '',
    dateContact: new Date().toISOString().slice(0, 16),
    prochaineSuite: '',
    dureeMinutes: undefined as number | undefined,
    localisation: '',
    pieceJointe: ''
  });

  useEffect(() => {
    loadInteractions();
  }, []);

  const loadInteractions = async () => {
    try {
      setLoading(true);
      
      // Récupération des vraies interactions via l'API
      const response = await fetch('/api/interactions?limit=100');
      
      if (response.ok) {
        const data = await response.json();
        console.log('API Response:', data);
        
        if (data.interactions && data.interactions.length > 0) {
          setInteractions(data.interactions);
          console.log('Interactions loaded:', data.interactions.length);
        } else {
          console.log('No interactions found in API response');
          
          // Fallback: données d'exemple si aucune interaction n'existe
          const mockInteractions: InteractionClient[] = [
        {
          id: '1',
          type: 'APPEL',
          objet: 'Suivi projet rénovation bureaux',
          description: 'Point sur l\'avancement des travaux de rénovation. Discussion sur les finitions et validation des échéances.',
          dateContact: '2024-12-18T14:20:00Z',
          prochaineSuite: '2024-12-22T10:00:00Z',
          dureeMinutes: 25,
          resultats: 'Validation étape suivante confirmée. Client satisfait de la progression.',
          statut: 'TERMINE',
          client: {
            id: '1',
            name: 'Sophie Durand',
            email: 'sophie.durand@email.com',
            company: 'Durand & Associés',
            typeClient: 'PROFESSIONNEL'
          },
          createdBy: 'Jean-Pierre Martin',
          createdAt: '2024-12-18T14:20:00Z',
          updatedAt: '2024-12-18T14:45:00Z'
        },
        {
          id: '2',
          type: 'EMAIL',
          objet: 'Envoi devis extension bureaux',
          description: 'Transmission du devis détaillé pour l\'extension des bureaux de 40m². Incluant plans et calendrier prévisionnel.',
          dateContact: '2024-12-15T09:15:00Z',
          prochaineSuite: '2024-12-20T15:00:00Z',
          resultats: 'Devis envoyé et accusé réception confirmé',
          pieceJointe: 'devis_extension_durand_2024.pdf',
          statut: 'A_TRAITER',
          client: {
            id: '1',
            name: 'Sophie Durand',
            email: 'sophie.durand@email.com',
            company: 'Durand & Associés',
            typeClient: 'PROFESSIONNEL'
          },
          createdBy: 'Jean-Pierre Martin',
          createdAt: '2024-12-15T09:15:00Z',
          updatedAt: '2024-12-15T09:15:00Z'
        },
        {
          id: '3',
          type: 'VISITE',
          objet: 'Visite technique showroom',
          description: 'Évaluation des besoins pour l\'aménagement du nouveau showroom. Prise de mesures et discussion des contraintes techniques.',
          dateContact: '2024-05-20T14:30:00Z',
          dureeMinutes: 90,
          localisation: '23 Rue de Rivoli, 75001 Paris',
          resultats: 'Cahier des charges validé. Contraintes électriques identifiées.',
          statut: 'TERMINE',
          client: {
            id: '1',
            name: 'Sophie Durand',
            email: 'sophie.durand@email.com',
            company: 'Durand & Associés',
            typeClient: 'PROFESSIONNEL'
          },
          createdBy: 'Marie Leclerc',
          createdAt: '2024-05-20T14:30:00Z',
          updatedAt: '2024-05-20T16:00:00Z'
        },
        {
          id: '4',
          type: 'REUNION',
          objet: 'Point d\'avancement chantier résidentiel',
          description: 'Réunion de chantier avec l\'équipe technique pour faire le point sur l\'avancement des travaux de rénovation.',
          dateContact: '2024-12-12T10:00:00Z',
          prochaineSuite: '2024-12-19T10:00:00Z',
          dureeMinutes: 60,
          localisation: 'Chantier - 45 Avenue Mozart, 75016 Paris',
          resultats: 'Planning validé. Livraison matériaux programmée.',
          statut: 'TERMINE',
          client: {
            id: '2',
            name: 'Pierre Martin',
            email: 'pierre.martin@gmail.com',
            typeClient: 'PARTICULIER'
          },
          createdBy: 'Julien Dubois',
          createdAt: '2024-12-12T10:00:00Z',
          updatedAt: '2024-12-12T11:00:00Z'
        },
        {
          id: '5',
          type: 'APPEL',
          objet: 'Relance devis cuisine',
          description: 'Appel de relance concernant le devis de rénovation de cuisine envoyé la semaine dernière.',
          dateContact: '2024-12-16T16:30:00Z',
          prochaineSuite: '2024-12-23T14:00:00Z',
          dureeMinutes: 15,
          resultats: 'Client demande modifications mineures. Nouveau devis à envoyer.',
          statut: 'EN_COURS',
          client: {
            id: '3',
            name: 'Marie Leclerc',
            email: 'marie.leclerc@hotmail.fr',
            typeClient: 'PARTICULIER'
          },
          createdBy: 'Sophie Bernard',
          createdAt: '2024-12-16T16:30:00Z',
          updatedAt: '2024-12-16T16:45:00Z'
        }
      ];

          setInteractions(mockInteractions);
        }
      } else {
        console.error('API Error:', response.status, response.statusText);
        setInteractions([]);
      }
    } catch (error) {
      console.error('Erreur chargement interactions:', error);
      setInteractions([]);
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type: string) => {
    const icons = {
      APPEL: Phone,
      EMAIL: Mail,
      VISITE: MapPin,
      REUNION: Calendar,
      AUTRE: MessageSquare
    };
    return icons[type as keyof typeof icons] || MessageSquare;
  };

  const getTypeColor = (type: string) => {
    const colors = {
      APPEL: 'bg-green-100 text-green-800 border-green-200',
      EMAIL: 'bg-blue-100 text-blue-800 border-blue-200',
      VISITE: 'bg-purple-100 text-purple-800 border-purple-200',
      REUNION: 'bg-orange-100 text-orange-800 border-orange-200',
      AUTRE: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[type as keyof typeof colors] || colors.AUTRE;
  };

  const getStatutColor = (statut: string) => {
    const colors = {
      A_TRAITER: 'bg-amber-100 text-amber-800 border-amber-200',
      EN_COURS: 'bg-blue-100 text-blue-800 border-blue-200',
      TERMINE: 'bg-green-100 text-green-800 border-green-200',
      REPORTE: 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[statut as keyof typeof colors] || colors.A_TRAITER;
  };

  const getStatutIcon = (statut: string) => {
    const icons = {
      A_TRAITER: AlertCircle,
      EN_COURS: Play,
      TERMINE: CheckCircle,
      REPORTE: Pause
    };
    return icons[statut as keyof typeof icons] || AlertCircle;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    const formattedDate = date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    
    const formattedTime = date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
    
    if (diffDays === 0) return `Aujourd'hui ${formattedTime}`;
    if (diffDays === 1) return `Demain ${formattedTime}`;
    if (diffDays === -1) return `Hier ${formattedTime}`;
    if (diffDays < 0) return `${formattedDate} ${formattedTime}`;
    if (diffDays < 7) return `Dans ${diffDays} jour${diffDays > 1 ? 's' : ''} ${formattedTime}`;
    
    return `${formattedDate} ${formattedTime}`;
  };

  const filteredInteractions = interactions.filter(interaction => {
    const matchSearch = interaction.objet.toLowerCase().includes(filters.search.toLowerCase()) ||
                       interaction.client.name.toLowerCase().includes(filters.search.toLowerCase()) ||
                       (interaction.client.company && interaction.client.company.toLowerCase().includes(filters.search.toLowerCase()));
    
    const matchType = filters.type === 'TOUS' || interaction.type === filters.type;
    const matchStatut = filters.statut === 'TOUS' || interaction.statut === filters.statut;
    
    return matchSearch && matchType && matchStatut;
  });

  const handleAddInteraction = async () => {
    try {
      const nouvelleInteraction = {
        id: Date.now().toString(),
        ...newInteraction,
        client: {
          id: newInteraction.clientId,
          name: 'Client Test', // En production, récupérer depuis l'API
          email: 'test@test.com',
          typeClient: 'PARTICULIER'
        },
        statut: 'A_TRAITER' as const,
        createdBy: 'Utilisateur Actuel',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      setInteractions([nouvelleInteraction, ...interactions]);
      setShowForm(false);
      setNewInteraction({
        clientId: '',
        type: 'APPEL',
        objet: '',
        description: '',
        dateContact: new Date().toISOString().slice(0, 16),
        prochaineSuite: '',
        dureeMinutes: undefined,
        localisation: '',
        pieceJointe: ''
      });
    } catch (error) {
      console.error('Erreur ajout interaction:', error);
    }
  };

  const updateStatutInteraction = async (id: string, nouveauStatut: string) => {
    try {
      const newInteractions = interactions.map(interaction => 
        interaction.id === id 
          ? { ...interaction, statut: nouveauStatut as any, updatedAt: new Date().toISOString() }
          : interaction
      );
      setInteractions(newInteractions);
    } catch (error) {
      console.error('Erreur mise à jour statut:', error);
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen p-4">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="grid gap-4">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                  <div className="h-16 bg-gray-200 rounded mb-4"></div>
                  <div className="flex gap-2">
                    <div className="h-6 bg-gray-200 rounded w-20"></div>
                    <div className="h-6 bg-gray-200 rounded w-20"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto p-6">
        
        {/* Header Interactions */}
        <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700 rounded-3xl p-8 text-white shadow-xl mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-6 mb-6 lg:mb-0">
              <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center backdrop-blur-sm border border-white/30">
                <MessageSquare size={40} />
              </div>
              <div>
                <h1 className="text-4xl font-bold mb-2">💬 Gestion des Interactions</h1>
                <p className="text-xl text-blue-100 mb-2">
                  Suivi complet de toutes vos interactions clients
                </p>
                <div className="flex items-center gap-6 text-blue-200 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span>{interactions.filter(i => i.statut === 'TERMINE').length} terminées</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                    <span>{interactions.filter(i => i.statut === 'EN_COURS').length} en cours</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                    <span>{interactions.filter(i => i.statut === 'A_TRAITER').length} à traiter</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                onClick={() => {
                  const csvData = filteredInteractions.map(interaction => ({
                    Date: formatDate(interaction.dateContact),
                    Type: interaction.type,
                    Objet: interaction.objet,
                    Client: interaction.client.name,
                    Statut: interaction.statut,
                    Durée: interaction.dureeMinutes || '',
                    'Créé par': interaction.createdBy
                  }));
                  const csvContent = "data:text/csv;charset=utf-8," 
                    + Object.keys(csvData[0]).join(",") + "\n"
                    + csvData.map(row => Object.values(row).join(",")).join("\n");
                  const encodedUri = encodeURI(csvContent);
                  const link = document.createElement("a");
                  link.setAttribute("href", encodedUri);
                  link.setAttribute("download", "interactions_" + new Date().toISOString().split('T')[0] + ".csv");
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
                className="flex items-center gap-2 bg-white/20 backdrop-blur-sm border border-white/30 text-white hover:bg-white/30"
              >
                <Download size={20} />
                Export
              </Button>
              <Link href="/dashboard/crm/clients">
                <Button className="flex items-center gap-2 bg-white/20 backdrop-blur-sm border border-white/30 text-white hover:bg-white/30">
                  <Users size={20} />
                  Clients
                </Button>
              </Link>
              <Button 
                onClick={() => setShowForm(true)}
                className="flex items-center gap-2 bg-white text-indigo-600 hover:bg-blue-50 shadow-lg"
              >
                <Plus size={20} />
                Nouvelle Interaction
              </Button>
            </div>
          </div>
        </div>

        {/* Filtres */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Input
              placeholder="Rechercher interaction ou client..."
              value={filters.search}
              onChange={(e) => setFilters({...filters, search: e.target.value})}
            />
            
            <select
              value={filters.type}
              onChange={(e) => setFilters({...filters, type: e.target.value})}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="TOUS">Tous les types</option>
              <option value="APPEL">📞 Appels</option>
              <option value="EMAIL">📧 Emails</option>
              <option value="VISITE">📍 Visites</option>
              <option value="REUNION">📅 Réunions</option>
              <option value="AUTRE">💬 Autres</option>
            </select>
            
            <select
              value={filters.statut}
              onChange={(e) => setFilters({...filters, statut: e.target.value})}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="TOUS">Tous les statuts</option>
              <option value="A_TRAITER">⏳ À traiter</option>
              <option value="EN_COURS">▶️ En cours</option>
              <option value="TERMINE">✅ Terminé</option>
              <option value="REPORTE">⏸️ Reporté</option>
            </select>
            
            <Input
              type="date"
              placeholder="Date début"
              value={filters.dateDebut}
              onChange={(e) => setFilters({...filters, dateDebut: e.target.value})}
            />
            
            <Button 
              variant="outline"
              onClick={() => setFilters({search: '', type: 'TOUS', statut: 'TOUS', client: '', dateDebut: '', dateFin: ''})}
            >
              🔄 Réinitialiser
            </Button>
          </div>
        </div>

        {/* Liste des Interactions */}
        <div className="space-y-4">
          {filteredInteractions.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-12 text-center">
              <MessageSquare size={48} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Aucune interaction trouvée
              </h3>
              <p className="text-gray-500 mb-6">
                {filters.search || filters.type !== 'TOUS' ? 
                  'Aucune interaction ne correspond à vos critères.' :
                  'Commencez par enregistrer vos premières interactions clients.'
                }
              </p>
              <Button onClick={() => setShowForm(true)}>
                Nouvelle Interaction
              </Button>
            </div>
          ) : (
            filteredInteractions.map((interaction) => {
              const TypeIcon = getTypeIcon(interaction.type);
              const StatutIcon = getStatutIcon(interaction.statut);
              
              return (
                <div key={interaction.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300">
                  <div className="p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-4">
                        <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${getTypeColor(interaction.type)}`}>
                          <TypeIcon size={24} />
                        </div>
                        
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            {interaction.objet}
                          </h3>
                          <div className="flex items-center gap-3 text-sm text-gray-600 mb-2">
                            <div className="flex items-center gap-1">
                              <User size={14} />
                              <span>{interaction.client.name}</span>
                              {interaction.client.company && (
                                <span className="text-gray-400">• {interaction.client.company}</span>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock size={14} />
                              <span>{formatDate(interaction.dateContact)}</span>
                            </div>
                            {interaction.dureeMinutes && (
                              <div className="flex items-center gap-1">
                                <span>⏱️ {interaction.dureeMinutes} min</span>
                              </div>
                            )}
                          </div>
                          <p className="text-gray-700 line-clamp-2">
                            {interaction.description}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border ${getStatutColor(interaction.statut)}`}>
                          <StatutIcon size={14} />
                          {interaction.statut.replace('_', ' ')}
                        </span>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => setSelectedInteraction(interaction)}
                        >
                          <Eye size={16} />
                        </Button>
                      </div>
                    </div>

                    {/* Détails supplémentaires */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 py-4 border-t border-gray-100">
                      {interaction.localisation && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <MapPin size={14} className="text-gray-400" />
                          <span>{interaction.localisation}</span>
                        </div>
                      )}
                      
                      {interaction.pieceJointe && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <FileText size={14} className="text-gray-400" />
                          <span>Pièce jointe</span>
                        </div>
                      )}
                      
                      {interaction.prochaineSuite && (
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar size={14} className="text-orange-500" />
                          <span className="text-orange-600 font-medium">
                            Suivi: {formatDate(interaction.prochaineSuite)}
                          </span>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <User size={14} className="text-gray-400" />
                        <span>Par {interaction.createdBy}</span>
                      </div>
                    </div>

                    {/* Résultats */}
                    {interaction.resultats && (
                      <div className="mt-4 p-3 bg-green-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Star size={16} className="text-green-600" />
                          <span className="text-sm font-medium text-green-800">Résultats</span>
                        </div>
                        <p className="text-sm text-green-700">
                          {interaction.resultats}
                        </p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 mt-4">
                      {interaction.statut !== 'TERMINE' && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => updateStatutInteraction(interaction.id, 'TERMINE')}
                          className="text-green-600 border-green-200 hover:bg-green-50"
                        >
                          <CheckCircle size={14} className="mr-1" />
                          Marquer Terminé
                        </Button>
                      )}
                      
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => window.open(`tel:${interaction.client.email}`, '_self')}
                        className="text-blue-600 border-blue-200 hover:bg-blue-50"
                      >
                        <Phone size={14} className="mr-1" />
                        Rappeler
                      </Button>
                      
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => window.open(`mailto:${interaction.client.email}`, '_blank')}
                        className="text-purple-600 border-purple-200 hover:bg-purple-50"
                      >
                        <Mail size={14} className="mr-1" />
                        Email
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Nouvelle Interaction */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold text-gray-900">
                    💬 Nouvelle Interaction Client
                  </h3>
                  <Button
                    variant="ghost"
                    onClick={() => setShowForm(false)}
                  >
                    ✕
                  </Button>
                </div>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Type d'interaction *
                    </label>
                    <select
                      value={newInteraction.type}
                      onChange={(e) => setNewInteraction({...newInteraction, type: e.target.value as any})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="APPEL">📞 Appel téléphonique</option>
                      <option value="EMAIL">📧 Email</option>
                      <option value="VISITE">📍 Visite client</option>
                      <option value="REUNION">📅 Réunion</option>
                      <option value="AUTRE">💬 Autre</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date & heure *
                    </label>
                    <input
                      type="datetime-local"
                      value={newInteraction.dateContact}
                      onChange={(e) => setNewInteraction({...newInteraction, dateContact: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Objet de l'interaction *
                  </label>
                  <input
                    type="text"
                    value={newInteraction.objet}
                    onChange={(e) => setNewInteraction({...newInteraction, objet: e.target.value})}
                    placeholder="Ex: Suivi devis, relance client, visite technique..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description détaillée *
                  </label>
                  <textarea
                    value={newInteraction.description}
                    onChange={(e) => setNewInteraction({...newInteraction, description: e.target.value})}
                    placeholder="Décrivez le contexte, les points abordés, les décisions prises..."
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Durée (minutes)
                    </label>
                    <input
                      type="number"
                      value={newInteraction.dureeMinutes || ''}
                      onChange={(e) => setNewInteraction({...newInteraction, dureeMinutes: e.target.value ? parseInt(e.target.value) : undefined})}
                      placeholder="Ex: 30"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Prochain suivi
                    </label>
                    <input
                      type="datetime-local"
                      value={newInteraction.prochaineSuite}
                      onChange={(e) => setNewInteraction({...newInteraction, prochaineSuite: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Localisation (pour visites/réunions)
                  </label>
                  <input
                    type="text"
                    value={newInteraction.localisation}
                    onChange={(e) => setNewInteraction({...newInteraction, localisation: e.target.value})}
                    placeholder="Adresse du rendez-vous"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              
              <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowForm(false)}
                >
                  Annuler
                </Button>
                <Button
                  onClick={handleAddInteraction}
                  disabled={!newInteraction.objet || !newInteraction.description}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  💬 Enregistrer l'Interaction
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}