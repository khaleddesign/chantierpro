"use client";

import { useState, useEffect } from "react";
import { 
  BarChart3, TrendingUp, TrendingDown, DollarSign, 
  Building, Users, Calendar, Download, Filter, 
  FileText, PieChart, Activity, ArrowUpRight 
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string;
    borderColor?: string;
  }[];
}

interface ReportMetrics {
  totalRevenue: number;
  totalChantiers: number;
  totalClients: number;
  avgProjectValue: number;
  monthlyGrowth: number;
  completionRate: number;
  pendingPayments: number;
  activeProjects: number;
}

interface MonthlyData {
  month: string;
  revenue: number;
  projects: number;
  clients: number;
}

export default function ReportsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [reportType, setReportType] = useState<'overview' | 'financial' | 'projects' | 'clients'>('overview');

  // Données simulées pour les rapports
  const mockMetrics: ReportMetrics = {
    totalRevenue: 485000,
    totalChantiers: 24,
    totalClients: 18,
    avgProjectValue: 20208,
    monthlyGrowth: 12.5,
    completionRate: 87.5,
    pendingPayments: 65000,
    activeProjects: 8
  };

  const mockMonthlyData: MonthlyData[] = [
    { month: 'Jan', revenue: 35000, projects: 3, clients: 2 },
    { month: 'Fév', revenue: 42000, projects: 4, clients: 3 },
    { month: 'Mar', revenue: 38000, projects: 2, clients: 1 },
    { month: 'Avr', revenue: 55000, projects: 5, clients: 4 },
    { month: 'Mai', revenue: 48000, projects: 3, clients: 2 },
    { month: 'Juin', revenue: 67000, projects: 7, clients: 5 },
  ];

  const [metrics, setMetrics] = useState<ReportMetrics>(mockMetrics);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>(mockMonthlyData);

  useEffect(() => {
    // Simuler le chargement des données
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, [selectedPeriod]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const periodLabels = {
    '7d': 'Derniers 7 jours',
    '30d': 'Derniers 30 jours',
    '90d': 'Derniers 3 mois',
    '1y': 'Dernière année'
  };

  const generateReport = () => {
    // Simuler la génération d'un rapport
    alert('Génération du rapport PDF en cours...');
  };

  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg p-6 border h-32"></div>
              ))}
            </div>
            <div className="bg-white rounded-lg p-6 border h-96"></div>
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Rapports & Analyses</h1>
            <p className="text-gray-500">
              Visualisez vos performances et suivez vos indicateurs clés
            </p>
          </div>
          <Button onClick={generateReport} className="flex items-center gap-2">
            <Download size={18} />
            Exporter PDF
          </Button>
        </div>

        {/* Filtres */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-8">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar size={18} className="text-gray-400" />
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {Object.entries(periodLabels).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <Filter size={18} className="text-gray-400" />
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="overview">Vue d'ensemble</option>
                <option value="financial">Financier</option>
                <option value="projects">Projets</option>
                <option value="clients">Clients</option>
              </select>
            </div>
          </div>
        </div>

        {/* Métriques principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign size={24} className="text-green-600" />
              </div>
              <div className="flex items-center text-sm text-green-600">
                <TrendingUp size={16} className="mr-1" />
                {formatPercentage(metrics.monthlyGrowth)}
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {formatCurrency(metrics.totalRevenue)}
            </div>
            <div className="text-sm text-gray-500">Chiffre d'affaires total</div>
          </div>

          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Building size={24} className="text-blue-600" />
              </div>
              <div className="flex items-center text-sm text-green-600">
                <TrendingUp size={16} className="mr-1" />
                +8%
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {metrics.totalChantiers}
            </div>
            <div className="text-sm text-gray-500">Chantiers réalisés</div>
          </div>

          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users size={24} className="text-purple-600" />
              </div>
              <div className="flex items-center text-sm text-green-600">
                <TrendingUp size={16} className="mr-1" />
                +15%
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {metrics.totalClients}
            </div>
            <div className="text-sm text-gray-500">Clients actifs</div>
          </div>

          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Activity size={24} className="text-orange-600" />
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <span>{formatPercentage(metrics.completionRate - 100)}</span>
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {formatCurrency(metrics.avgProjectValue)}
            </div>
            <div className="text-sm text-gray-500">Valeur moyenne par projet</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Évolution du CA */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Évolution du Chiffre d'Affaires</h3>
              <BarChart3 size={20} className="text-gray-400" />
            </div>
            
            <div className="space-y-4">
              {monthlyData.map((data, index) => (
                <div key={data.month} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-sm font-medium text-gray-600 w-8">
                      {data.month}
                    </div>
                    <div className="flex-1 bg-gray-200 rounded-full h-2 min-w-32">
                      <div 
                        className="bg-indigo-600 h-2 rounded-full"
                        style={{ width: `${(data.revenue / Math.max(...monthlyData.map(d => d.revenue))) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-gray-900 text-right">
                    {formatCurrency(data.revenue)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Répartition par statut */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Répartition des Projets</h3>
              <PieChart size={20} className="text-gray-400" />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium text-gray-700">Terminés</span>
                </div>
                <div className="text-sm font-semibold text-green-700">
                  {Math.round(metrics.completionRate)}% (21 projets)
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-sm font-medium text-gray-700">En cours</span>
                </div>
                <div className="text-sm font-semibold text-blue-700">
                  33% ({metrics.activeProjects} projets)
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                  <span className="text-sm font-medium text-gray-700">Planifiés</span>
                </div>
                <div className="text-sm font-semibold text-orange-700">
                  12% (3 projets)
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tableaux détaillés */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Clients */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Top Clients</h3>
              <ArrowUpRight size={20} className="text-gray-400" />
            </div>

            <div className="space-y-4">
              {[
                { name: 'Sophie Durand', projects: 3, revenue: 87000 },
                { name: 'Pierre Leroy', projects: 2, revenue: 65000 },
                { name: 'Marie Dubois', projects: 2, revenue: 42000 },
                { name: 'Jean Martin', projects: 1, revenue: 38000 },
                { name: 'Paul Moreau', projects: 1, revenue: 25000 },
              ].map((client, index) => (
                <div key={index} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                      {client.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{client.name}</div>
                      <div className="text-xs text-gray-500">{client.projects} projet{client.projects > 1 ? 's' : ''}</div>
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-gray-900">
                    {formatCurrency(client.revenue)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Indicateurs financiers */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Indicateurs Financiers</h3>
              <FileText size={20} className="text-gray-400" />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 border-b border-gray-100">
                <span className="text-sm text-gray-600">Taux de marge moyenne</span>
                <span className="text-sm font-semibold text-green-600">25.8%</span>
              </div>
              
              <div className="flex items-center justify-between p-3 border-b border-gray-100">
                <span className="text-sm text-gray-600">Paiements en attente</span>
                <span className="text-sm font-semibold text-orange-600">
                  {formatCurrency(metrics.pendingPayments)}
                </span>
              </div>
              
              <div className="flex items-center justify-between p-3 border-b border-gray-100">
                <span className="text-sm text-gray-600">Délai de paiement moyen</span>
                <span className="text-sm font-semibold text-gray-900">28 jours</span>
              </div>
              
              <div className="flex items-center justify-between p-3 border-b border-gray-100">
                <span className="text-sm text-gray-600">Taux de conversion devis</span>
                <span className="text-sm font-semibold text-blue-600">72%</span>
              </div>
              
              <div className="flex items-center justify-between p-3">
                <span className="text-sm text-gray-600">Croissance mensuelle</span>
                <span className="text-sm font-semibold text-green-600">
                  {formatPercentage(metrics.monthlyGrowth)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}