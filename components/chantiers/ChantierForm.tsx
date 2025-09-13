"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { useChantiers } from "@/hooks/useChantiers";
import { useToastContext } from "@/components/providers/ToastProvider";
import { X } from "lucide-react";

interface Client {
  id: string;
  name: string;
  email: string;
  company?: string;
  phone?: string;
  address?: string;
}

interface ChantierFormProps {
  chantier?: any;
  onClose: () => void;
  onSuccess?: () => void;
}

const STATUT_OPTIONS = [
  { value: 'EN_ATTENTE', label: 'En attente' },
  { value: 'EN_COURS', label: 'En cours' },
  { value: 'TERMINE', label: 'Terminé' },
  { value: 'ANNULE', label: 'Annulé' },
];

const TYPE_OPTIONS = [
  { value: 'CONSTRUCTION', label: 'Construction' },
  { value: 'RENOVATION', label: 'Rénovation' },
  { value: 'EXTENSION', label: 'Extension' },
  { value: 'DEMOLITION', label: 'Démolition' },
  { value: 'AMENAGEMENT', label: 'Aménagement' },
];

export function ChantierForm({ chantier, onClose, onSuccess }: ChantierFormProps) {
  const { data: session } = useSession();
  const { createChantier, updateChantier, loading } = useChantiers();
  const { success, error: showError } = useToastContext();
  
  const [clients, setClients] = useState<Client[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);
  
  const [formData, setFormData] = useState({
    nom: chantier?.nom || '',
    description: chantier?.description || '',
    adresse: chantier?.adresse || '',
    ville: chantier?.ville || '',
    codePostal: chantier?.codePostal || '',
    type: chantier?.type || 'CONSTRUCTION',
    statut: chantier?.statut || 'EN_ATTENTE',
    dateDebut: chantier?.dateDebut ? new Date(chantier.dateDebut).toISOString().split('T')[0] : '',
    dateFin: chantier?.dateFin ? new Date(chantier.dateFin).toISOString().split('T')[0] : '',
    budgetEstime: chantier?.budget || chantier?.budgetEstime || '',
    clientId: chantier?.clientId || '',
    superficie: chantier?.superficie || '',
    progression: chantier?.progression || 0,
    photo: chantier?.photo || null,
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
      // Définir automatiquement le clientId si ce n'est pas un chantier existant
      if (!chantier) {
        setFormData(prev => ({ ...prev, clientId: session.user.id }));
      }
      return;
    }

    // Pour les admins et commerciaux, charger tous les clients
    setLoadingClients(true);
    try {
      const response = await fetch('/api/users?role=CLIENT');
      if (response.ok) {
        const data = await response.json();
        setClients(data.users || []);
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

  // Réinitialiser les données du formulaire quand le chantier change
  useEffect(() => {
    if (chantier) {
      setFormData({
        nom: chantier.nom || '',
        description: chantier.description || '',
        adresse: chantier.adresse || '',
        ville: chantier.ville || '',
        codePostal: chantier.codePostal || '',
        type: chantier.type || 'CONSTRUCTION',
        statut: chantier.statut || 'EN_ATTENTE',
        dateDebut: chantier.dateDebut ? new Date(chantier.dateDebut).toISOString().split('T')[0] : '',
        dateFin: chantier.dateFin ? new Date(chantier.dateFin).toISOString().split('T')[0] : '',
        budgetEstime: chantier.budget || chantier.budgetEstime || '',
        clientId: chantier.clientId || '',
        superficie: chantier.superficie || '',
        progression: chantier.progression || 0,
        photo: chantier.photo || null,
      });
    } else {
      // Réinitialiser pour un nouveau chantier
      setFormData({
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
        photo: null,
      });
    }
  }, [chantier]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nom.trim() || !formData.clientId || !formData.description.trim() || !formData.adresse.trim() || !formData.dateDebut || !formData.dateFin || !formData.budgetEstime || !formData.superficie) {
      showError('Erreur', 'Tous les champs obligatoires doivent être remplis (nom, description, adresse, client, dates, budget, superficie)');
      return;
    }

    const submitData = {
      nom: formData.nom.trim(),
      description: formData.description.trim(),
      adresse: formData.adresse.trim(),
      clientId: formData.clientId,
      dateDebut: formData.dateDebut,
      dateFin: formData.dateFin,
      budget: parseFloat(formData.budgetEstime),
      superficie: formData.superficie.toString(),
    };

    try {
      if (chantier) {
        await updateChantier(chantier.id, submitData);
        success('Succès', 'Le chantier a été mis à jour avec succès');
      } else {
        await createChantier(submitData);
        success('Succès', 'Le chantier a été créé avec succès');
      }
      
      onSuccess?.();
      onClose();
    } catch (error: any) {
      showError('Erreur', error.message || 'Une erreur est survenue lors de la sauvegarde');
    }
  };

  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">
            {chantier ? 'Modifier le chantier' : 'Nouveau chantier'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Section upload d'image */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Photo du chantier
            </label>
            <ImageUpload
              value={formData.photo}
              onChange={(url) => handleChange('photo', url || '')}
              disabled={loading}
              className="max-w-md"
            />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
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
                    Date de début
                  </label>
                  <Input
                    type="date"
                    value={formData.dateDebut}
                    onChange={(e) => handleChange('dateDebut', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date de fin prévue
                  </label>
                  <Input
                    type="date"
                    value={formData.dateFin}
                    onChange={(e) => handleChange('dateFin', e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Description détaillée du projet..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Adresse
                </label>
                <Input
                  value={formData.adresse}
                  onChange={(e) => handleChange('adresse', e.target.value)}
                  placeholder="Adresse complète"
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
                    Budget estimé (€)
                  </label>
                  <Input
                    type="number"
                    value={formData.budgetEstime}
                    onChange={(e) => handleChange('budgetEstime', e.target.value)}
                    placeholder="0"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Superficie (m²)
                  </label>
                  <Input
                    type="number"
                    value={formData.superficie}
                    onChange={(e) => handleChange('superficie', e.target.value)}
                    placeholder="0"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Progression (%)
                </label>
                <div className="flex items-center space-x-4">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={formData.progression}
                    onChange={(e) => handleChange('progression', e.target.value)}
                    className="flex-1"
                  />
                  <span className="text-sm font-medium w-12">{formData.progression}%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={loading}
            >
              {loading ? 'Sauvegarde...' : chantier ? 'Mettre à jour' : 'Créer le chantier'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}