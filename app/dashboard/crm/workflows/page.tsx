'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Settings, Play, Pause, Plus, Edit, Trash2, Zap, 
  CheckCircle2, AlertCircle, Clock, Activity, 
  RefreshCw, Filter, Target, Mail, Phone, Calendar,
  Users, ArrowRight, Eye, MoreVertical, TrendingUp
} from 'lucide-react';

interface WorkflowRule {
  id: string;
  nom: string;
  description?: string;
  actif: boolean;
  evenement: string;
  conditions?: any;
  actions: Array<{
    type: string;
    parametres: any;
  }>;
  createdAt: string;
  updatedAt: string;
}

interface WorkflowStats {
  totalExecutions: number;
  reussites: number;
  echecs: number;
  enAttente: number;
}

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<WorkflowRule[]>([]);
  const [stats, setStats] = useState<WorkflowStats>({
    totalExecutions: 0,
    reussites: 0,
    echecs: 0,
    enAttente: 0
  });
  const [loading, setLoading] = useState(true);
  const [showNewWorkflow, setShowNewWorkflow] = useState(false);

  useEffect(() => {
    loadWorkflows();
  }, []);

  const loadWorkflows = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/crm/workflows');
      if (response.ok) {
        const data = await response.json();
        setWorkflows(data.workflows || []);
        setStats(data.stats || {
          totalExecutions: 0,
          reussites: 0,
          echecs: 0,
          enAttente: 0
        });
      }
    } catch (error) {
      console.error('Erreur chargement workflows:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleWorkflow = async (workflowId: string, actif: boolean) => {
    try {
      const response = await fetch(`/api/crm/workflows/${workflowId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actif: !actif })
      });

      if (response.ok) {
        loadWorkflows();
      }
    } catch (error) {
      console.error('Erreur toggle workflow:', error);
    }
  };

  const deleteWorkflow = async (workflowId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce workflow ?')) return;

    try {
      const response = await fetch(`/api/crm/workflows/${workflowId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        loadWorkflows();
      }
    } catch (error) {
      console.error('Erreur suppression workflow:', error);
    }
  };

  const getEventIcon = (evenement: string) => {
    const icons: Record<string, any> = {
      CREATION_OPPORTUNITE: Target,
      CHANGEMENT_STATUT: TrendingUp,
      ECHEANCE_PROCHE: Clock,
      AUCUNE_INTERACTION: Activity,
      CREATION_CLIENT: Users,
      CREATION_DEVIS: CheckCircle2,
      ACCEPTATION_DEVIS: CheckCircle2,
      REFUS_DEVIS: AlertCircle
    };
    return icons[evenement] || Settings;
  };

  const getEventLabel = (evenement: string) => {
    const labels: Record<string, string> = {
      CREATION_OPPORTUNITE: 'Création d\'opportunité',
      CHANGEMENT_STATUT: 'Changement de statut',
      ECHEANCE_PROCHE: 'Échéance proche',
      AUCUNE_INTERACTION: 'Aucune interaction',
      CREATION_CLIENT: 'Création de client',
      CREATION_DEVIS: 'Création de devis',
      ACCEPTATION_DEVIS: 'Acceptation de devis',
      REFUS_DEVIS: 'Refus de devis'
    };
    return labels[evenement] || evenement;
  };

  const getActionIcon = (type: string) => {
    const icons: Record<string, any> = {
      CREER_TACHE: CheckCircle2,
      ENVOYER_EMAIL: Mail,
      PROGRAMMER_RAPPEL: Calendar,
      CHANGER_PRIORITE: TrendingUp,
      ASSIGNER_COMMERCIAL: Users
    };
    return icons[type] || Settings;
  };

  const getActionLabel = (type: string) => {
    const labels: Record<string, string> = {
      CREER_TACHE: 'Créer une tâche',
      ENVOYER_EMAIL: 'Envoyer un email',
      PROGRAMMER_RAPPEL: 'Programmer un rappel',
      CHANGER_PRIORITE: 'Changer la priorité',
      ASSIGNER_COMMERCIAL: 'Assigner un commercial'
    };
    return labels[type] || type;
  };

  const tauxReussite = stats.totalExecutions > 0 
    ? (stats.reussites / stats.totalExecutions) * 100 
    : 0;

  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[1,2,3,4].map(i => (
                <div key={i} className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="h-16 bg-gray-200 rounded mb-4"></div>
                  <div className="h-8 bg-gray-200 rounded w-3/4"></div>
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
        
        {/* Header */}
        <div className="bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-700 rounded-3xl p-8 text-white shadow-xl mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center backdrop-blur-sm border border-white/30">
                <Zap size={40} />
              </div>
              <div>
                <h1 className="text-4xl font-bold mb-2">⚡ Workflows CRM</h1>
                <p className="text-xl text-blue-100 mb-2">
                  Automatisation et règles métier
                </p>
                <div className="flex items-center gap-6 text-blue-200 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span>{workflows.filter(w => w.actif).length} workflows actifs</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                    <span>{stats.totalExecutions} exécutions ce mois</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                    <span>{tauxReussite.toFixed(0)}% de réussite</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button 
                onClick={loadWorkflows}
                className="flex items-center gap-2 bg-white/20 backdrop-blur-sm border border-white/30 text-white hover:bg-white/30"
              >
                <RefreshCw size={20} />
                Actualiser
              </Button>
              <Button 
                onClick={() => setShowNewWorkflow(true)}
                className="flex items-center gap-2 bg-white text-purple-600 hover:bg-blue-50 shadow-lg"
              >
                <Plus size={20} />
                Nouveau Workflow
              </Button>
            </div>
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Activity size={24} className="text-blue-600" />
              </div>
              <div className="text-sm text-gray-500">30 jours</div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {stats.totalExecutions}
            </div>
            <div className="text-gray-600 text-sm">
              Exécutions totales
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <CheckCircle2 size={24} className="text-green-600" />
              </div>
              <div className="text-sm text-green-600 font-medium">
                {tauxReussite.toFixed(0)}%
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {stats.reussites}
            </div>
            <div className="text-gray-600 text-sm">
              Exécutions réussies
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <AlertCircle size={24} className="text-red-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {stats.echecs}
            </div>
            <div className="text-gray-600 text-sm">
              Échecs
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <Clock size={24} className="text-orange-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {stats.enAttente}
            </div>
            <div className="text-gray-600 text-sm">
              En attente
            </div>
          </div>
        </div>

        {/* Liste des workflows */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold">Règles d'automatisation</h3>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Filter size={16} />
                  <select className="border border-gray-200 rounded-lg px-3 py-1">
                    <option value="all">Tous les workflows</option>
                    <option value="active">Actifs uniquement</option>
                    <option value="inactive">Inactifs uniquement</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="divide-y divide-gray-100">
            {workflows.length === 0 ? (
              <div className="p-12 text-center">
                <Zap size={48} className="mx-auto text-gray-400 mb-4" />
                <h4 className="text-lg font-semibold text-gray-900 mb-2">
                  Aucun workflow configuré
                </h4>
                <p className="text-gray-600 mb-6">
                  Créez votre premier workflow pour automatiser vos processus CRM
                </p>
                <Button onClick={() => setShowNewWorkflow(true)}>
                  <Plus size={16} className="mr-2" />
                  Créer un workflow
                </Button>
              </div>
            ) : (
              workflows.map((workflow) => {
                const EventIcon = getEventIcon(workflow.evenement);
                
                return (
                  <div key={workflow.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          workflow.actif 
                            ? 'bg-green-100 text-green-600' 
                            : 'bg-gray-100 text-gray-400'
                        }`}>
                          <EventIcon size={20} />
                        </div>
                        
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <h4 className="text-lg font-semibold text-gray-900">
                              {workflow.nom}
                            </h4>
                            <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                              workflow.actif
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              {workflow.actif ? 'Actif' : 'Inactif'}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <Play size={14} />
                              Déclencheur: {getEventLabel(workflow.evenement)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Settings size={14} />
                              {workflow.actions.length} action{workflow.actions.length > 1 ? 's' : ''}
                            </span>
                          </div>
                          
                          {workflow.description && (
                            <p className="text-gray-600 text-sm mt-2">
                              {workflow.description}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleWorkflow(workflow.id, workflow.actif)}
                        >
                          {workflow.actif ? (
                            <>
                              <Pause size={14} className="mr-1" />
                              Désactiver
                            </>
                          ) : (
                            <>
                              <Play size={14} className="mr-1" />
                              Activer
                            </>
                          )}
                        </Button>
                        
                        <Button variant="outline" size="sm">
                          <Edit size={14} className="mr-1" />
                          Modifier
                        </Button>
                        
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => deleteWorkflow(workflow.id)}
                        >
                          <Trash2 size={14} className="mr-1" />
                          Supprimer
                        </Button>
                      </div>
                    </div>
                    
                    {/* Actions du workflow */}
                    <div className="mt-4 pl-16">
                      <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                        <ArrowRight size={12} />
                        Actions automatiques:
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {workflow.actions.map((action, index) => {
                          const ActionIcon = getActionIcon(action.type);
                          return (
                            <div 
                              key={index}
                              className="flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs"
                            >
                              <ActionIcon size={12} />
                              {getActionLabel(action.type)}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Modal nouveau workflow */}
        {showNewWorkflow && (
          <WorkflowModal 
            onClose={() => setShowNewWorkflow(false)}
            onSave={loadWorkflows}
          />
        )}
      </div>
    </div>
  );
}

// Composant modal pour créer/modifier un workflow
function WorkflowModal({ 
  onClose, 
  onSave 
}: { 
  onClose: () => void;
  onSave: () => void;
}) {
  const [formData, setFormData] = useState({
    nom: '',
    description: '',
    evenement: 'CHANGEMENT_STATUT',
    actif: true,
    actions: [{
      type: 'CREER_TACHE',
      parametres: {
        titre: 'Tâche automatique',
        delaiJours: 1,
        priorite: 'NORMALE'
      }
    }]
  });
  
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/crm/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        onSave();
        onClose();
      }
    } catch (error) {
      console.error('Erreur création workflow:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold">Nouveau Workflow</h3>
          <Button variant="outline" onClick={onClose}>
            ✕
          </Button>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nom du workflow *
            </label>
            <Input
              value={formData.nom}
              onChange={(e) => setFormData({...formData, nom: e.target.value})}
              placeholder="Ex: Relance automatique prospect"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              rows={3}
              placeholder="Description du workflow..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Déclencheur
            </label>
            <select
              value={formData.evenement}
              onChange={(e) => setFormData({...formData, evenement: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="CHANGEMENT_STATUT">Changement de statut</option>
              <option value="CREATION_OPPORTUNITE">Création d'opportunité</option>
              <option value="ECHEANCE_PROCHE">Échéance proche</option>
              <option value="AUCUNE_INTERACTION">Aucune interaction</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.actif}
              onChange={(e) => setFormData({...formData, actif: e.target.checked})}
              className="h-4 w-4 text-purple-600"
            />
            <label className="text-sm text-gray-700">
              Activer ce workflow immédiatement
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-8">
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={handleSave} disabled={loading || !formData.nom}>
            {loading ? 'Création...' : 'Créer le workflow'}
          </Button>
        </div>
      </div>
    </div>
  );
}