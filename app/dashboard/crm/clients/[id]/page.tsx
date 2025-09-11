'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Phone, 
  Mail, 
  MapPin, 
  Building2, 
  Calendar, 
  TrendingUp, 
  FileText,
  MessageSquare,
  Target,
  Star,
  Edit,
  Plus,
  ExternalLink,
  Globe,
  Linkedin,
  AlertCircle,
  CheckCircle,
  Clock,
  DollarSign,
  Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FicheClientComplete {
  client: {
    id: string;
    nom?: string;
    name?: string;
    email: string;
    phone?: string;
    company?: string;
    address?: string;
    telephoneFixe?: string;
    telephoneMobile?: string;
    siteWeb?: string;
    linkedin?: string;
    siret?: string;
    codeApe?: string;
    formeJuridique?: string;
    capitalSocial?: number;
    sourceProspect?: string;
    notesCRM?: string;
    priorite: number;
    score: number;
    typeClient: string;
    secteurActivite?: string;
    chiffreAffaires?: number;
    ville?: string;
    createdAt: string;
  };
  interactions: any[];
  opportunites: any[];
  chantiers: any[];
  devis: any[];
  documents: any[];
  plannings: any[];
  historiqueActions: any[];
  stats: {
    totalInteractions: number;
    interactionsParType: Record<string, number>;
    totalOpportunites: number;
    valeurTotalePipeline: number;
    opportunitesGagnees: number;
    totalChantiers: number;
    chantiersActifs: number;
    chantiersTermines: number;
    totalDevis: number;
    montantTotalDevis: number;
    devisAcceptes: number;
    scoreClient: number;
  };
  prochainesEcheances: {
    devis: any[];
    interactions: any[];
    opportunites: any[];
    plannings: any[];
  };
}

export default function FicheClientPage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<FicheClientComplete | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (params.id) {
      loadClientData();
    }
  }, [params.id]);

  const loadClientData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/crm/clients/${params.id}/fiche-complete`);
      
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des données client');
      }

      const clientData = await response.json();
      setData(clientData);
    } catch (error) {
      console.error('Erreur:', error);
      setError(error instanceof Error ? error.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const getPrioriteLabel = (priorite: number) => {
    switch (priorite) {
      case 1: return { label: 'Haute', color: 'text-red-600 bg-red-50' };
      case 2: return { label: 'Moyenne', color: 'text-orange-600 bg-orange-50' };
      case 3: return { label: 'Basse', color: 'text-green-600 bg-green-50' };
      default: return { label: 'Non définie', color: 'text-gray-600 bg-gray-50' };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement de la fiche client...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Erreur</h2>
          <p className="text-gray-600 mb-4">{error || 'Client non trouvé'}</p>
          <Button onClick={() => router.back()}>Retour</Button>
        </div>
      </div>
    );
  }

  const { client, stats, prochainesEcheances } = data;
  const priorite = getPrioriteLabel(client.priorite);
  const clientName = client.nom || client.name || 'Client sans nom';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft size={16} />
              Retour
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">
              Fiche Client 360°
            </h1>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="flex items-center gap-2">
              <MessageSquare size={16} />
              Nouvelle Interaction
            </Button>
            <Button className="flex items-center gap-2">
              <Plus size={16} />
              Nouvelle Opportunité
            </Button>
          </div>
        </div>

        {/* En-tête Client */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold">
                {clientName.charAt(0).toUpperCase()}
              </div>
              
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">{clientName}</h2>
                {client.company && (
                  <p className="text-lg text-gray-600 mb-2">{client.company}</p>
                )}
                
                <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                  {client.email && (
                    <div className="flex items-center gap-1">
                      <Mail size={14} />
                      <span>{client.email}</span>
                    </div>
                  )}
                  {(client.phone || client.telephoneMobile) && (
                    <div className="flex items-center gap-1">
                      <Phone size={14} />
                      <span>{client.telephoneMobile || client.phone}</span>
                    </div>
                  )}
                  {client.ville && (
                    <div className="flex items-center gap-1">
                      <MapPin size={14} />
                      <span>{client.ville}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${priorite.color}`}>
                    Priorité {priorite.label}
                  </span>
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <Star size={14} className="text-yellow-500" />
                    <span>Score: {stats.scoreClient}/100</span>
                  </div>
                  <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
                    {client.typeClient}
                  </span>
                </div>
              </div>
            </div>

            <div className="text-right">
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <Edit size={14} />
                Modifier
              </Button>
              <p className="text-sm text-gray-500 mt-2">
                Client depuis le {formatDate(client.createdAt)}
              </p>
            </div>
          </div>
        </div>

        {/* Statistiques Rapides */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                <MessageSquare size={24} className="text-blue-600" />
              </div>
              <span className="text-2xl font-bold text-gray-900">{stats.totalInteractions}</span>
            </div>
            <h3 className="font-semibold text-gray-900">Interactions</h3>
            <p className="text-sm text-gray-600">Historique de contact</p>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
                <Target size={24} className="text-green-600" />
              </div>
              <span className="text-2xl font-bold text-gray-900">{stats.totalOpportunites}</span>
            </div>
            <h3 className="font-semibold text-gray-900">Opportunités</h3>
            <p className="text-sm text-gray-600">{formatCurrency(stats.valeurTotalePipeline)} en cours</p>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
                <Building2 size={24} className="text-purple-600" />
              </div>
              <span className="text-2xl font-bold text-gray-900">{stats.totalChantiers}</span>
            </div>
            <h3 className="font-semibold text-gray-900">Chantiers</h3>
            <p className="text-sm text-gray-600">{stats.chantiersActifs} en cours</p>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center">
                <DollarSign size={24} className="text-amber-600" />
              </div>
              <span className="text-2xl font-bold text-gray-900">{stats.totalDevis}</span>
            </div>
            <h3 className="font-semibold text-gray-900">Devis</h3>
            <p className="text-sm text-gray-600">{formatCurrency(stats.montantTotalDevis)} total</p>
          </div>
        </div>

        {/* Prochaines Échéances */}
        {(prochainesEcheances.devis.length > 0 || 
          prochainesEcheances.interactions.length > 0 || 
          prochainesEcheances.opportunites.length > 0 ||
          prochainesEcheances.plannings.length > 0) && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                <Clock size={20} className="text-orange-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Prochaines Échéances</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {prochainesEcheances.devis.map((devis) => (
                <div key={devis.id} className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="flex items-start justify-between mb-2">
                    <FileText size={16} className="text-orange-600 mt-1" />
                    <span className="text-xs text-orange-600 font-medium">
                      {formatDate(devis.dateEcheance)}
                    </span>
                  </div>
                  <h4 className="font-semibold text-gray-900 text-sm mb-1">
                    Devis #{devis.numero}
                  </h4>
                  <p className="text-xs text-gray-600">{formatCurrency(devis.montant)}</p>
                </div>
              ))}

              {prochainesEcheances.interactions.map((interaction) => (
                <div key={interaction.id} className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-start justify-between mb-2">
                    <MessageSquare size={16} className="text-blue-600 mt-1" />
                    <span className="text-xs text-blue-600 font-medium">
                      {formatDate(interaction.rappelDate)}
                    </span>
                  </div>
                  <h4 className="font-semibold text-gray-900 text-sm mb-1">
                    Rappel: {interaction.titre}
                  </h4>
                  <p className="text-xs text-gray-600">{interaction.type}</p>
                </div>
              ))}

              {prochainesEcheances.opportunites.map((opp) => (
                <div key={opp.id} className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-start justify-between mb-2">
                    <Target size={16} className="text-green-600 mt-1" />
                    <span className="text-xs text-green-600 font-medium">
                      {formatDate(opp.dateProchainSuivi)}
                    </span>
                  </div>
                  <h4 className="font-semibold text-gray-900 text-sm mb-1">
                    Suivi: {opp.titre}
                  </h4>
                  <p className="text-xs text-gray-600">{formatCurrency(opp.valeurEstimee)}</p>
                </div>
              ))}

              {prochainesEcheances.plannings.map((planning) => (
                <div key={planning.id} className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="flex items-start justify-between mb-2">
                    <Calendar size={16} className="text-purple-600 mt-1" />
                    <span className="text-xs text-purple-600 font-medium">
                      {formatDate(planning.dateDebut)}
                    </span>
                  </div>
                  <h4 className="font-semibold text-gray-900 text-sm mb-1">
                    {planning.titre}
                  </h4>
                  <p className="text-xs text-gray-600">{planning.type}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Onglets de Détails */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
          <div className="border-b border-gray-200 px-6 py-4">
            <nav className="flex gap-8">
              {[
                { id: 'overview', label: 'Vue d\'ensemble', icon: TrendingUp },
                { id: 'interactions', label: 'Interactions', icon: MessageSquare },
                { id: 'opportunites', label: 'Opportunités', icon: Target },
                { id: 'chantiers', label: 'Chantiers', icon: Building2 },
                { id: 'devis', label: 'Devis', icon: FileText }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'bg-indigo-50 text-indigo-600 border border-indigo-200'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <Icon size={16} />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Informations détaillées */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Informations Détaillées</h4>
                  <div className="space-y-3">
                    {client.siret && (
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-600">SIRET</span>
                        <span className="font-medium">{client.siret}</span>
                      </div>
                    )}
                    {client.formeJuridique && (
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-600">Forme Juridique</span>
                        <span className="font-medium">{client.formeJuridique}</span>
                      </div>
                    )}
                    {client.secteurActivite && (
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-600">Secteur</span>
                        <span className="font-medium">{client.secteurActivite}</span>
                      </div>
                    )}
                    {client.chiffreAffaires && (
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-600">CA Annuel</span>
                        <span className="font-medium">{formatCurrency(client.chiffreAffaires)}</span>
                      </div>
                    )}
                    {client.sourceProspect && (
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-600">Source</span>
                        <span className="font-medium">{client.sourceProspect}</span>
                      </div>
                    )}
                  </div>

                  {/* Liens externes */}
                  {(client.siteWeb || client.linkedin) && (
                    <div className="mt-6">
                      <h5 className="text-sm font-semibold text-gray-900 mb-3">Liens Externes</h5>
                      <div className="flex gap-3">
                        {client.siteWeb && (
                          <a 
                            href={client.siteWeb} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                          >
                            <Globe size={16} className="text-gray-600" />
                            <span className="text-sm">Site Web</span>
                            <ExternalLink size={12} className="text-gray-400" />
                          </a>
                        )}
                        {client.linkedin && (
                          <a 
                            href={client.linkedin} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                          >
                            <Linkedin size={16} className="text-blue-600" />
                            <span className="text-sm">LinkedIn</span>
                            <ExternalLink size={12} className="text-gray-400" />
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Notes CRM */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Notes CRM</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    {client.notesCRM ? (
                      <p className="text-gray-700 whitespace-pre-wrap">{client.notesCRM}</p>
                    ) : (
                      <p className="text-gray-500 italic">Aucune note enregistrée</p>
                    )}
                    <Button variant="outline" size="sm" className="mt-3">
                      <Edit size={14} className="mr-2" />
                      Modifier les notes
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'interactions' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-gray-900">
                    Dernières Interactions ({data.interactions.length})
                  </h4>
                  <Button size="sm" className="flex items-center gap-2">
                    <Plus size={14} />
                    Nouvelle Interaction
                  </Button>
                </div>
                
                <div className="space-y-4">
                  {data.interactions.map((interaction) => (
                    <div key={interaction.id} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div>
                          <h5 className="font-semibold text-gray-900">{interaction.titre}</h5>
                          <p className="text-gray-600 mt-1">{interaction.description}</p>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                            <span>{interaction.type}</span>
                            <span>{formatDate(interaction.dateContact)}</span>
                            {interaction.createdByName && <span>par {interaction.createdByName}</span>}
                            {interaction.dureeMinutes && <span>{interaction.dureeMinutes}min</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {interaction.statut === 'TERMINE' ? (
                            <CheckCircle size={16} className="text-green-500" />
                          ) : (
                            <Clock size={16} className="text-orange-500" />
                          )}
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            interaction.importance === 1 ? 'bg-red-50 text-red-600' :
                            interaction.importance === 2 ? 'bg-orange-50 text-orange-600' :
                            'bg-green-50 text-green-600'
                          }`}>
                            {interaction.importance === 1 ? 'Haute' : 
                             interaction.importance === 2 ? 'Moyenne' : 'Basse'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {data.interactions.length === 0 && (
                    <div className="text-center py-8">
                      <MessageSquare size={48} className="text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">Aucune interaction enregistrée</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Autres onglets similaires... */}
            {activeTab === 'opportunites' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-gray-900">
                    Opportunités ({data.opportunites.length})
                  </h4>
                  <Button size="sm" className="flex items-center gap-2">
                    <Plus size={14} />
                    Nouvelle Opportunité
                  </Button>
                </div>
                
                <div className="space-y-4">
                  {data.opportunites.map((opp) => (
                    <div key={opp.id} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div>
                          <h5 className="font-semibold text-gray-900">{opp.titre}</h5>
                          <p className="text-lg font-bold text-green-600 mt-1">
                            {formatCurrency(opp.valeurEstimee)}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                            <span>Probabilité: {opp.probabilite}%</span>
                            {opp.typeProjet && <span>{opp.typeProjet}</span>}
                            {opp.dateCloturePrevisionnelle && (
                              <span>Clôture prév.: {formatDate(opp.dateCloturePrevisionnelle)}</span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`px-3 py-1 text-sm rounded-full ${
                            opp.statut === 'GAGNE' ? 'bg-green-50 text-green-600' :
                            opp.statut === 'PERDU' ? 'bg-red-50 text-red-600' :
                            opp.statut === 'NEGOCIATION' ? 'bg-blue-50 text-blue-600' :
                            'bg-gray-50 text-gray-600'
                          }`}>
                            {opp.statut}
                          </span>
                          <div className="mt-2">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              opp.priorite === 'CRITIQUE' ? 'bg-red-50 text-red-600' :
                              opp.priorite === 'HAUTE' ? 'bg-orange-50 text-orange-600' :
                              'bg-green-50 text-green-600'
                            }`}>
                              {opp.priorite}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {data.opportunites.length === 0 && (
                    <div className="text-center py-8">
                      <Target size={48} className="text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">Aucune opportunité enregistrée</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}