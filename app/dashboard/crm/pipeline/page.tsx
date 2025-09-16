'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Target, Plus, ArrowRight, Phone, Mail, Calendar, 
  DollarSign, TrendingUp, MoreVertical, Edit, Archive, 
  Clock, User, Filter, Search, Download, RefreshCw,
  AlertCircle, CheckCircle2, Eye
} from 'lucide-react';
import Link from 'next/link';

interface Opportunite {
  id: string;
  titre: string;
  description: string;
  valeurEstimee: number;
  probabilite: number;
  statut: StatutOpportunite;
  dateCloture?: string;
  dateCloturePrevisionnelle?: string;
  client: {
    id: string;
    nom?: string;
    name?: string;
    email: string;
    company?: string;
    phone?: string;
    telephoneMobile?: string;
  };
  sourceProspection?: string;
  dateProchainSuivi?: string;
  priorite: string;
  typeProjet?: string;
  createdAt: string;
  updatedAt: string;
}

enum StatutOpportunite {
  PROSPECT = 'PROSPECT',
  QUALIFIE = 'QUALIFIE',
  PROPOSITION = 'PROPOSITION', 
  NEGOCIATION = 'NEGOCIATION',
  GAGNE = 'GAGNE',
  PERDU = 'PERDU'
}

const STAGES = [
  {
    id: 'PROSPECT',
    title: 'Prospects',
    subtitle: 'Nouveaux contacts',
    color: 'from-slate-500 to-slate-600',
    bgColor: 'bg-slate-50',
    borderColor: 'border-slate-200',
    probability: 20,
    icon: Target
  },
  {
    id: 'QUALIFIE', 
    title: 'Qualifiés',
    subtitle: 'Besoins identifiés',
    color: 'from-blue-500 to-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    probability: 40,
    icon: User
  },
  {
    id: 'PROPOSITION',
    title: 'Propositions',
    subtitle: 'Devis envoyés',
    color: 'from-amber-500 to-amber-600', 
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    probability: 60,
    icon: DollarSign
  },
  {
    id: 'NEGOCIATION',
    title: 'Négociations',
    subtitle: 'En discussion',
    color: 'from-purple-500 to-purple-600',
    bgColor: 'bg-purple-50', 
    borderColor: 'border-purple-200',
    probability: 80,
    icon: TrendingUp
  },
  {
    id: 'GAGNE',
    title: 'Signés',
    subtitle: 'Projets gagnés',
    color: 'from-green-500 to-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200', 
    probability: 100,
    icon: CheckCircle2
  },
  {
    id: 'PERDU',
    title: 'Perdus',
    subtitle: 'Non aboutis',
    color: 'from-red-500 to-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    probability: 0,
    icon: AlertCircle
  }
];

export default function PipelineCommercialPage() {
  const [opportunites, setOpportunites] = useState<Opportunite[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    search: '',
    client: '',
    valeurMin: '',
    valeurMax: '',
    priorite: 'TOUS',
    commercial: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedOpportunite, setSelectedOpportunite] = useState<Opportunite | null>(null);

  useEffect(() => {
    loadOpportunites();
  }, []);

  const loadOpportunites = async () => {
    try {
      setLoading(true);
      
      // Récupération des vraies opportunités via l'API CRM
      const response = await fetch('/api/crm/opportunites?limit=100');
      
      if (response.ok) {
        const data = await response.json();
        console.log('API Response:', data);
        
        if (data.length > 0) {
          setOpportunites(data);
          console.log('Opportunités loaded:', data.length);
        } else {
          console.log('No opportunities found in API response');
          
          // Fallback: données d'exemple si aucune opportunité n'existe
          const mockOpportunites: Opportunite[] = [
        {
          id: '1',
          titre: 'Rénovation Cuisine Moderne',
          description: 'Rénovation complète cuisine 25m² avec îlot central et électroménager haut de gamme',
          valeurEstimee: 35000,
          probabilite: 75,
          statut: StatutOpportunite.PROPOSITION,
          dateCloture: '2025-01-15',
          client: {
            id: '1',
            name: 'Sophie Durand',
            email: 'sophie.durand@email.com',
            company: 'Durand & Associés',
            phone: '+33 6 12 34 56 78'
          },
          sourceProspection: 'Site Web',
          dateProchainSuivi: '2025-01-10',
          priorite: 'HAUTE',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: '2',
          titre: 'Extension Maison Individuelle',
          description: 'Extension 40m² avec suite parentale et salle de bain',
          valeurEstimee: 65000,
          probabilite: 45,
          statut: StatutOpportunite.QUALIFIE,
          dateCloture: '2025-02-20',
          client: {
            id: '2', 
            name: 'Pierre Martin',
            email: 'pierre.martin@gmail.com',
            phone: '+33 6 87 65 43 21'
          },
          sourceProspection: 'Recommandation',
          dateProchainSuivi: '2025-01-12',
          priorite: 'NORMALE',
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: '3',
          titre: 'Aménagement Combles 80m²',
          description: 'Création de 2 chambres et 1 bureau dans les combles existants',
          valeurEstimee: 45000,
          probabilite: 90,
          statut: StatutOpportunite.NEGOCIATION,
          dateCloture: '2025-01-08',
          client: {
            id: '3',
            name: 'Marie Leclerc', 
            email: 'marie.leclerc@hotmail.fr',
            phone: '+33 6 23 45 67 89'
          },
          sourceProspection: 'Publicité Facebook',
          dateProchainSuivi: '2025-01-07',
          priorite: 'CRITIQUE',
          createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: '4',
          titre: 'Démolition Cloison + Ouverture',
          description: 'Ouverture cuisine sur salon avec poutre IPN',
          valeurEstimee: 12000,
          probabilite: 25,
          statut: StatutOpportunite.PROSPECT,
          client: {
            id: '4',
            name: 'Jean Dupont',
            email: 'jean.dupont@orange.fr', 
            phone: '+33 6 34 56 78 90'
          },
          sourceProspection: 'Pages Jaunes',
          dateProchainSuivi: '2025-01-14',
          priorite: 'BASSE',
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: '5',
          titre: 'Rénovation Salle de Bain Complète',
          description: 'Rénovation totale salle de bain 8m² avec douche italienne',
          valeurEstimee: 28000,
          probabilite: 100,
          statut: StatutOpportunite.GAGNE,
          dateCloture: '2024-12-20',
          client: {
            id: '5',
            name: 'Caroline Moreau',
            email: 'caroline.moreau@gmail.com',
            phone: '+33 6 45 67 89 01'
          },
          sourceProspection: 'Bouche à oreille',
          priorite: 'HAUTE',
          createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
        }
      ];

          setOpportunites(mockOpportunites);
        }
      } else {
        console.error('API Error:', response.status, response.statusText);
        setOpportunites([]);
      }
    } catch (error) {
      console.error('Erreur chargement opportunités:', error);
      setOpportunites([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (e: React.DragEvent, opportuniteId: string) => {
    setDraggedItem(opportuniteId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, newStatut: StatutOpportunite) => {
    e.preventDefault();
    
    if (draggedItem) {
      const updatedOpportunites = opportunites.map(opp => 
        opp.id === draggedItem 
          ? { 
              ...opp, 
              statut: newStatut,
              probabilite: STAGES.find(s => s.id === newStatut)?.probability || opp.probabilite,
              updatedAt: new Date().toISOString()
            }
          : opp
      );
      
      setOpportunites(updatedOpportunites);
      setDraggedItem(null);
      
      // API call to update status
      try {
        const response = await fetch(`/api/crm/opportunites/${draggedItem}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            statut: newStatut,
            probabilite: STAGES.find(s => s.id === newStatut)?.probability || 50,
          }),
        });
        
        if (!response.ok) {
          console.error('Erreur lors de la mise à jour du statut:', response.statusText);
          // Revert the optimistic update on error
          loadOpportunites();
        }
      } catch (error) {
        console.error('Erreur lors de la mise à jour du statut:', error);
        // Revert the optimistic update on error
        loadOpportunites();
      }
    }
  };

  // Protection absolue contre les erreurs
  const safeOpportunites = React.useMemo(() => {
    try {
      return Array.isArray(opportunites) ? opportunites : [];
    } catch (e) {
      console.error('Erreur lors de l\'accès aux opportunités:', e);
      return [];
    }
  }, [opportunites]);

  const filteredOpportunites = React.useMemo(() => {
    try {
      const safeTerm = String(filters?.search || '').toLowerCase();
      const safeValeurMin = parseFloat(filters?.valeurMin || '0') || 0;
      const safeValeurMax = parseFloat(filters?.valeurMax || '0') || Infinity;
      const safePriorite = String(filters?.priorite || 'TOUS');
      
      return safeOpportunites.filter(opp => {
        try {
          if (!opp) return false;
          
          // Recherche textuelle sécurisée
          let matchSearch = true;
          if (safeTerm.trim()) {
            const titre = String(opp.titre || opp.description || '').toLowerCase();
            const clientName = String(opp.client?.nom || opp.client?.name || '').toLowerCase();
            const company = String(opp.client?.company || '').toLowerCase();
            
            matchSearch = titre.includes(safeTerm) || 
                         clientName.includes(safeTerm) || 
                         company.includes(safeTerm);
          }
          
          // Filtres numériques sécurisés
          const valeur = parseFloat(String(opp.valeurEstimee)) || 0;
          const matchValeur = (!filters?.valeurMin || valeur >= safeValeurMin) &&
                             (!filters?.valeurMax || valeur <= safeValeurMax);
          
          // Filtre priorité sécurisé
          const matchPriorite = safePriorite === 'TOUS' || String(opp.priorite) === safePriorite;
          
          return matchSearch && matchValeur && matchPriorite;
        } catch (error) {
          return false;
        }
      });
    } catch (error) {
      console.error('Erreur complète de filtrage:', error);
      return [];
    }
  }, [safeOpportunites, filters]);

  const getOpportunitesByStage = (stageId: string) => {
    return filteredOpportunites.filter(opp => opp.statut === stageId);
  };

  const getTotalValueByStage = (stageId: string) => {
    return getOpportunitesByStage(stageId).reduce((total, opp) => total + opp.valeurEstimee, 0);
  };

  const getWeightedValueByStage = (stageId: string) => {
    const stage = STAGES.find(s => s.id === stageId);
    if (!stage) return 0;
    return getOpportunitesByStage(stageId).reduce(
      (total, opp) => total + (opp.valeurEstimee * (stage.probability / 100)), 
      0
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      notation: amount > 999999 ? 'compact' : 'standard'
    }).format(amount);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Non définie';
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Aujourd\'hui';
    if (diffDays === 1) return 'Demain';
    if (diffDays === -1) return 'Hier';
    if (diffDays < 0) return `Retard de ${Math.abs(diffDays)} jour${Math.abs(diffDays) > 1 ? 's' : ''}`;
    if (diffDays < 7) return `Dans ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
    
    return date.toLocaleDateString('fr-FR');
  };

  const getPrioriteColor = (priorite: string) => {
    const colors = {
      CRITIQUE: 'bg-red-100 text-red-800 border-red-200',
      HAUTE: 'bg-orange-100 text-orange-800 border-orange-200',
      NORMALE: 'bg-blue-100 text-blue-800 border-blue-200',
      BASSE: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[priorite as keyof typeof colors] || colors.NORMALE;
  };

  const totalPipeline = opportunites.reduce((sum, opp) => sum + opp.valeurEstimee, 0);
  const weightedPipeline = opportunites.reduce((sum, opp) => {
    const stage = STAGES.find(s => s.id === opp.statut);
    return sum + (opp.valeurEstimee * ((stage?.probability || 0) / 100));
  }, 0);

  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen p-4">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="grid grid-cols-6 gap-4">
              {[1,2,3,4,5,6].map(i => (
                <div key={i} className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className="h-6 bg-gray-200 rounded mb-4"></div>
                  <div className="space-y-3">
                    <div className="h-20 bg-gray-100 rounded"></div>
                    <div className="h-20 bg-gray-100 rounded"></div>
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
      <div className="max-w-full mx-auto p-6">
        
        {/* Header Pipeline */}
        <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700 rounded-3xl p-8 text-white shadow-xl mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-6 mb-6 lg:mb-0">
              <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center backdrop-blur-sm border border-white/30">
                <Target size={40} />
              </div>
              <div>
                <h1 className="text-4xl font-bold mb-2">🎯 Pipeline Commercial BTP</h1>
                <p className="text-xl text-blue-100 mb-2">
                  Suivi des opportunités en temps réel
                </p>
                <div className="flex items-center gap-6 text-blue-200 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span>{opportunites.length} opportunités actives</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                    <span>{formatCurrency(totalPipeline)} de pipeline</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                    <span>{formatCurrency(weightedPipeline)} pondéré</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 bg-white/20 backdrop-blur-sm border border-white/30 text-white hover:bg-white/30"
              >
                <Filter size={20} />
                Filtres
              </Button>
              <Button 
                onClick={loadOpportunites}
                className="flex items-center gap-2 bg-white/20 backdrop-blur-sm border border-white/30 text-white hover:bg-white/30"
              >
                <RefreshCw size={20} />
                Actualiser
              </Button>
              <Link href="/dashboard/crm/opportunites/nouveau">
                <Button className="flex items-center gap-2 bg-white text-indigo-600 hover:bg-blue-50 shadow-lg">
                  <Plus size={20} />
                  Nouvelle Opportunité
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Filtres Avancés */}
        {showFilters && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Search size={20} />
              Filtres Avancés
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <Input
                placeholder="Rechercher opportunité ou client..."
                value={filters.search || ''}
                onChange={(e) => setFilters({...filters, search: e.target.value})}
              />
              <Input
                type="number"
                placeholder="Valeur min (€)"
                value={filters.valeurMin}
                onChange={(e) => setFilters({...filters, valeurMin: e.target.value})}
              />
              <Input
                type="number" 
                placeholder="Valeur max (€)"
                value={filters.valeurMax}
                onChange={(e) => setFilters({...filters, valeurMax: e.target.value})}
              />
              <select
                value={filters.priorite}
                onChange={(e) => setFilters({...filters, priorite: e.target.value})}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="TOUS">Toutes priorités</option>
                <option value="CRITIQUE">Critique</option>
                <option value="HAUTE">Haute</option>
                <option value="NORMALE">Normale</option>
                <option value="BASSE">Basse</option>
              </select>
              <Button 
                variant="outline"
                onClick={() => setFilters({search: '', client: '', valeurMin: '', valeurMax: '', priorite: 'TOUS', commercial: ''})}
              >
                🔄 Réinitialiser
              </Button>
            </div>
          </div>
        )}

        {/* Pipeline Kanban */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
          {STAGES.map((stage) => {
            const opportunitesStage = getOpportunitesByStage(stage.id);
            const totalValue = getTotalValueByStage(stage.id);
            const weightedValue = getWeightedValueByStage(stage.id);
            const StageIcon = stage.icon;

            return (
              <div
                key={stage.id}
                className={`${stage.bgColor} rounded-2xl border-2 ${stage.borderColor} min-h-[600px]`}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, stage.id as StatutOpportunite)}
              >
                {/* En-tête de colonne */}
                <div className={`bg-gradient-to-r ${stage.color} rounded-t-xl p-4 text-white`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <StageIcon size={20} />
                      <h3 className="font-bold">{stage.title}</h3>
                    </div>
                    <span className="bg-white/20 px-2 py-1 rounded-full text-sm font-bold">
                      {opportunitesStage.length}
                    </span>
                  </div>
                  <p className="text-sm text-white/80 mb-3">{stage.subtitle}</p>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-white/90">Total:</span>
                      <span className="font-semibold">{formatCurrency(totalValue)}</span>
                    </div>
                    {stage.id !== 'GAGNE' && stage.id !== 'PERDU' && (
                      <div className="flex justify-between text-sm">
                        <span className="text-white/80">Pondéré ({stage.probability}%):</span>
                        <span className="font-medium">{formatCurrency(weightedValue)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Cartes opportunités */}
                <div className="p-3 space-y-3">
                  {opportunitesStage.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <StageIcon size={32} className="mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Aucune opportunité</p>
                    </div>
                  ) : (
                    opportunitesStage.map((opportunite) => (
                      <div
                        key={opportunite.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, opportunite.id)}
                        className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all cursor-move p-4 group"
                      >
                        {/* Header carte */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 text-sm line-clamp-2 mb-1">
                              {opportunite.titre}
                            </h4>
                            <p className="text-xs text-gray-600 mb-2">{opportunite.client.nom || opportunite.client.name}</p>
                            
                            {/* Priorité */}
                            <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium border ${getPrioriteColor(opportunite.priorite)}`}>
                              {opportunite.priorite}
                            </span>
                          </div>
                          
                          <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-100 rounded">
                            <MoreVertical size={14} className="text-gray-400" />
                          </button>
                        </div>

                        {/* Valeur et probabilité */}
                        <div className="space-y-2 mb-3">
                          <div className="flex justify-between items-center">
                            <span className="text-lg font-bold text-green-600">
                              {formatCurrency(opportunite.valeurEstimee)}
                            </span>
                            <span className="text-sm text-gray-500">
                              {opportunite.probabilite}%
                            </span>
                          </div>
                          
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-green-400 to-blue-500 h-2 rounded-full transition-all"
                              style={{ width: `${opportunite.probabilite}%` }}
                            ></div>
                          </div>
                        </div>

                        {/* Informations additionnelles */}
                        <div className="space-y-2 text-xs text-gray-600">
                          {opportunite.sourceProspection && (
                            <div className="flex items-center gap-1">
                              <Target size={12} />
                              <span>{opportunite.sourceProspection}</span>
                            </div>
                          )}
                          
                          {opportunite.dateProchainSuivi && (
                            <div className="flex items-center gap-1">
                              <Clock size={12} />
                              <span>Suivi: {formatDate(opportunite.dateProchainSuivi)}</span>
                            </div>
                          )}
                          
                          {opportunite.dateCloture && (
                            <div className="flex items-center gap-1">
                              <Calendar size={12} />
                              <span>Clôture: {formatDate(opportunite.dateCloture)}</span>
                            </div>
                          )}
                        </div>

                        {/* Actions rapides */}
                        <div className="flex gap-1 mt-3 pt-3 border-t border-gray-100">
                          <button
                            onClick={() => window.open(`tel:${opportunite.client.telephoneMobile || opportunite.client.phone}`, '_self')}
                            className="flex-1 p-2 text-green-600 hover:bg-green-50 rounded transition-colors"
                            title="Appeler"
                          >
                            <Phone size={14} className="mx-auto" />
                          </button>
                          <button
                            onClick={() => window.open(`mailto:${opportunite.client.email}`, '_blank')}
                            className="flex-1 p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Email"
                          >
                            <Mail size={14} className="mx-auto" />
                          </button>
                          <Link href={`/dashboard/crm/opportunites/${opportunite.id}`}>
                            <button
                              className="flex-1 p-2 text-purple-600 hover:bg-purple-50 rounded transition-colors"
                              title="Détails"
                            >
                              <Eye size={14} className="mx-auto" />
                            </button>
                          </Link>
                          <Link href={`/dashboard/devis/nouveau?clientId=${opportunite.client.id}`}>
                            <button className="flex-1 p-2 text-orange-600 hover:bg-orange-50 rounded transition-colors"
                              title="Créer devis"
                            >
                              <DollarSign size={14} className="mx-auto" />
                            </button>
                          </Link>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Statistiques Pipeline */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 text-center">
            <div className="text-3xl font-bold text-indigo-600 mb-2">
              {opportunites.length}
            </div>
            <div className="text-gray-600">Opportunités Totales</div>
          </div>
          
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">
              {formatCurrency(totalPipeline)}
            </div>
            <div className="text-gray-600">Valeur Pipeline</div>
          </div>
          
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">
              {formatCurrency(weightedPipeline)}
            </div>
            <div className="text-gray-600">Pipeline Pondéré</div>
          </div>
          
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {opportunites.length > 0 ? Math.round(weightedPipeline / totalPipeline * 100) : 0}%
            </div>
            <div className="text-gray-600">Probabilité Moyenne</div>
          </div>
        </div>
      </div>
    </div>
  );
}