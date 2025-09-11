'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Bell, Plus, AlertCircle, CheckCircle2, Clock, Calendar,
  Target, Users, DollarSign, Filter, Archive, Settings,
  Zap, RefreshCw, User, Building, Mail, Phone, MessageSquare,
  TrendingUp, Star, Flag, X
} from 'lucide-react';
import Link from 'next/link';

interface AlerteCRM {
  id: string;
  titre: string;
  message: string;
  type: 'RAPPEL' | 'ECHEANCE' | 'RELANCE' | 'SUIVI' | 'URGENT';
  clientId?: string;
  opportuniteId?: string;
  userId: string;
  dateAlerte: string;
  traite: boolean;
  recurrence?: 'AUCUNE' | 'QUOTIDIENNE' | 'HEBDOMADAIRE' | 'MENSUELLE' | 'ANNUELLE';
  prochaine?: string;
  client?: {
    id: string;
    name: string;
    email: string;
    company?: string;
    typeClient: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface RegleAutomatisation {
  id: string;
  nom: string;
  description: string;
  declencheur: string;
  conditions: any;
  actions: any;
  actif: boolean;
  nbExecutions: number;
  derniereExecution?: string;
}

export default function AlertesCRMPage() {
  const [alertes, setAlertes] = useState<AlerteCRM[]>([]);
  const [reglesAuto, setReglesAuto] = useState<RegleAutomatisation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'alertes' | 'automatisation'>('alertes');
  const [showForm, setShowForm] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    type: 'TOUS',
    statut: 'TOUS',
    dateDebut: '',
    dateFin: ''
  });

  const [newAlerte, setNewAlerte] = useState({
    titre: '',
    message: '',
    type: 'RAPPEL' as const,
    clientId: '',
    dateAlerte: new Date().toISOString().slice(0, 16),
    recurrence: 'AUCUNE' as const
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Récupération des vraies alertes via l'API
      const response = await fetch('/api/alertes?limit=100');
      
      if (response.ok) {
        const data = await response.json();
        console.log('API Response:', data);
        
        if (data.alertes && data.alertes.length > 0) {
          setAlertes(data.alertes);
          console.log('Alertes loaded:', data.alertes.length);
        } else {
          console.log('No alerts found in API response');
          
          // Fallback: données d'exemple si aucune alerte n'existe
          const mockAlertes: AlerteCRM[] = [
        {
          id: '1',
          titre: 'Relance devis extension bureaux',
          message: 'Le devis de 95 000€ pour l\'extension des bureaux expire dans 3 jours. Contacter le client pour finaliser.',
          type: 'ECHEANCE',
          clientId: '1',
          userId: 'user1',
          dateAlerte: '2024-12-22T10:00:00Z',
          traite: false,
          client: {
            id: '1',
            name: 'Sophie Durand',
            email: 'sophie.durand@email.com',
            company: 'Durand & Associés',
            typeClient: 'PROFESSIONNEL'
          },
          createdAt: '2024-12-18T08:00:00Z',
          updatedAt: '2024-12-18T08:00:00Z'
        },
        {
          id: '2',
          titre: 'Suivi client Marie Leclerc',
          message: 'Prévu: point d\'avancement sur le projet d\'aménagement des combles (45 000€)',
          type: 'SUIVI',
          clientId: '3',
          userId: 'user1',
          dateAlerte: '2024-12-20T14:00:00Z',
          traite: false,
          recurrence: 'HEBDOMADAIRE',
          prochaine: '2024-12-27T14:00:00Z',
          client: {
            id: '3',
            name: 'Marie Leclerc',
            email: 'marie.leclerc@hotmail.fr',
            typeClient: 'PARTICULIER'
          },
          createdAt: '2024-12-13T14:00:00Z',
          updatedAt: '2024-12-13T14:00:00Z'
        },
        {
          id: '3',
          titre: 'URGENT: Réunion chantier reportée',
          message: 'Le client Pierre Martin a reporté la réunion de chantier. Reprogrammer dans les meilleurs délais.',
          type: 'URGENT',
          clientId: '2',
          userId: 'user1',
          dateAlerte: '2024-12-19T09:00:00Z',
          traite: false,
          client: {
            id: '2',
            name: 'Pierre Martin',
            email: 'pierre.martin@gmail.com',
            typeClient: 'PARTICULIER'
          },
          createdAt: '2024-12-19T09:00:00Z',
          updatedAt: '2024-12-19T09:00:00Z'
        },
        {
          id: '4',
          titre: 'Rappel: Envoi facture intermédiaire',
          message: 'Situation de travaux #2 à facturer pour le chantier Rénovation Bureaux (32 500€)',
          type: 'RAPPEL',
          clientId: '1',
          userId: 'user1',
          dateAlerte: '2024-12-21T16:00:00Z',
          traite: true,
          client: {
            id: '1',
            name: 'Sophie Durand',
            email: 'sophie.durand@email.com',
            company: 'Durand & Associés',
            typeClient: 'PROFESSIONNEL'
          },
          createdAt: '2024-12-17T16:00:00Z',
          updatedAt: '2024-12-21T16:30:00Z'
        }
      ];

      const mockRegles: RegleAutomatisation[] = [
        {
          id: '1',
          nom: 'Relance automatique devis non signés',
          description: 'Envoie une alerte si un devis n\'est pas signé 3 jours avant expiration',
          declencheur: 'ECHEANCE_DEVIS',
          conditions: { delai: 3, statut: 'ENVOYE' },
          actions: { type: 'ALERTE', template: 'relance_devis' },
          actif: true,
          nbExecutions: 27,
          derniereExecution: '2024-12-18T08:00:00Z'
        },
        {
          id: '2',
          nom: 'Suivi prospects qualifiés',
          description: 'Crée un rappel hebdomadaire pour les prospects qualifiés sans activité depuis 7 jours',
          declencheur: 'INACTIVITE_PROSPECT',
          conditions: { delai: 7, statut: 'QUALIFIE' },
          actions: { type: 'RAPPEL', frequence: 'HEBDOMADAIRE' },
          actif: true,
          nbExecutions: 15,
          derniereExecution: '2024-12-15T10:00:00Z'
        },
        {
          id: '3',
          nom: 'Notification gros contrats',
          description: 'Alerte immédiate pour toute opportunité supérieure à 100 000€',
          declencheur: 'NOUVELLE_OPPORTUNITE',
          conditions: { valeurMin: 100000 },
          actions: { type: 'NOTIFICATION_URGENTE', destinataires: ['manager', 'commercial'] },
          actif: true,
          nbExecutions: 3,
          derniereExecution: '2024-12-01T15:30:00Z'
        },
        {
          id: '4',
          nom: 'Facturation automatique',
          description: 'Génère automatiquement les factures d\'acompte selon l\'avancement du chantier',
          declencheur: 'PROGRESSION_CHANTIER',
          conditions: { seuilProgression: [30, 60, 90] },
          actions: { type: 'GENERER_FACTURE', template: 'situation_travaux' },
          actif: false,
          nbExecutions: 8,
          derniereExecution: '2024-11-28T14:20:00Z'
        }
      ];

          setAlertes(mockAlertes);
          // Pour les règles d'automatisation, on garde les données d'exemple pour l'instant
          setReglesAuto(mockRegles);
        }
      } else {
        console.error('API Error:', response.status, response.statusText);
        setAlertes([]);
        setReglesAuto([]);
      }
    } catch (error) {
      console.error('Erreur chargement données:', error);
      setAlertes([]);
      setReglesAuto([]);
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type: string) => {
    const icons = {
      RAPPEL: Clock,
      ECHEANCE: Calendar,
      RELANCE: RefreshCw,
      SUIVI: Target,
      URGENT: AlertCircle
    };
    return icons[type as keyof typeof icons] || Bell;
  };

  const getTypeColor = (type: string) => {
    const colors = {
      RAPPEL: 'bg-blue-100 text-blue-800 border-blue-200',
      ECHEANCE: 'bg-orange-100 text-orange-800 border-orange-200',
      RELANCE: 'bg-purple-100 text-purple-800 border-purple-200',
      SUIVI: 'bg-green-100 text-green-800 border-green-200',
      URGENT: 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[type as keyof typeof colors] || colors.RAPPEL;
  };

  const getPrioriteByType = (type: string) => {
    const priorites = {
      URGENT: { level: 1, color: 'text-red-600', icon: '🚨' },
      ECHEANCE: { level: 2, color: 'text-orange-600', icon: '⏰' },
      RELANCE: { level: 3, color: 'text-purple-600', icon: '📞' },
      SUIVI: { level: 4, color: 'text-green-600', icon: '✅' },
      RAPPEL: { level: 5, color: 'text-blue-600', icon: '📝' }
    };
    return priorites[type as keyof typeof priorites] || priorites.RAPPEL;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((date.getTime() - now.getTime()) / (1000 * 60 * 60));
    
    const formattedDate = date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    if (diffDays === 0 && diffHours >= -2 && diffHours <= 2) return 'Maintenant';
    if (diffDays === 0) return `Aujourd'hui ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
    if (diffDays === 1) return `Demain ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
    if (diffDays === -1) return `Hier ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
    if (diffDays < 0) return `${formattedDate} (En retard)`;
    if (diffDays < 7) return `Dans ${diffDays} jour${diffDays > 1 ? 's' : ''} ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
    
    return formattedDate;
  };

  const marquerTraite = async (id: string) => {
    try {
      const newAlertes = alertes.map(alerte => 
        alerte.id === id 
          ? { ...alerte, traite: true, updatedAt: new Date().toISOString() }
          : alerte
      );
      setAlertes(newAlertes);
    } catch (error) {
      console.error('Erreur mise à jour alerte:', error);
    }
  };

  const toggleRegleAuto = async (id: string) => {
    try {
      const newRegles = reglesAuto.map(regle => 
        regle.id === id 
          ? { ...regle, actif: !regle.actif }
          : regle
      );
      setReglesAuto(newRegles);
    } catch (error) {
      console.error('Erreur toggle règle:', error);
    }
  };

  const filteredAlertes = alertes.filter(alerte => {
    const matchSearch = alerte.titre.toLowerCase().includes(filters.search.toLowerCase()) ||
                       alerte.message.toLowerCase().includes(filters.search.toLowerCase()) ||
                       (alerte.client?.name && alerte.client.name.toLowerCase().includes(filters.search.toLowerCase()));
    
    const matchType = filters.type === 'TOUS' || alerte.type === filters.type;
    const matchStatut = filters.statut === 'TOUS' || 
                       (filters.statut === 'TRAITE' && alerte.traite) ||
                       (filters.statut === 'NON_TRAITE' && !alerte.traite);
    
    return matchSearch && matchType && matchStatut;
  });

  const alertesNonTraitees = alertes.filter(a => !a.traite);
  const alertesUrgentes = alertesNonTraitees.filter(a => a.type === 'URGENT');
  const alertesEcheance = alertesNonTraitees.filter(a => a.type === 'ECHEANCE');

  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen p-4">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="grid gap-4">
              {[1,2,3,4].map(i => (
                <div key={i} className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                  <div className="h-16 bg-gray-200 rounded"></div>
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
        
        {/* Header Alertes */}
        <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700 rounded-3xl p-8 text-white shadow-xl mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-6 mb-6 lg:mb-0">
              <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center backdrop-blur-sm border border-white/30 relative">
                <Bell size={40} />
                {alertesNonTraitees.length > 0 && (
                  <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-8 h-8 flex items-center justify-center">
                    {alertesNonTraitees.length}
                  </div>
                )}
              </div>
              <div>
                <h1 className="text-4xl font-bold mb-2">🔔 Alertes & Automatisation</h1>
                <p className="text-xl text-blue-100 mb-2">
                  Système intelligent de suivi et d'automatisation CRM
                </p>
                <div className="flex items-center gap-6 text-blue-200 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                    <span>{alertesUrgentes.length} urgent{alertesUrgentes.length > 1 ? 'es' : 'e'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
                    <span>{alertesEcheance.length} échéance{alertesEcheance.length > 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span>{reglesAuto.filter(r => r.actif).length} règles actives</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                onClick={() => setActiveTab(activeTab === 'alertes' ? 'automatisation' : 'alertes')}
                className="flex items-center gap-2 bg-white/20 backdrop-blur-sm border border-white/30 text-white hover:bg-white/30"
              >
                <Settings size={20} />
                {activeTab === 'alertes' ? 'Automatisation' : 'Alertes'}
              </Button>
              <Button 
                onClick={loadData}
                className="flex items-center gap-2 bg-white/20 backdrop-blur-sm border border-white/30 text-white hover:bg-white/30"
              >
                <RefreshCw size={20} />
                Actualiser
              </Button>
              <Button 
                onClick={() => setShowForm(true)}
                className="flex items-center gap-2 bg-white text-indigo-600 hover:bg-blue-50 shadow-lg"
              >
                <Plus size={20} />
                Nouvelle Alerte
              </Button>
            </div>
          </div>
        </div>

        {/* Navigation Onglets */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm mb-6">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('alertes')}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'alertes'
                  ? 'border-indigo-500 text-indigo-600 bg-indigo-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Bell size={16} />
              Alertes Actives
              {alertesNonTraitees.length > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {alertesNonTraitees.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('automatisation')}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'automatisation'
                  ? 'border-indigo-500 text-indigo-600 bg-indigo-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Zap size={16} />
              Règles d'Automatisation
            </button>
          </div>
        </div>

        {activeTab === 'alertes' && (
          <div className="space-y-6">
            {/* Filtres Alertes */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <Input
                  placeholder="Rechercher alerte ou client..."
                  value={filters.search}
                  onChange={(e) => setFilters({...filters, search: e.target.value})}
                />
                
                <select
                  value={filters.type}
                  onChange={(e) => setFilters({...filters, type: e.target.value})}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="TOUS">Tous les types</option>
                  <option value="URGENT">🚨 Urgent</option>
                  <option value="ECHEANCE">⏰ Échéance</option>
                  <option value="RELANCE">📞 Relance</option>
                  <option value="SUIVI">✅ Suivi</option>
                  <option value="RAPPEL">📝 Rappel</option>
                </select>
                
                <select
                  value={filters.statut}
                  onChange={(e) => setFilters({...filters, statut: e.target.value})}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="TOUS">Tous les statuts</option>
                  <option value="NON_TRAITE">❌ Non traitées</option>
                  <option value="TRAITE">✅ Traitées</option>
                </select>
                
                <Input
                  type="date"
                  placeholder="Date début"
                  value={filters.dateDebut}
                  onChange={(e) => setFilters({...filters, dateDebut: e.target.value})}
                />
                
                <Button 
                  variant="outline"
                  onClick={() => setFilters({search: '', type: 'TOUS', statut: 'TOUS', dateDebut: '', dateFin: ''})}
                >
                  🔄 Réinitialiser
                </Button>
              </div>
            </div>

            {/* Liste des Alertes */}
            <div className="space-y-4">
              {filteredAlertes.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-12 text-center">
                  <Bell size={48} className="mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Aucune alerte
                  </h3>
                  <p className="text-gray-500 mb-6">
                    {filters.search || filters.type !== 'TOUS' ? 
                      'Aucune alerte ne correspond à vos critères.' :
                      'Toutes vos alertes sont traitées ! 🎉'
                    }
                  </p>
                </div>
              ) : (
                filteredAlertes
                  .sort((a, b) => {
                    // Tri par priorité puis par date
                    const prioriteA = getPrioriteByType(a.type).level;
                    const prioriteB = getPrioriteByType(b.type).level;
                    if (prioriteA !== prioriteB) return prioriteA - prioriteB;
                    return new Date(a.dateAlerte).getTime() - new Date(b.dateAlerte).getTime();
                  })
                  .map((alerte) => {
                    const TypeIcon = getTypeIcon(alerte.type);
                    const priorite = getPrioriteByType(alerte.type);
                    
                    return (
                      <div 
                        key={alerte.id} 
                        className={`bg-white rounded-2xl border shadow-sm hover:shadow-lg transition-all duration-300 ${
                          alerte.traite ? 'border-gray-200 opacity-60' : 'border-l-4 ' + (
                            alerte.type === 'URGENT' ? 'border-l-red-500' :
                            alerte.type === 'ECHEANCE' ? 'border-l-orange-500' :
                            'border-l-gray-200'
                          )
                        }`}
                      >
                        <div className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-start gap-4">
                              <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${getTypeColor(alerte.type)} ${
                                alerte.traite ? 'opacity-60' : ''
                              }`}>
                                <TypeIcon size={24} />
                              </div>
                              
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h3 className={`text-lg font-semibold ${alerte.traite ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                                    {priorite.icon} {alerte.titre}
                                  </h3>
                                  <span className={`text-xs font-medium ${priorite.color}`}>
                                    {alerte.type}
                                  </span>
                                </div>
                                
                                <p className={`text-gray-700 mb-3 ${alerte.traite ? 'text-gray-500' : ''}`}>
                                  {alerte.message}
                                </p>
                                
                                <div className="flex items-center gap-4 text-sm text-gray-600">
                                  {alerte.client && (
                                    <div className="flex items-center gap-2">
                                      <User size={14} />
                                      <span>{alerte.client.name}</span>
                                      {alerte.client.company && (
                                        <span className="text-gray-400">• {alerte.client.company}</span>
                                      )}
                                    </div>
                                  )}
                                  
                                  <div className="flex items-center gap-1">
                                    <Calendar size={14} />
                                    <span className={`${
                                      new Date(alerte.dateAlerte) < new Date() && !alerte.traite ? 'text-red-600 font-medium' : ''
                                    }`}>
                                      {formatDate(alerte.dateAlerte)}
                                    </span>
                                  </div>
                                  
                                  {alerte.recurrence && alerte.recurrence !== 'AUCUNE' && (
                                    <div className="flex items-center gap-1 text-blue-600">
                                      <RefreshCw size={14} />
                                      <span>{alerte.recurrence}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              {!alerte.traite && (
                                <Button 
                                  size="sm"
                                  onClick={() => marquerTraite(alerte.id)}
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                >
                                  <CheckCircle2 size={14} className="mr-1" />
                                  Traité
                                </Button>
                              )}
                              
                              {alerte.client && (
                                <>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => window.open(`tel:${alerte.client?.email}`, '_self')}
                                    className="text-green-600 border-green-200 hover:bg-green-50"
                                  >
                                    <Phone size={14} />
                                  </Button>
                                  
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => window.open(`mailto:${alerte.client?.email}`, '_blank')}
                                    className="text-blue-600 border-blue-200 hover:bg-blue-50"
                                  >
                                    <Mail size={14} />
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                          
                          {alerte.prochaine && !alerte.traite && (
                            <div className="bg-blue-50 rounded-lg p-3 border-l-4 border-blue-400">
                              <div className="flex items-center gap-2 text-blue-800">
                                <Clock size={16} />
                                <span className="font-medium">Prochaine occurrence:</span>
                                <span>{formatDate(alerte.prochaine)}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </div>
        )}

        {activeTab === 'automatisation' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-semibold">⚡ Règles d'Automatisation</h3>
                  <p className="text-gray-600">Automatisez vos processus CRM pour gagner du temps</p>
                </div>
                <Button className="bg-indigo-600 hover:bg-indigo-700">
                  <Plus size={16} className="mr-2" />
                  Nouvelle Règle
                </Button>
              </div>
              
              <div className="grid gap-4">
                {reglesAuto.map((regle) => (
                  <div key={regle.id} className="border border-gray-200 rounded-xl p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="text-lg font-semibold text-gray-900">
                            {regle.nom}
                          </h4>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            regle.actif ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {regle.actif ? '✅ Actif' : '⏸️ Inactif'}
                          </span>
                        </div>
                        <p className="text-gray-600 mb-3">{regle.description}</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <div className="text-gray-500">Déclencheur</div>
                            <div className="font-medium">{regle.declencheur.replace('_', ' ')}</div>
                          </div>
                          <div>
                            <div className="text-gray-500">Exécutions</div>
                            <div className="font-medium">{regle.nbExecutions} fois</div>
                          </div>
                          <div>
                            <div className="text-gray-500">Dernière exécution</div>
                            <div className="font-medium">
                              {regle.derniereExecution ? formatDate(regle.derniereExecution) : 'Jamais'}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleRegleAuto(regle.id)}
                          className={regle.actif ? 'text-orange-600 border-orange-200' : 'text-green-600 border-green-200'}
                        >
                          {regle.actif ? 'Désactiver' : 'Activer'}
                        </Button>
                        <Button size="sm" variant="outline">
                          Modifier
                        </Button>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="font-medium text-gray-700 mb-1">Conditions:</div>
                          <div className="text-gray-600">{JSON.stringify(regle.conditions, null, 1).replace(/[{}",]/g, '').trim()}</div>
                        </div>
                        <div>
                          <div className="font-medium text-gray-700 mb-1">Actions:</div>
                          <div className="text-gray-600">{JSON.stringify(regle.actions, null, 1).replace(/[{}",]/g, '').trim()}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Modal Nouvelle Alerte */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold text-gray-900">
                    🔔 Nouvelle Alerte
                  </h3>
                  <Button
                    variant="ghost"
                    onClick={() => setShowForm(false)}
                  >
                    <X size={20} />
                  </Button>
                </div>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Type d'alerte *
                    </label>
                    <select
                      value={newAlerte.type}
                      onChange={(e) => setNewAlerte({...newAlerte, type: e.target.value as any})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="RAPPEL">📝 Rappel</option>
                      <option value="ECHEANCE">⏰ Échéance</option>
                      <option value="RELANCE">📞 Relance</option>
                      <option value="SUIVI">✅ Suivi</option>
                      <option value="URGENT">🚨 Urgent</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date & heure *
                    </label>
                    <input
                      type="datetime-local"
                      value={newAlerte.dateAlerte}
                      onChange={(e) => setNewAlerte({...newAlerte, dateAlerte: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Titre de l'alerte *
                  </label>
                  <input
                    type="text"
                    value={newAlerte.titre}
                    onChange={(e) => setNewAlerte({...newAlerte, titre: e.target.value})}
                    placeholder="Ex: Relance devis client Dupont"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message détaillé *
                  </label>
                  <textarea
                    value={newAlerte.message}
                    onChange={(e) => setNewAlerte({...newAlerte, message: e.target.value})}
                    placeholder="Décrivez ce qui doit être fait..."
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Récurrence
                  </label>
                  <select
                    value={newAlerte.recurrence}
                    onChange={(e) => setNewAlerte({...newAlerte, recurrence: e.target.value as any})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="AUCUNE">Aucune (unique)</option>
                    <option value="QUOTIDIENNE">Quotidienne</option>
                    <option value="HEBDOMADAIRE">Hebdomadaire</option>
                    <option value="MENSUELLE">Mensuelle</option>
                    <option value="ANNUELLE">Annuelle</option>
                  </select>
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
                  disabled={!newAlerte.titre || !newAlerte.message}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  🔔 Créer l'Alerte
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}