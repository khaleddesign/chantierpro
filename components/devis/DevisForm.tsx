"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDevis, LigneDevis } from "@/hooks/useDevis";
import { useToastContext } from "@/components/providers/ToastProvider";
import { X, Plus, Trash2, Calculator } from "lucide-react";
import { DevisType } from "@prisma/client";

interface Client {
  id: string;
  name: string;
  email: string;
  company?: string;
  phone?: string;
  address?: string;
}

interface Chantier {
  id: string;
  nom: string;
  adresse?: string;
}

interface DevisFormProps {
  devis?: any;
  onClose: () => void;
  onSuccess?: () => void;
}

const TYPE_OPTIONS = [
  { value: 'DEVIS', label: 'Devis' },
  { value: 'FACTURE', label: 'Facture' },
  { value: 'AVOIR', label: 'Avoir' },
];

export function DevisForm({ devis, onClose, onSuccess }: DevisFormProps) {
  const { createDevis, updateDevis, loading, calculateTotals } = useDevis();
  const { success, error: showError } = useToastContext();
  
  const [clients, setClients] = useState<Client[]>([]);
  const [chantiers, setChantiers] = useState<Chantier[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [loadingChantiers, setLoadingChantiers] = useState(false);
  
  const [formData, setFormData] = useState({
    clientId: devis?.clientId || '',
    chantierId: devis?.chantierId || '',
    type: devis?.type || 'DEVIS' as DevisType,
    objet: devis?.objet || '',
    dateEcheance: devis?.dateEcheance ? new Date(devis.dateEcheance).toISOString().split('T')[0] : '',
    notes: devis?.notes || '',
    conditionsVente: devis?.conditionsVente || 'Conditions générales de vente applicables.',
    modalitesPaiement: devis?.modalitesPaiement || 'Paiement à 30 jours fin de mois.',
    tva: devis?.tva || 20,
    retenueGarantie: devis?.retenueGarantie || 0,
    autoliquidation: devis?.autoliquidation || false,
  });

  const [lignes, setLignes] = useState<Omit<LigneDevis, 'id' | 'ordre'>[]>(
    devis?.ligneDevis?.map((ligne: LigneDevis) => ({
      description: ligne.description,
      quantite: ligne.quantite,
      prixUnit: ligne.prixUnit,
      total: ligne.total,
    })) || [
      { description: '', quantite: 1, prixUnit: 0, total: 0 }
    ]
  );

  // Calculs automatiques
  const totaux = calculateTotals(
    lignes as LigneDevis[], 
    formData.tva, 
    formData.autoliquidation, 
    formData.retenueGarantie
  );

  const fetchClients = async () => {
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

  const fetchChantiers = async (clientId: string) => {
    if (!clientId) {
      setChantiers([]);
      return;
    }

    setLoadingChantiers(true);
    try {
      const response = await fetch(`/api/chantiers?clientId=${clientId}`);
      if (response.ok) {
        const data = await response.json();
        setChantiers(data.chantiers || []);
      }
    } catch (err) {
      console.error('Erreur lors du chargement des chantiers:', err);
    } finally {
      setLoadingChantiers(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    if (formData.clientId) {
      fetchChantiers(formData.clientId);
    } else {
      setChantiers([]);
      setFormData(prev => ({ ...prev, chantierId: '' }));
    }
  }, [formData.clientId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.clientId || !formData.dateEcheance) {
      showError('Erreur', 'Le client et la date d\'échéance sont obligatoires');
      return;
    }

    const validLignes = lignes.filter(ligne => ligne.description.trim() && ligne.quantite > 0);
    
    if (validLignes.length === 0) {
      showError('Erreur', 'Au moins une ligne est requise');
      return;
    }

    const submitData = {
      ...formData,
      dateEcheance: new Date(formData.dateEcheance),
      lignes: validLignes.map(ligne => ({
        description: ligne.description,
        quantite: ligne.quantite,
        prixUnit: ligne.prixUnit,
      })),
      retenueGarantie: formData.retenueGarantie || undefined,
    };

    try {
      if (devis) {
        await updateDevis(devis.id, { ...submitData, lignes: validLignes });
        success('Succès', 'Le devis a été mis à jour avec succès');
      } else {
        await createDevis(submitData);
        success('Succès', 'Le devis a été créé avec succès');
      }
      
      onSuccess?.();
      onClose();
    } catch (error: any) {
      showError('Erreur', error.message || 'Une erreur est survenue lors de la sauvegarde');
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleLigneChange = useCallback((index: number, field: keyof Omit<LigneDevis, 'id' | 'ordre'>, value: any) => {
    setLignes(prev => {
      const newLignes = [...prev];
      newLignes[index] = {
        ...newLignes[index],
        [field]: value,
      };

      // Recalculer le total pour cette ligne
      if (field === 'quantite' || field === 'prixUnit') {
        newLignes[index].total = newLignes[index].quantite * newLignes[index].prixUnit;
      }

      return newLignes;
    });
  }, []);

  const addLigne = () => {
    setLignes(prev => [...prev, { description: '', quantite: 1, prixUnit: 0, total: 0 }]);
  };

  const removeLigne = (index: number) => {
    if (lignes.length > 1) {
      setLignes(prev => prev.filter((_, i) => i !== index));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">
            {devis ? 'Modifier le devis' : 'Nouveau devis'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Informations générales */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type de document
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => handleChange('type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  disabled={!!devis}
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Chantier (optionnel)
                </label>
                <select
                  value={formData.chantierId}
                  onChange={(e) => handleChange('chantierId', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  disabled={loadingChantiers || !formData.clientId}
                >
                  <option value="">
                    {loadingChantiers ? 'Chargement...' : 'Aucun chantier'}
                  </option>
                  {chantiers.map((chantier) => (
                    <option key={chantier.id} value={chantier.id}>
                      {chantier.nom}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Objet
                </label>
                <Input
                  value={formData.objet}
                  onChange={(e) => handleChange('objet', e.target.value)}
                  placeholder="Objet du devis..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date d'échéance *
                </label>
                <Input
                  type="date"
                  value={formData.dateEcheance}
                  onChange={(e) => handleChange('dateEcheance', e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Paramètres fiscaux */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Taux TVA (%)
                </label>
                <Input
                  type="number"
                  value={formData.tva}
                  onChange={(e) => handleChange('tva', parseFloat(e.target.value) || 0)}
                  min="0"
                  max="100"
                  step="0.1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Retenue de garantie (%)
                </label>
                <Input
                  type="number"
                  value={formData.retenueGarantie}
                  onChange={(e) => handleChange('retenueGarantie', parseFloat(e.target.value) || 0)}
                  min="0"
                  max="100"
                  step="0.1"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="autoliquidation"
                  checked={formData.autoliquidation}
                  onChange={(e) => handleChange('autoliquidation', e.target.checked)}
                  className="mr-2"
                />
                <label htmlFor="autoliquidation" className="text-sm font-medium text-gray-700">
                  Autoliquidation de TVA
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Conditions de vente
                </label>
                <textarea
                  value={formData.conditionsVente}
                  onChange={(e) => handleChange('conditionsVente', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Modalités de paiement
                </label>
                <textarea
                  value={formData.modalitesPaiement}
                  onChange={(e) => handleChange('modalitesPaiement', e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Lignes du devis */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Lignes du devis</h3>
              <Button
                type="button"
                variant="outline"
                onClick={addLigne}
                className="flex items-center gap-2"
              >
                <Plus size={16} />
                Ajouter une ligne
              </Button>
            </div>

            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Description</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 w-24">Qté</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 w-32">Prix unit. (€)</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 w-32">Total (€)</th>
                      <th className="w-12"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {lignes.map((ligne, index) => (
                      <tr key={index}>
                        <td className="py-3 px-4">
                          <Input
                            value={ligne.description}
                            onChange={(e) => handleLigneChange(index, 'description', e.target.value)}
                            placeholder="Description du produit/service..."
                          />
                        </td>
                        <td className="py-3 px-4">
                          <Input
                            type="number"
                            value={ligne.quantite}
                            onChange={(e) => handleLigneChange(index, 'quantite', parseFloat(e.target.value) || 0)}
                            min="0"
                            step="0.01"
                          />
                        </td>
                        <td className="py-3 px-4">
                          <Input
                            type="number"
                            value={ligne.prixUnit}
                            onChange={(e) => handleLigneChange(index, 'prixUnit', parseFloat(e.target.value) || 0)}
                            min="0"
                            step="0.01"
                          />
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-right font-medium">
                            {ligne.total.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {lignes.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeLigne(index)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 size={16} />
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Récapitulatif des totaux */}
          <div className="bg-gray-50 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <Calculator size={20} className="text-indigo-600" />
              <h3 className="text-lg font-medium text-gray-900">Récapitulatif</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total HT :</span>
                    <span className="font-medium">
                      {totaux.totalHT.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      TVA ({formData.tva}%) {formData.autoliquidation && '(autoliq.)'}:
                    </span>
                    <span className="font-medium">
                      {totaux.totalTVA.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                    </span>
                  </div>
                  
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-gray-600">Total TTC :</span>
                    <span className="font-medium">
                      {totaux.totalTTC.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                    </span>
                  </div>
                </div>
              </div>
              
              <div>
                {formData.retenueGarantie > 0 && (
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Retenue ({formData.retenueGarantie}%) :</span>
                      <span className="text-red-600 font-medium">
                        -{totaux.montantRetenue.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                      </span>
                    </div>
                    
                    <div className="flex justify-between border-t pt-2 text-lg font-bold">
                      <span className="text-gray-900">Net à payer :</span>
                      <span className="text-indigo-600">
                        {totaux.montantFinal.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                      </span>
                    </div>
                  </div>
                )}
                
                {formData.retenueGarantie === 0 && (
                  <div className="flex justify-between text-lg font-bold">
                    <span className="text-gray-900">Net à payer :</span>
                    <span className="text-indigo-600">
                      {totaux.totalTTC.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes et commentaires
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              rows={4}
              placeholder="Notes internes, commentaires..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
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
              {loading ? 'Sauvegarde...' : devis ? 'Mettre à jour' : 'Créer le devis'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}