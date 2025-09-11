'use client';

import Link from 'next/link';
import { 
  Users, Target, TrendingUp, DollarSign, Calendar, Phone, Mail, 
  Building2, Clock, Plus, ArrowRight, Eye, Edit, MessageSquare,
  Briefcase, CheckCircle, AlertCircle, PlayCircle, BarChart3, Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';

interface CRMStats {
  clients: number;
  prospects: number;
  devis: number;
  chantiers: number;
  pipelineValue: number;
  conversionRate: number;
}

export default function CRMPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<CRMStats>({
    clients: 0,
    prospects: 0,
    devis: 0,
    chantiers: 0,
    pipelineValue: 0,
    conversionRate: 0
  });

  useEffect(() => {
    loadCRMData();
  }, []);

  const loadCRMData = async () => {
    try {
      setLoading(true);

      // Récupérer données en parallèle
      const [clientsRes, devisRes, chantiersRes] = await Promise.all([
        fetch('/api/users?role=CLIENT'),
        fetch('/api/devis'),
        fetch('/api/chantiers')
      ]);

      let clientsCount = 0;
      let devisData = [];
      let chantiersCount = 0;
      let pipelineValue = 0;

      if (clientsRes.ok) {
        const data = await clientsRes.json();
        clientsCount = data.pagination?.total || data.users?.length || 0;
      }

      if (devisRes.ok) {
        const data = await devisRes.json();
        devisData = data.devis || [];
        pipelineValue = devisData.reduce((total: number, devis: any) => 
          total + (devis.totalTTC || devis.montant || 0), 0
        );
      }

      if (chantiersRes.ok) {
        const data = await chantiersRes.json();
        chantiersCount = data.chantiers?.length || 0;
      }

      // Calculer prospects (estimation)
      const prospectsCount = Math.floor(clientsCount * 1.3);
      const conversionRate = clientsCount > 0 ? Math.round(chantiersCount * 100 / clientsCount) : 0;

      setStats({
        clients: clientsCount,
        prospects: prospectsCount,
        devis: devisData.length,
        chantiers: chantiersCount,
        pipelineValue,
        conversionRate
      });

    } catch (error) {
      console.error('Erreur chargement données CRM:', error);
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

  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement du CRM...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header CRM */}
        <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700 rounded-3xl p-8 text-white shadow-xl mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-6 mb-6 lg:mb-0">
              <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center backdrop-blur-sm border border-white/30">
                <BarChart3 size={40} />
              </div>
              <div>
                <h1 className="text-4xl font-bold mb-2">🎯 CRM ChantierPro</h1>
                <p className="text-xl text-blue-100 mb-2">
                  Tableau de bord commercial BTP
                </p>
                <div className="flex items-center gap-6 text-blue-200 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span>{stats.clients} clients actifs</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                    <span>{stats.prospects} prospects</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/dashboard/crm/clients">
                <Button className="flex items-center gap-2 bg-white/20 backdrop-blur-sm border border-white/30 text-white hover:bg-white/30">
                  <Plus size={20} />
                  Nouveau Client
                </Button>
              </Link>
              <Link href="/dashboard/crm/pipeline">
                <Button className="flex items-center gap-2 bg-white text-indigo-600 hover:bg-blue-50 shadow-lg">
                  <ArrowRight size={20} />
                  Pipeline
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                <Users size={24} className="text-blue-600" />
              </div>
              <span className="text-2xl font-bold text-gray-900">{stats.clients}</span>
            </div>
            <h3 className="font-semibold text-gray-900">Clients</h3>
            <p className="text-sm text-gray-600">Portefeuille actif</p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
                <DollarSign size={24} className="text-green-600" />
              </div>
              <span className="text-2xl font-bold text-gray-900">{stats.devis}</span>
            </div>
            <h3 className="font-semibold text-gray-900">Devis</h3>
            <p className="text-sm text-gray-600">En cours</p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
                <Building2 size={24} className="text-purple-600" />
              </div>
              <span className="text-2xl font-bold text-gray-900">{stats.chantiers}</span>
            </div>
            <h3 className="font-semibold text-gray-900">Chantiers</h3>
            <p className="text-sm text-gray-600">Projets actifs</p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center">
                <TrendingUp size={24} className="text-amber-600" />
              </div>
              <span className="text-2xl font-bold text-gray-900">{stats.conversionRate}%</span>
            </div>
            <h3 className="font-semibold text-gray-900">Conversion</h3>
            <p className="text-sm text-gray-600">Taux de réussite</p>
          </div>
        </div>

        {/* Navigation CRM */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
              <PlayCircle size={24} className="text-indigo-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">
              Navigation CRM
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/dashboard/crm/clients" className="group">
              <div className="p-4 border border-gray-200 rounded-xl hover:shadow-md transition-all duration-200 hover:border-indigo-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                    <Users size={20} className="text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Clients</h4>
                    <p className="text-sm text-gray-600">Gestion portefeuille</p>
                  </div>
                </div>
              </div>
            </Link>

            <Link href="/dashboard/crm/pipeline" className="group">
              <div className="p-4 border border-gray-200 rounded-xl hover:shadow-md transition-all duration-200 hover:border-indigo-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center group-hover:bg-green-100 transition-colors">
                    <Target size={20} className="text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Pipeline</h4>
                    <p className="text-sm text-gray-600">Suivi commercial</p>
                  </div>
                </div>
              </div>
            </Link>

            <Link href="/dashboard/crm/interactions" className="group">
              <div className="p-4 border border-gray-200 rounded-xl hover:shadow-md transition-all duration-200 hover:border-indigo-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center group-hover:bg-purple-100 transition-colors">
                    <MessageSquare size={20} className="text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Interactions</h4>
                    <p className="text-sm text-gray-600">Historique client</p>
                  </div>
                </div>
              </div>
            </Link>

            <Link href="/dashboard/crm/analytics" className="group">
              <div className="p-4 border border-gray-200 rounded-xl hover:shadow-md transition-all duration-200 hover:border-indigo-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center group-hover:bg-amber-100 transition-colors">
                    <BarChart3 size={20} className="text-amber-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Analytics</h4>
                    <p className="text-sm text-gray-600">Tableau de bord</p>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* KPIs */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">Pipeline Commercial</h3>
            <span className="text-3xl font-bold text-green-600">
              {formatCurrency(stats.pipelineValue)}
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 mb-1">{stats.prospects}</div>
              <div className="text-sm text-gray-600">Prospects qualifiés</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 mb-1">{stats.devis}</div>
              <div className="text-sm text-gray-600">Devis en cours</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 mb-1">{stats.chantiers}</div>
              <div className="text-sm text-gray-600">Chantiers signés</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}