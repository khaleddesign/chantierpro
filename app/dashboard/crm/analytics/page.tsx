'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  BarChart3, TrendingUp, Users, DollarSign, Target, Calendar,
  PieChart, Activity, Award, Clock, ArrowUp, ArrowDown,
  Eye, Download, Filter, RefreshCw, Star, Building,
  Phone, Mail, MapPin, Briefcase, CheckCircle, AlertTriangle
} from 'lucide-react';

interface AnalyticsCRM {
  periode: string;
  
  // KPIs Clients
  totalClients: number;
  nouveauxClients: number;
  clientsActifs: number;
  tauxRetention: number;
  
  // KPIs Commerciaux
  totalOpportunites: number;
  pipelineValue: number;
  devisEnvoyes: number;
  tauxConversion: number;
  ticketMoyen: number;
  
  // KPIs Performance
  nbInteractions: number;
  tempsReponse: number;
  satisfactionClient: number;
  
  // Évolutions
  evolutionClients: number;
  evolutionPipeline: number;
  evolutionConversion: number;
  
  // Détails par source
  sourceProspects: Array<{
    source: string;
    nombre: number;
    tauxConversion: number;
    valeurMoyenne: number;
  }>;
  
  // Détails par commercial
  performanceCommerciale: Array<{
    commercial: string;
    nbClients: number;
    pipelineValue: number;
    tauxConversion: number;
    objectifMensuel: number;
  }>;
  
  // Répartition par type de client
  repartitionClients: Array<{
    type: string;
    nombre: number;
    pourcentage: number;
    chiffreAffaires: number;
  }>;
}

export default function AnalyticsCRMPage() {
  const [analytics, setAnalytics] = useState<AnalyticsCRM | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('30j');
  const [selectedView, setSelectedView] = useState<'overview' | 'commercial' | 'clients' | 'performance'>('overview');

  useEffect(() => {
    loadAnalytics();
  }, [selectedPeriod]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      
      // Récupération des vraies analytics via l'API CRM
      const response = await fetch(`/api/crm/analytics?periode=${selectedPeriod}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('API Analytics Response:', data);
        setAnalytics(data);
        console.log('Analytics loaded');
      } else {
        console.error('API Error:', response.status, response.statusText);
        
        // Fallback: données d'exemple si l'API échoue
        const mockAnalytics: AnalyticsCRM = {
        periode: selectedPeriod,
        
        // KPIs Clients
        totalClients: 247,
        nouveauxClients: 18,
        clientsActifs: 156,
        tauxRetention: 87.3,
        
        // KPIs Commerciaux  
        totalOpportunites: 42,
        pipelineValue: 1250000,
        devisEnvoyes: 28,
        tauxConversion: 23.5,
        ticketMoyen: 35000,
        
        // KPIs Performance
        nbInteractions: 312,
        tempsReponse: 2.4, // heures
        satisfactionClient: 4.6, // sur 5
        
        // Évolutions (%)
        evolutionClients: +12.3,
        evolutionPipeline: +8.7,
        evolutionConversion: -2.1,
        
        // Sources prospects
        sourceProspects: [
          { source: 'Site Web', nombre: 45, tauxConversion: 28.9, valeurMoyenne: 42000 },
          { source: 'Recommandation', nombre: 32, tauxConversion: 34.4, valeurMoyenne: 38000 },
          { source: 'Publicité Facebook', nombre: 28, tauxConversion: 21.4, valeurMoyenne: 31000 },
          { source: 'Pages Jaunes', nombre: 15, tauxConversion: 13.3, valeurMoyenne: 25000 },
          { source: 'Salons BTP', nombre: 12, tauxConversion: 41.7, valeurMoyenne: 55000 },
          { source: 'Bouche à oreille', nombre: 38, tauxConversion: 39.5, valeurMoyenne: 47000 }
        ],
        
        // Performance commerciale
        performanceCommerciale: [
          { commercial: 'Jean-Pierre Martin', nbClients: 87, pipelineValue: 485000, tauxConversion: 28.7, objectifMensuel: 400000 },
          { commercial: 'Marie Leclerc', nbClients: 65, pipelineValue: 380000, tauxConversion: 31.2, objectifMensuel: 350000 },
          { commercial: 'Julien Dubois', nbClients: 43, pipelineValue: 245000, tauxConversion: 19.4, objectifMensuel: 250000 },
          { commercial: 'Sophie Bernard', nbClients: 52, pipelineValue: 140000, tauxConversion: 15.8, objectifMensuel: 200000 }
        ],
        
        // Répartition clients
        repartitionClients: [
          { type: 'PARTICULIER', nombre: 145, pourcentage: 58.7, chiffreAffaires: 3250000 },
          { type: 'PROFESSIONNEL', nombre: 68, pourcentage: 27.5, chiffreAffaires: 4150000 },
          { type: 'SYNDIC', nombre: 23, pourcentage: 9.3, chiffreAffaires: 1850000 },
          { type: 'PROMOTEUR', nombre: 11, pourcentage: 4.5, chiffreAffaires: 2100000 }
        ]
      };
      
        setAnalytics(mockAnalytics);
      }
    } catch (error) {
      console.error('Erreur chargement analytics:', error);
      setAnalytics(null);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      notation: amount > 999999 ? 'compact' : 'standard'
    }).format(amount);
  };

  const formatPercent = (value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const getEvolutionColor = (value: number) => {
    return value >= 0 ? 'text-green-600' : 'text-red-600';
  };

  const getEvolutionIcon = (value: number) => {
    return value >= 0 ? ArrowUp : ArrowDown;
  };

  const getPeriodLabel = (period: string) => {
    const labels = {
      '7j': '7 derniers jours',
      '30j': '30 derniers jours', 
      '3m': '3 derniers mois',
      '6m': '6 derniers mois',
      '1a': '12 derniers mois'
    };
    return labels[period as keyof typeof labels] || period;
  };

  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen p-4">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-8">
            <div className="h-12 bg-gray-200 rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1,2,3,4].map(i => (
                <div key={i} className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="h-16 bg-gray-200 rounded mb-4"></div>
                  <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[1,2,3,4].map(i => (
                <div key={i} className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="h-64 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!analytics) return null;

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto p-6">
        
        {/* Header Analytics */}
        <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700 rounded-3xl p-8 text-white shadow-xl mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-6 mb-6 lg:mb-0">
              <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center backdrop-blur-sm border border-white/30">
                <BarChart3 size={40} />
              </div>
              <div>
                <h1 className="text-4xl font-bold mb-2">📊 Analytics CRM</h1>
                <p className="text-xl text-blue-100 mb-2">
                  Tableaux de bord et analyses de performance
                </p>
                <div className="flex items-center gap-6 text-blue-200 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span>{analytics.totalClients} clients</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                    <span>{formatCurrency(analytics.pipelineValue)} pipeline</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                    <span>{analytics.tauxConversion}% conversion</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="px-4 py-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/50"
              >
                <option value="7j" className="text-gray-900">7 derniers jours</option>
                <option value="30j" className="text-gray-900">30 derniers jours</option>
                <option value="3m" className="text-gray-900">3 derniers mois</option>
                <option value="6m" className="text-gray-900">6 derniers mois</option>
                <option value="1a" className="text-gray-900">12 derniers mois</option>
              </select>
              
              <Button 
                onClick={loadAnalytics}
                className="flex items-center gap-2 bg-white/20 backdrop-blur-sm border border-white/30 text-white hover:bg-white/30"
              >
                <RefreshCw size={20} />
                Actualiser
              </Button>
              
              <Button 
                className="flex items-center gap-2 bg-white text-indigo-600 hover:bg-blue-50 shadow-lg"
              >
                <Download size={20} />
                Export PDF
              </Button>
            </div>
          </div>
        </div>

        {/* Navigation Vues */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm mb-8">
          <div className="flex border-b border-gray-200 overflow-x-auto">
            {[
              { id: 'overview', label: '📊 Vue d\'ensemble', icon: BarChart3 },
              { id: 'commercial', label: '🎯 Commercial', icon: Target },
              { id: 'clients', label: '👥 Clients', icon: Users },
              { id: 'performance', label: '⚡ Performance', icon: Activity }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedView(tab.id as any)}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  selectedView === tab.id
                    ? 'border-indigo-500 text-indigo-600 bg-indigo-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Vue d'ensemble */}
        {selectedView === 'overview' && (
          <div className="space-y-8">
            
            {/* KPIs Principaux */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Users size={24} className="text-blue-600" />
                  </div>
                  <div className="flex items-center gap-1 text-sm">
                    {(() => {
                      const EvolutionIcon = getEvolutionIcon(analytics.evolutionClients);
                      return (
                        <>
                          <EvolutionIcon size={16} className={getEvolutionColor(analytics.evolutionClients)} />
                          <span className={getEvolutionColor(analytics.evolutionClients)}>
                            {formatPercent(analytics.evolutionClients)}
                          </span>
                        </>
                      );
                    })()}
                  </div>
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  {analytics.totalClients}
                </div>
                <div className="text-gray-600 text-sm">
                  Clients totaux • {analytics.nouveauxClients} nouveaux
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <DollarSign size={24} className="text-green-600" />
                  </div>
                  <div className="flex items-center gap-1 text-sm">
                    {(() => {
                      const EvolutionIcon = getEvolutionIcon(analytics.evolutionPipeline);
                      return (
                        <>
                          <EvolutionIcon size={16} className={getEvolutionColor(analytics.evolutionPipeline)} />
                          <span className={getEvolutionColor(analytics.evolutionPipeline)}>
                            {formatPercent(analytics.evolutionPipeline)}
                          </span>
                        </>
                      );
                    })()}
                  </div>
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  {formatCurrency(analytics.pipelineValue)}
                </div>
                <div className="text-gray-600 text-sm">
                  Pipeline commercial • {analytics.totalOpportunites} opportunités
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                    <Target size={24} className="text-purple-600" />
                  </div>
                  <div className="flex items-center gap-1 text-sm">
                    {(() => {
                      const EvolutionIcon = getEvolutionIcon(analytics.evolutionConversion);
                      return (
                        <>
                          <EvolutionIcon size={16} className={getEvolutionColor(analytics.evolutionConversion)} />
                          <span className={getEvolutionColor(analytics.evolutionConversion)}>
                            {formatPercent(analytics.evolutionConversion)}
                          </span>
                        </>
                      );
                    })()}
                  </div>
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  {analytics.tauxConversion}%
                </div>
                <div className="text-gray-600 text-sm">
                  Taux de conversion • {analytics.devisEnvoyes} devis envoyés
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                    <Star size={24} className="text-orange-600" />
                  </div>
                  <div className="text-sm text-gray-500">
                    /5 ⭐
                  </div>
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  {analytics.satisfactionClient}
                </div>
                <div className="text-gray-600 text-sm">
                  Satisfaction client • {analytics.tempsReponse}h réponse moy.
                </div>
              </div>
            </div>

            {/* Graphiques principaux */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Sources de prospects */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold">📈 Sources de Prospects</h3>
                  <div className="text-sm text-gray-500">{getPeriodLabel(selectedPeriod)}</div>
                </div>
                
                <div className="space-y-4">
                  {analytics.sourceProspects
                    .sort((a, b) => b.nombre - a.nombre)
                    .map((source, index) => (
                      <div key={index} className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-medium text-gray-900">{source.source}</div>
                          <div className="text-lg font-bold text-indigo-600">{source.nombre}</div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                          <div>
                            <span>Conversion: </span>
                            <span className="font-medium">{source.tauxConversion.toFixed(1)}%</span>
                          </div>
                          <div>
                            <span>Valeur moy: </span>
                            <span className="font-medium">{formatCurrency(source.valeurMoyenne)}</span>
                          </div>
                        </div>
                        <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="h-2 rounded-full bg-indigo-500"
                            style={{ width: `${(source.nombre / Math.max(...analytics.sourceProspects.map(s => s.nombre))) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))
                  }
                </div>
              </div>

              {/* Répartition par type de client */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold">👥 Répartition Clients</h3>
                  <div className="text-sm text-gray-500">Par type</div>
                </div>
                
                <div className="space-y-4">
                  {analytics.repartitionClients.map((type, index) => {
                    const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500'];
                    const bgColors = ['bg-blue-100', 'bg-green-100', 'bg-purple-100', 'bg-orange-100'];
                    const textColors = ['text-blue-700', 'text-green-700', 'text-purple-700', 'text-orange-700'];
                    
                    return (
                      <div key={index} className={`p-4 ${bgColors[index]} rounded-lg`}>
                        <div className="flex items-center justify-between mb-2">
                          <div className={`font-semibold ${textColors[index]}`}>{type.type}</div>
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-bold">{type.nombre}</span>
                            <span className="text-sm text-gray-600">({type.pourcentage}%)</span>
                          </div>
                        </div>
                        <div className="text-sm text-gray-700 mb-2">
                          CA: {formatCurrency(type.chiffreAffaires)}
                        </div>
                        <div className="w-full bg-white/50 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${colors[index]}`}
                            style={{ width: `${type.pourcentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Vue Commercial */}
        {selectedView === 'commercial' && (
          <div className="space-y-8">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">🎯 Performance par Commercial</h3>
                <div className="text-sm text-gray-500">{getPeriodLabel(selectedPeriod)}</div>
              </div>
              
              <div className="grid gap-6">
                {analytics.performanceCommerciale.map((commercial, index) => {
                  const progressionObjectif = (commercial.pipelineValue / commercial.objectifMensuel) * 100;
                  const couleurProgression = progressionObjectif >= 100 ? 'bg-green-500' : 
                                           progressionObjectif >= 75 ? 'bg-yellow-500' : 'bg-red-500';
                  
                  return (
                    <div key={index} className="border border-gray-200 rounded-xl p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xl font-bold">
                            {commercial.commercial.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900">{commercial.commercial}</h4>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <span>{commercial.nbClients} clients</span>
                              <span>•</span>
                              <span>{commercial.tauxConversion}% conversion</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="text-2xl font-bold text-green-600">
                            {formatCurrency(commercial.pipelineValue)}
                          </div>
                          <div className="text-sm text-gray-500">
                            Objectif: {formatCurrency(commercial.objectifMensuel)}
                          </div>
                        </div>
                      </div>
                      
                      <div className="mb-3">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-gray-700">Progression de l'objectif</span>
                          <span className={`text-sm font-semibold ${progressionObjectif >= 100 ? 'text-green-600' : progressionObjectif >= 75 ? 'text-yellow-600' : 'text-red-600'}`}>
                            {progressionObjectif.toFixed(0)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div 
                            className={`h-3 rounded-full ${couleurProgression} transition-all duration-300`}
                            style={{ width: `${Math.min(progressionObjectif, 100)}%` }}
                          />
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center text-sm text-gray-600">
                        <span>Reste à faire: {formatCurrency(Math.max(0, commercial.objectifMensuel - commercial.pipelineValue))}</span>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Eye size={14} className="mr-1" />
                            Détails
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Vue Clients */}
        {selectedView === 'clients' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Users size={24} className="text-blue-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">{analytics.clientsActifs}</div>
                    <div className="text-sm text-gray-600">Clients actifs</div>
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  Sur {analytics.totalClients} clients totaux
                </div>
              </div>
              
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <TrendingUp size={24} className="text-green-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">{analytics.tauxRetention}%</div>
                    <div className="text-sm text-gray-600">Rétention</div>
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  Taux de fidélisation client
                </div>
              </div>
              
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                    <DollarSign size={24} className="text-purple-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">{formatCurrency(analytics.ticketMoyen)}</div>
                    <div className="text-sm text-gray-600">Ticket moyen</div>
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  Valeur moyenne par projet
                </div>
              </div>
            </div>
            
            {/* Détail répartition clients */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-6">📊 Analyse détaillée par segment</h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {analytics.repartitionClients.map((segment, index) => {
                  const colors = ['from-blue-500 to-blue-600', 'from-green-500 to-green-600', 'from-purple-500 to-purple-600', 'from-orange-500 to-orange-600'];
                  const icons = [Users, Building, Briefcase, Award];
                  const IconComponent = icons[index];
                  
                  return (
                    <div key={index} className="border border-gray-200 rounded-xl p-6">
                      <div className="flex items-center gap-4 mb-4">
                        <div className={`w-14 h-14 bg-gradient-to-r ${colors[index]} rounded-xl flex items-center justify-center text-white`}>
                          <IconComponent size={24} />
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900">{segment.type}</h4>
                          <div className="text-sm text-gray-600">{segment.pourcentage}% du portefeuille</div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-2xl font-bold text-gray-900">{segment.nombre}</div>
                          <div className="text-sm text-gray-600">Clients</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-green-600">{formatCurrency(segment.chiffreAffaires)}</div>
                          <div className="text-sm text-gray-600">Chiffre d'affaires</div>
                        </div>
                      </div>
                      
                      <div className="mt-4">
                        <div className="text-sm text-gray-600 mb-2">CA moyen par client</div>
                        <div className="text-lg font-semibold text-indigo-600">
                          {formatCurrency(segment.chiffreAffaires / segment.nombre)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Vue Performance */}
        {selectedView === 'performance' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                    <Activity size={24} className="text-indigo-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">{analytics.nbInteractions}</div>
                    <div className="text-sm text-gray-600">Interactions</div>
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  Contacts clients {getPeriodLabel(selectedPeriod)}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                    <Clock size={24} className="text-orange-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">{analytics.tempsReponse}h</div>
                    <div className="text-sm text-gray-600">Temps réponse</div>
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  Délai moyen de réponse client
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <CheckCircle size={24} className="text-green-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">{analytics.devisEnvoyes}</div>
                    <div className="text-sm text-gray-600">Devis envoyés</div>
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  Propositions commerciales
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                    <AlertTriangle size={24} className="text-red-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">3</div>
                    <div className="text-sm text-gray-600">Alertes actives</div>
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  Nécessitent une attention
                </div>
              </div>
            </div>

            {/* Métriques détaillées */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-6">⚡ Métriques de Performance Détaillées</h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-4">📞 Activité Commerciale</h4>
                  <div className="space-y-4">
                    {[
                      { label: 'Appels passés', value: 156, max: 200, color: 'bg-blue-500' },
                      { label: 'Emails envoyés', value: 89, max: 120, color: 'bg-green-500' },
                      { label: 'Rendez-vous fixés', value: 23, max: 30, color: 'bg-purple-500' },
                      { label: 'Visites réalisées', value: 18, max: 25, color: 'bg-orange-500' }
                    ].map((metric, index) => (
                      <div key={index}>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-gray-700">{metric.label}</span>
                          <span className="text-sm text-gray-600">{metric.value}/{metric.max}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${metric.color}`}
                            style={{ width: `${(metric.value / metric.max) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-900 mb-4">🎯 Objectifs & Résultats</h4>
                  <div className="space-y-4">
                    {[
                      { label: 'Nouveaux clients', value: 18, objectif: 20, unite: '' },
                      { label: 'CA mensuel', value: 485000, objectif: 500000, unite: '€' },
                      { label: 'Taux conversion', value: 23.5, objectif: 25, unite: '%' },
                      { label: 'Satisfaction client', value: 4.6, objectif: 4.5, unite: '/5' }
                    ].map((metric, index) => {
                      const progression = (metric.value / metric.objectif) * 100;
                      const couleur = progression >= 100 ? 'text-green-600' : progression >= 75 ? 'text-yellow-600' : 'text-red-600';
                      
                      return (
                        <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <div>
                            <div className="font-medium text-gray-900">{metric.label}</div>
                            <div className="text-sm text-gray-600">
                              Objectif: {metric.unite === '€' ? formatCurrency(metric.objectif) : `${metric.objectif}${metric.unite}`}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`text-lg font-bold ${couleur}`}>
                              {metric.unite === '€' ? formatCurrency(metric.value) : `${metric.value}${metric.unite}`}
                            </div>
                            <div className={`text-sm ${couleur}`}>
                              {progression.toFixed(0)}%
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}