'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  ArrowLeft, Save, User, DollarSign, Calendar, Target,
  Building, Phone, Mail, Star, Briefcase, Clock
} from 'lucide-react';
import Link from 'next/link';

interface Client {
  id: string;
  nom?: string;
  name?: string;
  email: string;
  company?: string;
  phone?: string;
  telephoneMobile?: string;
  typeClient?: string;
}

export default function NouvelleOpportunitePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clientId = searchParams.get('clientId');

  const [formData, setFormData] = useState({
    clientId: clientId || '',
    titre: '',
    description: '',
    valeurEstimee: '',
    probabilite: 20,
    statut: 'PROSPECT',
    dateCloturePrevisionnelle: '',
    sourceProspection: '',
    concurrents: '',
    priorite: 'NORMALE',
    typeProjet: '',
    budgetClient: '',
    delaiSouhaite: '',
    dateProchainSuivi: ''
  });

  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadClients();
    if (clientId) {
      loadClient(clientId);
    }
  }, [clientId]);

  const loadClients = async () => {
    try {
      const response = await fetch('/api/crm/clients?limit=100');
      if (response.ok) {
        const data = await response.json();
        setClients(data.data.clients || []);
      }
    } catch (error) {
      console.error('Erreur chargement clients:', error);
    }
  };

  const loadClient = async (id: string) => {
    try {
      const response = await fetch(`/api/crm/clients/${id}`);
      if (response.ok) {
        const client = await response.json();
        setSelectedClient(client);
      }
    } catch (error) {
      console.error('Erreur chargement client:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      const response = await fetch('/api/crm/opportunites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          valeurEstimee: parseFloat(formData.valeurEstimee),
          budgetClient: formData.budgetClient ? parseFloat(formData.budgetClient) : undefined,
          dateCloturePrevisionnelle: formData.dateCloturePrevisionnelle || undefined,
          dateProchainSuivi: formData.dateProchainSuivi || undefined,
        }),
      });

      if (response.ok) {
        router.push('/dashboard/crm/pipeline');
      } else {
        const errorData = await response.json();
        if (errorData.details) {
          const fieldErrors: Record<string, string> = {};
          errorData.details.forEach((error: any) => {
            fieldErrors[error.path[0]] = error.message;
          });
          setErrors(fieldErrors);
        } else {
          setErrors({ general: errorData.error || 'Erreur lors de la création' });
        }
      }
    } catch (error) {
      console.error('Erreur création opportunité:', error);
      setErrors({ general: 'Erreur réseau lors de la création' });
    } finally {
      setLoading(false);
    }
  };

  const handleClientChange = (clientId: string) => {
    setFormData({ ...formData, clientId });
    const client = clients.find(c => c.id === clientId);
    setSelectedClient(client || null);
  };

  const formatDate = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto p-6">
        
        {/* Header */}
        <div className="bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 rounded-3xl p-8 text-white shadow-xl mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/30">
                <Target size={32} />
              </div>
              <div>
                <h1 className="text-3xl font-bold mb-2">🎯 Nouvelle Opportunité</h1>
                <p className="text-blue-100">
                  Ajouter une nouvelle opportunité commerciale
                </p>
              </div>
            </div>
            <Link href="/dashboard/crm/pipeline">
              <Button className="flex items-center gap-2 bg-white/20 backdrop-blur-sm border border-white/30 text-white hover:bg-white/30">
                <ArrowLeft size={20} />
                Retour au Pipeline
              </Button>
            </Link>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Erreur générale */}
          {errors.general && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
              {errors.general}
            </div>
          )}

          {/* Section Client */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <User size={20} />
              Client
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sélectionner un client *
                </label>
                <select
                  value={formData.clientId}
                  onChange={(e) => handleClientChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                >
                  <option value="">Choisir un client...</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name} {client.company ? `(${client.company})` : ''}
                    </option>
                  ))}
                </select>
                {errors.clientId && <p className="text-red-500 text-sm mt-1">{errors.clientId}</p>}
              </div>

              {selectedClient && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Informations client</h4>
                  <div className="space-y-1 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Mail size={14} />
                      <span>{selectedClient.email}</span>
                    </div>
                    {(selectedClient.telephoneMobile || selectedClient.phone) && (
                      <div className="flex items-center gap-2">
                        <Phone size={14} />
                        <span>{selectedClient.telephoneMobile || selectedClient.phone}</span>
                      </div>
                    )}
                    {selectedClient.company && (
                      <div className="flex items-center gap-2">
                        <Building size={14} />
                        <span>{selectedClient.company}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section Opportunité */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Target size={20} />
              Détails de l'opportunité
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Titre de l'opportunité *
                </label>
                <Input
                  type="text"
                  value={formData.titre}
                  onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
                  placeholder="Ex: Rénovation cuisine moderne"
                  required
                />
                {errors.titre && <p className="text-red-500 text-sm mt-1">{errors.titre}</p>}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Description détaillée du projet..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type de projet
                </label>
                <select
                  value={formData.typeProjet}
                  onChange={(e) => setFormData({ ...formData, typeProjet: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Sélectionner...</option>
                  <option value="RENOVATION">Rénovation</option>
                  <option value="EXTENSION">Extension</option>
                  <option value="CONSTRUCTION_NEUVE">Construction neuve</option>
                  <option value="AMENAGEMENT">Aménagement</option>
                  <option value="REPARATION">Réparation</option>
                  <option value="AUTRE">Autre</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Source de prospection
                </label>
                <select
                  value={formData.sourceProspection}
                  onChange={(e) => setFormData({ ...formData, sourceProspection: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Sélectionner...</option>
                  <option value="SITE_WEB">Site web</option>
                  <option value="RECOMMANDATION">Recommandation</option>
                  <option value="PUBLICITE_FACEBOOK">Publicité Facebook</option>
                  <option value="GOOGLE_ADS">Google Ads</option>
                  <option value="PAGES_JAUNES">Pages Jaunes</option>
                  <option value="BOUCHE_A_OREILLE">Bouche à oreille</option>
                  <option value="SALON_PROFESSIONNEL">Salon professionnel</option>
                  <option value="AUTRE">Autre</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section Financière */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <DollarSign size={20} />
              Informations financières
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Valeur estimée (€) *
                </label>
                <Input
                  type="number"
                  value={formData.valeurEstimee}
                  onChange={(e) => setFormData({ ...formData, valeurEstimee: e.target.value })}
                  placeholder="35000"
                  min="0"
                  step="100"
                  required
                />
                {errors.valeurEstimee && <p className="text-red-500 text-sm mt-1">{errors.valeurEstimee}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Budget client (€)
                </label>
                <Input
                  type="number"
                  value={formData.budgetClient}
                  onChange={(e) => setFormData({ ...formData, budgetClient: e.target.value })}
                  placeholder="40000"
                  min="0"
                  step="100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Probabilité (%) *
                </label>
                <div className="space-y-2">
                  <Input
                    type="range"
                    value={formData.probabilite}
                    onChange={(e) => setFormData({ ...formData, probabilite: parseInt(e.target.value) })}
                    min="0"
                    max="100"
                    step="5"
                    className="w-full"
                  />
                  <div className="text-center font-medium text-purple-600">
                    {formData.probabilite}%
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section Planification */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Calendar size={20} />
              Planification
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date de clôture prévisionnelle
                </label>
                <Input
                  type="date"
                  value={formData.dateCloturePrevisionnelle}
                  onChange={(e) => setFormData({ ...formData, dateCloturePrevisionnelle: e.target.value })}
                />
                <div className="mt-2 space-x-2">
                  <Button 
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setFormData({ ...formData, dateCloturePrevisionnelle: formatDate(7) })}
                  >
                    +7j
                  </Button>
                  <Button 
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setFormData({ ...formData, dateCloturePrevisionnelle: formatDate(30) })}
                  >
                    +30j
                  </Button>
                  <Button 
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setFormData({ ...formData, dateCloturePrevisionnelle: formatDate(90) })}
                  >
                    +90j
                  </Button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prochain suivi
                </label>
                <Input
                  type="date"
                  value={formData.dateProchainSuivi}
                  onChange={(e) => setFormData({ ...formData, dateProchainSuivi: e.target.value })}
                />
                <div className="mt-2 space-x-2">
                  <Button 
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setFormData({ ...formData, dateProchainSuivi: formatDate(1) })}
                  >
                    Demain
                  </Button>
                  <Button 
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setFormData({ ...formData, dateProchainSuivi: formatDate(7) })}
                  >
                    +7j
                  </Button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priorité
                </label>
                <select
                  value={formData.priorite}
                  onChange={(e) => setFormData({ ...formData, priorite: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="BASSE">Basse</option>
                  <option value="NORMALE">Normale</option>
                  <option value="HAUTE">Haute</option>
                  <option value="CRITIQUE">Critique</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Délai souhaité
                </label>
                <Input
                  type="text"
                  value={formData.delaiSouhaite}
                  onChange={(e) => setFormData({ ...formData, delaiSouhaite: e.target.value })}
                  placeholder="Ex: 2-3 mois"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Concurrents identifiés
                </label>
                <Input
                  type="text"
                  value={formData.concurrents}
                  onChange={(e) => setFormData({ ...formData, concurrents: e.target.value })}
                  placeholder="Liste des concurrents..."
                />
              </div>
            </div>
          </div>

          {/* Boutons d'action */}
          <div className="flex justify-end gap-4">
            <Link href="/dashboard/crm/pipeline">
              <Button type="button" variant="outline">
                Annuler
              </Button>
            </Link>
            <Button 
              type="submit" 
              disabled={loading}
              className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white"
            >
              <Save size={20} />
              {loading ? 'Création...' : 'Créer l\'opportunité'}
            </Button>
          </div>

        </form>
      </div>
    </div>
  );
}