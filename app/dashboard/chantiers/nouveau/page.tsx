"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { ArrowLeft, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { useChantiers } from "@/hooks/useChantiers";
import { useToastContext } from "@/components/providers/ToastProvider";

interface Client {
  id: string;
  name: string;
  email: string;
  company?: string;
  phone?: string;
  address?: string;
}

const TYPE_OPTIONS = [
  { value: 'CONSTRUCTION', label: 'Construction' },
  { value: 'RENOVATION', label: 'Rénovation' },
  { value: 'EXTENSION', label: 'Extension' },
  { value: 'DEMOLITION', label: 'Démolition' },
  { value: 'AMENAGEMENT', label: 'Aménagement' },
];

const STATUT_OPTIONS = [
  { value: 'EN_ATTENTE', label: 'En attente' },
  { value: 'EN_COURS', label: 'En cours' },
  { value: 'TERMINE', label: 'Terminé' },
  { value: 'ANNULE', label: 'Annulé' },
];

export default function NouveauChantierPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { createChantier, loading } = useChantiers();
  const { success, error: showError } = useToastContext();
  
  const [clients, setClients] = useState<Client[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);
  
  const [formData, setFormData] = useState({
    nom: '',
    description: '',
    adresse: '',
    ville: '',
    codePostal: '',
    type: 'CONSTRUCTION',
    statut: 'EN_ATTENTE',
    dateDebut: '',
    dateFin: '',
    budgetEstime: '',
    clientId: '',
    superficie: '',
    progression: 0,
    photo: null as string | null,
  });

  const fetchClients = async () => {
    if (!session) return;
    
    // Si l'utilisateur est un client, il ne peut créer que pour lui-même
    if (session.user.role === "CLIENT") {
      setClients([{
        id: session.user.id,
        name: session.user.name,
        email: session.user.email
      }]);
      // Définir automatiquement le clientId
      setFormData(prev => ({ ...prev, clientId: session.user.id }));
      return;
    }

    // Pour les admins et commerciaux, charger tous les clients
    setLoadingClients(true);
    try {
      const response = await fetch('/api/users?role=CLIENT', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setClients(data.users || []);
      } else {
        console.error('Erreur API:', response.status, response.statusText);
      }
    } catch (err) {
      console.error('Erreur lors du chargement des clients:', err);
    } finally {
      setLoadingClients(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nom.trim() || !formData.clientId || !formData.description.trim() || !formData.adresse.trim() || !formData.dateDebut || !formData.dateFin || !formData.budgetEstime) {
      showError('Erreur', 'Tous les champs obligatoires doivent être remplis (nom, description, adresse, client, dates, budget)');
      return;
    }

    const submitData = {
      nom: formData.nom.trim(),
      description: formData.description.trim(),
      adresse: formData.adresse.trim(),
      clientId: formData.clientId,
      dateDebut: formData.dateDebut,
      dateFin: formData.dateFin,
      budget: parseFloat(formData.budgetEstime) || 0,
      superficie: formData.superficie ? formData.superficie.toString() : "",
      photo: formData.photo || undefined
    };

    try {
      const result = await createChantier(submitData);
      if (result.success && result.data) {
        success('Succès', 'Le chantier a été créé avec succès');
        router.push(`/dashboard/chantiers/${result.data.id}`);
      } else {
        showError('Erreur', result.error || 'Une erreur est survenue');
      }
    } catch (error: any) {
      showError('Erreur', error.message || 'Une erreur est survenue lors de la création');
    }
  };

  const handleChange = (field: string, value: string | number | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCancel = () => {
    if (confirm('Êtes-vous sûr de vouloir annuler ? Toutes les modifications seront perdues.')) {
      router.push('/dashboard/chantiers');
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Navigation */}
        <div className="flex items-center justify-between mb-8">
          <Link 
            href="/dashboard/chantiers"
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft size={20} />
            <span>Retour aux chantiers</span>
          </Link>

          <div className="flex items-center gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={loading}
            >
              <X size={16} className="mr-2" />
              Annuler
            </Button>
          </div>
        </div>

        {/* Titre */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Nouveau Chantier</h1>
          <p className="text-gray-500">
            Créez un nouveau chantier et définissez ses caractéristiques
          </p>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            {/* Section photo */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Photo du chantier</h2>
              <ImageUpload
                value={formData.photo || ''}
                onChange={(url) => handleChange('photo', url)}
                disabled={loading}
                className="max-w-md"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Informations générales */}
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900">Informations générales</h2>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom du chantier *
                  </label>
                  <Input
                    value={formData.nom}
                    onChange={(e) => handleChange('nom', e.target.value)}
                    placeholder="Ex: Maison familiale Dupont"
                    required
                  />
                </div>

                {session?.user.role !== "CLIENT" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Client *
                    </label>
                    <select
                      value={formData.clientId}
                      onChange={(e) => handleChange('clientId', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                      disabled={loadingClients}
                    >
                      <option value="">
                        {loadingClients ? 'Chargement...' : 'Sélectionner un client'}
                      </option>
                      {clients.map((client) => (
                        <option key={client.id} value={client.id}>
                          {client.name} {client.company && `(${client.company})`}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type de projet
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => handleChange('type', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {TYPE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Statut
                  </label>
                  <select
                    value={formData.statut}
                    onChange={(e) => handleChange('statut', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {STATUT_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date de début *
                    </label>
                    <Input
                      type="date"
                      value={formData.dateDebut}
                      onChange={(e) => handleChange('dateDebut', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date de fin prévue *
                    </label>
                    <Input
                      type="date"
                      value={formData.dateFin}
                      onChange={(e) => handleChange('dateFin', e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Détails du projet */}
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900">Détails du projet</h2>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    placeholder="Description détaillée du projet..."
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Adresse *
                  </label>
                  <Input
                    value={formData.adresse}
                    onChange={(e) => handleChange('adresse', e.target.value)}
                    placeholder="Adresse complète"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ville
                    </label>
                    <Input
                      value={formData.ville}
                      onChange={(e) => handleChange('ville', e.target.value)}
                      placeholder="Ville"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Code postal
                    </label>
                    <Input
                      value={formData.codePostal}
                      onChange={(e) => handleChange('codePostal', e.target.value)}
                      placeholder="Code postal"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Budget estimé (€) *
                    </label>
                    <Input
                      type="number"
                      value={formData.budgetEstime}
                      onChange={(e) => handleChange('budgetEstime', e.target.value)}
                      placeholder="0"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Superficie (m²) *
                    </label>
                    <Input
                      type="number"
                      value={formData.superficie}
                      onChange={(e) => handleChange('superficie', e.target.value)}
                      placeholder="0"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Progression initiale (%)
                  </label>
                  <div className="flex items-center space-x-4">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={formData.progression}
                      onChange={(e) => handleChange('progression', parseInt(e.target.value))}
                      className="flex-1"
                    />
                    <span className="text-sm font-medium w-12">{formData.progression}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Création...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Créer le chantier
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}