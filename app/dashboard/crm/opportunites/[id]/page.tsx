'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, Edit, Trash2, Phone, Mail, Building, 
  User, DollarSign, Calendar, Target, Clock, 
  TrendingUp, AlertCircle, CheckCircle2, Star,
  FileText, MessageSquare, Plus, History, Briefcase
} from 'lucide-react';
import Link from 'next/link';

interface Opportunite {
  id: string;
  titre: string;
  description: string;
  valeurEstimee: number;
  probabilite: number;
  statut: string;
  dateCloture?: string;
  dateCloturePrevisionnelle?: string;
  dateProchainSuivi?: string;
  sourceProspection?: string;
  concurrents?: string;
  motifRefus?: string;
  priorite: string;
  typeProjet?: string;
  budgetClient?: number;
  delaiSouhaite?: string;
  createdAt: string;
  updatedAt: string;
  client: {
    id: string;
    nom?: string;
    name?: string;
    email: string;
    company?: string;
    phone?: string;
    telephoneMobile?: string;
    typeClient?: string;
    secteurActivite?: string;
  };
  historique?: Array<{
    id: string;
    action: string;
    userName: string;
    createdAt: string;
  }>;
  relances?: Array<{
    id: string;
    dateRelance: string;
    typeRelance: string;
    statut: string;
    commentaire: string;
  }>;
  taches?: Array<{
    id: string;
    titre: string;
    description: string;
    dateEcheance: string;
    statut: string;
    priorite: string;
  }>;
}

const STATUT_CONFIG = {
  PROSPECT: { 
    label: 'Prospect', 
    color: 'from-slate-500 to-slate-600', 
    bgColor: 'bg-slate-50', 
    icon: Target,
    probability: 20
  },
  QUALIFIE: { 
    label: 'Qualifié', 
    color: 'from-blue-500 to-blue-600', 
    bgColor: 'bg-blue-50', 
    icon: User,
    probability: 40
  },
  PROPOSITION: { 
    label: 'Proposition', 
    color: 'from-amber-500 to-amber-600', 
    bgColor: 'bg-amber-50', 
    icon: DollarSign,
    probability: 60
  },
  NEGOCIATION: { 
    label: 'Négociation', 
    color: 'from-purple-500 to-purple-600', 
    bgColor: 'bg-purple-50', 
    icon: TrendingUp,
    probability: 80
  },
  GAGNE: { 
    label: 'Gagné', 
    color: 'from-green-500 to-green-600', 
    bgColor: 'bg-green-50', 
    icon: CheckCircle2,
    probability: 100
  },
  PERDU: { 
    label: 'Perdu', 
    color: 'from-red-500 to-red-600', 
    bgColor: 'bg-red-50', 
    icon: AlertCircle,
    probability: 0
  }
};

const PRIORITE_CONFIG = {
  CRITIQUE: { label: 'Critique', color: 'bg-red-100 text-red-800 border-red-200' },
  HAUTE: { label: 'Haute', color: 'bg-orange-100 text-orange-800 border-orange-200' },
  NORMALE: { label: 'Normale', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  BASSE: { label: 'Basse', color: 'bg-gray-100 text-gray-800 border-gray-200' }
};

export default function OpportuniteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const opportuniteId = params.id as string;
  
  const [opportunite, setOpportunite] = useState<Opportunite | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'tasks' | 'relances'>('overview');

  useEffect(() => {
    if (opportuniteId) {
      loadOpportunite();
    }
  }, [opportuniteId]);

  const loadOpportunite = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/crm/opportunites/${opportuniteId}`);
      
      if (response.ok) {
        const data = await response.json();
        setOpportunite(data);
      } else {
        setError('Opportunité non trouvée');
      }
    } catch (error) {
      console.error('Erreur chargement opportunité:', error);
      setError('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette opportunité ?')) {
      return;
    }

    try {
      const response = await fetch(`/api/crm/opportunites/${opportuniteId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        router.push('/dashboard/crm/pipeline');
      } else {
        alert('Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Erreur suppression:', error);
      alert('Erreur lors de la suppression');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      notation: amount > 999999 ? 'compact' : 'standard'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="bg-white rounded-2xl border border-gray-200 p-8">
              <div className="space-y-4">
                <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !opportunite) {
    return (
      <div className="bg-gray-50 min-h-screen p-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <AlertCircle size={64} className="mx-auto text-gray-400 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Opportunité non trouvée</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <Link href="/dashboard/crm/pipeline">
              <Button>
                <ArrowLeft size={16} className="mr-2" />
                Retour au pipeline
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const statutConfig = STATUT_CONFIG[opportunite.statut as keyof typeof STATUT_CONFIG];
  const prioriteConfig = PRIORITE_CONFIG[opportunite.priorite as keyof typeof PRIORITE_CONFIG];
  const StatutIcon = statutConfig.icon;

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto p-6">
        
        {/* Header */}
        <div className={`bg-gradient-to-r ${statutConfig.color} rounded-3xl p-8 text-white shadow-xl mb-8`}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Link href="/dashboard/crm/pipeline">
                <Button className="bg-white/20 backdrop-blur-sm border border-white/30 text-white hover:bg-white/30">
                  <ArrowLeft size={20} />
                </Button>
              </Link>
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/30">
                <StatutIcon size={32} />
              </div>
              <div>
                <h1 className="text-3xl font-bold mb-2">{opportunite.titre}</h1>
                <div className="flex items-center gap-4 text-white/90">
                  <span className="flex items-center gap-2">
                    <User size={16} />
                    {opportunite.client.nom || opportunite.client.name}
                  </span>
                  {opportunite.client.company && (
                    <span className="flex items-center gap-2">
                      <Building size={16} />
                      {opportunite.client.company}
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button className="bg-white/20 backdrop-blur-sm border border-white/30 text-white hover:bg-white/30">
                <Edit size={20} className="mr-2" />
                Modifier
              </Button>
              <Button 
                onClick={handleDelete}
                className="bg-red-500/80 backdrop-blur-sm border border-red-400/50 text-white hover:bg-red-600/80"
              >
                <Trash2 size={20} className="mr-2" />
                Supprimer
              </Button>
            </div>
          </div>

          {/* Métriques principales */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="text-2xl font-bold mb-1">{formatCurrency(opportunite.valeurEstimee)}</div>
              <div className="text-sm text-white/80">Valeur estimée</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="text-2xl font-bold mb-1">{opportunite.probabilite}%</div>
              <div className="text-sm text-white/80">Probabilité</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="text-2xl font-bold mb-1">{statutConfig.label}</div>
              <div className="text-sm text-white/80">Statut</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="text-2xl font-bold mb-1">{prioriteConfig.label}</div>
              <div className="text-sm text-white/80">Priorité</div>
            </div>
          </div>
        </div>

        {/* Navigation des onglets */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm mb-6">
          <div className="flex border-b border-gray-200">
            {[
              { id: 'overview', label: 'Vue d\'ensemble', icon: Target },
              { id: 'history', label: 'Historique', icon: History },
              { id: 'tasks', label: 'Tâches', icon: CheckCircle2 },
              { id: 'relances', label: 'Relances', icon: MessageSquare }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50/50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <tab.icon size={20} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Contenu des onglets */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Informations principales */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4">Description du projet</h3>
                <p className="text-gray-700 leading-relaxed">
                  {opportunite.description || 'Aucune description fournie.'}
                </p>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4">Détails commerciaux</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {opportunite.typeProjet && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Type de projet</label>
                      <div className="mt-1 text-gray-900">{opportunite.typeProjet}</div>
                    </div>
                  )}
                  {opportunite.budgetClient && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Budget client</label>
                      <div className="mt-1 text-gray-900">{formatCurrency(opportunite.budgetClient)}</div>
                    </div>
                  )}
                  {opportunite.sourceProspection && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Source</label>
                      <div className="mt-1 text-gray-900">{opportunite.sourceProspection}</div>
                    </div>
                  )}
                  {opportunite.delaiSouhaite && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Délai souhaité</label>
                      <div className="mt-1 text-gray-900">{opportunite.delaiSouhaite}</div>
                    </div>
                  )}
                  {opportunite.concurrents && (
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium text-gray-500">Concurrents</label>
                      <div className="mt-1 text-gray-900">{opportunite.concurrents}</div>
                    </div>
                  )}
                  {opportunite.motifRefus && (
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium text-gray-500">Motif de refus</label>
                      <div className="mt-1 text-red-600">{opportunite.motifRefus}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              
              {/* Informations client */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4">Client</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <User size={20} className="text-gray-400" />
                    <div>
                      <div className="font-medium">{opportunite.client.nom || opportunite.client.name}</div>
                      {opportunite.client.typeClient && (
                        <div className="text-sm text-gray-500">{opportunite.client.typeClient}</div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Mail size={20} className="text-gray-400" />
                    <a href={`mailto:${opportunite.client.email}`} className="text-blue-600 hover:underline">
                      {opportunite.client.email}
                    </a>
                  </div>
                  
                  {(opportunite.client.telephoneMobile || opportunite.client.phone) && (
                    <div className="flex items-center gap-3">
                      <Phone size={20} className="text-gray-400" />
                      <a href={`tel:${opportunite.client.telephoneMobile || opportunite.client.phone}`} className="text-blue-600 hover:underline">
                        {opportunite.client.telephoneMobile || opportunite.client.phone}
                      </a>
                    </div>
                  )}
                  
                  {opportunite.client.company && (
                    <div className="flex items-center gap-3">
                      <Building size={20} className="text-gray-400" />
                      <div>{opportunite.client.company}</div>
                    </div>
                  )}
                  
                  {opportunite.client.secteurActivite && (
                    <div className="flex items-center gap-3">
                      <Briefcase size={20} className="text-gray-400" />
                      <div>{opportunite.client.secteurActivite}</div>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100">
                  <Link href={`/dashboard/crm/clients/${opportunite.client.id}`}>
                    <Button variant="outline" className="w-full">
                      Voir la fiche client
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Dates importantes */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4">Dates importantes</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Calendar size={16} className="text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-500">Créé le</div>
                      <div className="font-medium">{formatDate(opportunite.createdAt)}</div>
                    </div>
                  </div>
                  
                  {opportunite.dateCloturePrevisionnelle && (
                    <div className="flex items-center gap-3">
                      <Target size={16} className="text-gray-400" />
                      <div>
                        <div className="text-sm text-gray-500">Clôture prévue</div>
                        <div className="font-medium">{formatDate(opportunite.dateCloturePrevisionnelle)}</div>
                      </div>
                    </div>
                  )}
                  
                  {opportunite.dateProchainSuivi && (
                    <div className="flex items-center gap-3">
                      <Clock size={16} className="text-orange-500" />
                      <div>
                        <div className="text-sm text-gray-500">Prochain suivi</div>
                        <div className="font-medium text-orange-600">{formatDate(opportunite.dateProchainSuivi)}</div>
                      </div>
                    </div>
                  )}
                  
                  {opportunite.dateCloture && (
                    <div className="flex items-center gap-3">
                      <CheckCircle2 size={16} className="text-green-500" />
                      <div>
                        <div className="text-sm text-gray-500">Clôturé le</div>
                        <div className="font-medium text-green-600">{formatDate(opportunite.dateCloture)}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions rapides */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4">Actions rapides</h3>
                <div className="space-y-3">
                  <Button className="w-full justify-start" variant="outline">
                    <Phone size={16} className="mr-2" />
                    Appeler le client
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Mail size={16} className="mr-2" />
                    Envoyer un email
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <FileText size={16} className="mr-2" />
                    Créer un devis
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <MessageSquare size={16} className="mr-2" />
                    Planifier une relance
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4">Historique des actions</h3>
            {opportunite.historique && opportunite.historique.length > 0 ? (
              <div className="space-y-4">
                {opportunite.historique.map((action) => (
                  <div key={action.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div className="flex-1">
                      <div className="font-medium">{action.action}</div>
                      <div className="text-sm text-gray-500">
                        Par {action.userName} • {formatDateTime(action.createdAt)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <History size={48} className="mx-auto mb-4 opacity-50" />
                <p>Aucun historique disponible</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Tâches associées</h3>
              <Button size="sm">
                <Plus size={16} className="mr-2" />
                Nouvelle tâche
              </Button>
            </div>
            {opportunite.taches && opportunite.taches.length > 0 ? (
              <div className="space-y-4">
                {opportunite.taches.map((tache) => (
                  <div key={tache.id} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg">
                    <CheckCircle2 size={20} className={tache.statut === 'TERMINEE' ? 'text-green-500' : 'text-gray-300'} />
                    <div className="flex-1">
                      <div className="font-medium">{tache.titre}</div>
                      <div className="text-sm text-gray-600 mb-2">{tache.description}</div>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>Échéance: {formatDate(tache.dateEcheance)}</span>
                        <span className={`px-2 py-1 rounded-full ${
                          tache.priorite === 'HAUTE' ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {tache.priorite}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle2 size={48} className="mx-auto mb-4 opacity-50" />
                <p>Aucune tâche associée</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'relances' && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Relances programmées</h3>
              <Button size="sm">
                <Plus size={16} className="mr-2" />
                Programmer une relance
              </Button>
            </div>
            {opportunite.relances && opportunite.relances.length > 0 ? (
              <div className="space-y-4">
                {opportunite.relances.map((relance) => (
                  <div key={relance.id} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg">
                    <MessageSquare size={20} className="text-blue-500" />
                    <div className="flex-1">
                      <div className="font-medium">{relance.typeRelance}</div>
                      <div className="text-sm text-gray-600 mb-2">{relance.commentaire}</div>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>Date: {formatDate(relance.dateRelance)}</span>
                        <span className={`px-2 py-1 rounded-full ${
                          relance.statut === 'EFFECTUEE' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                        }`}>
                          {relance.statut}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <MessageSquare size={48} className="mx-auto mb-4 opacity-50" />
                <p>Aucune relance programmée</p>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}