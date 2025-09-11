'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Send, Eye, Download, Calculator, Plus, Trash2, FileText, CreditCard, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useDevis, LigneDevis } from '@/hooks/useDevis';
import { usePDF } from '@/hooks/usePDF';
import { useToastContext } from '@/components/providers/ToastProvider';
import { DevisType } from '@prisma/client';
import DevisPrintView from '@/components/devis/DevisPrintView';

interface Client {
  id: string;
  name: string;
  email: string;
  company?: string;
  phone?: string;
  address?: string;
  ville?: string;
  codePostal?: string;
}

interface Chantier {
  id: string;
  nom: string;
  adresse?: string;
}

const TYPE_OPTIONS = [
  { value: 'DEVIS', label: 'Devis', icon: '📄' },
  { value: 'FACTURE', label: 'Facture', icon: '🧾' },
  { value: 'AVOIR', label: 'Avoir', icon: '🔄' },
];

function NouveauDevisPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { createDevis, updateDevis, loading, calculateTotals, convertToFacture } = useDevis();
  const { downloadPDF, previewPDF, getPDFBlob } = usePDF();
  const { success, error: showError } = useToastContext();
  
  const [clients, setClients] = useState<Client[]>([]);
  const [chantiers, setChantiers] = useState<Chantier[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [loadingChantiers, setLoadingChantiers] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    clientId: searchParams.get('clientId') || '',
    chantierId: searchParams.get('chantierId') || '',
    type: (searchParams.get('type') as DevisType) || 'DEVIS' as DevisType,
    objet: '',
    dateEcheance: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    notes: '',
    conditionsVente: 'Conditions générales de vente applicables selon nos CGV.',
    modalitesPaiement: 'Paiement à 30 jours fin de mois par virement ou chèque.',
    tva: 20,
    retenueGarantie: 0,
    autoliquidation: false,
  });

  const [lignes, setLignes] = useState<Omit<LigneDevis, 'id' | 'ordre'>[]>([
    { description: '', quantite: 1, prixUnit: 0, total: 0 }
  ]);

  // Calculs automatiques en temps réel
  const totaux = calculateTotals(
    lignes as LigneDevis[], 
    formData.tva, 
    formData.autoliquidation, 
    formData.retenueGarantie
  );

  // Mock devis for preview
  const previewDevis = {
    id: 'preview',
    numero: 'DEV-PREVIEW',
    type: formData.type,
    objet: formData.objet || 'Aperçu du devis...',
    dateCreation: new Date().toISOString(),
    dateEcheance: formData.dateEcheance,
    client: clients.find(c => c.id === formData.clientId) || {
      id: '',
      name: 'Client à sélectionner',
      email: '',
    },
    chantier: chantiers.find(c => c.id === formData.chantierId),
    ligneDevis: lignes.filter(l => l.description.trim()),
    totalHT: totaux.totalHT,
    totalTVA: totaux.totalTVA,
    totalTTC: totaux.totalTTC,
    montant: totaux.montantFinal,
    tva: formData.tva,
    autoliquidation: formData.autoliquidation,
    retenueGarantie: formData.retenueGarantie,
    notes: formData.notes,
    conditionsVente: formData.conditionsVente,
    modalitesPaiement: formData.modalitesPaiement,
    statut: 'BROUILLON'
  };

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
    
    if (!formData.clientId || !formData.dateEcheance || !formData.objet) {
      showError('Erreur', 'Le client, l\'objet et la date d\'échéance sont obligatoires');
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
      setActionLoading('save');
      const result = await createDevis(submitData);
      if (result) {
        success('Succès', 'Le devis a été créé avec succès');
        router.push(`/dashboard/devis/${result.id}`);
      }
    } catch (error: any) {
      showError('Erreur', error.message || 'Une erreur est survenue lors de la sauvegarde');
    } finally {
      setActionLoading(null);
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

  const handlePreviewPDF = async () => {
    if (!formData.clientId || !formData.objet) {
      showError('Erreur', 'Veuillez remplir au minimum le client et l\'objet pour la prévisualisation');
      return;
    }

    try {
      setActionLoading('preview');
      await previewPDF(previewDevis as any);
    } catch (error: any) {
      showError('Erreur', error.message || 'Erreur lors de la prévisualisation PDF');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDownloadPDF = async () => {
    if (!formData.clientId || !formData.objet) {
      showError('Erreur', 'Veuillez remplir au minimum le client et l\'objet pour le téléchargement');
      return;
    }

    try {
      setActionLoading('download');
      await downloadPDF(previewDevis as any);
      success('Succès', 'PDF téléchargé avec succès');
    } catch (error: any) {
      showError('Erreur', error.message || 'Erreur lors du téléchargement PDF');
    } finally {
      setActionLoading(null);
    }
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
  };

  const isFormValid = formData.clientId && formData.objet && lignes.some(l => l.description.trim());

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Navigation */}
        <div className="flex items-center justify-between mb-8">
          <Link 
            href="/dashboard/devis"
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Retour aux devis</span>
          </Link>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={handlePreviewPDF}
              disabled={!isFormValid || !!actionLoading}
              className="flex items-center gap-2"
            >
              {actionLoading === 'preview' ? (
                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Eye size={16} />
              )}
              Prévisualiser PDF
            </Button>
            
            <Button
              variant="outline"
              onClick={handleDownloadPDF}
              disabled={!isFormValid || !!actionLoading}
              className="flex items-center gap-2"
            >
              {actionLoading === 'download' ? (
                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Download size={16} />
              )}
              Télécharger PDF
            </Button>
          </div>
        </div>

        {/* Titre et type */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            {TYPE_OPTIONS.map(option => (
              <button
                key={option.value}
                onClick={() => handleChange('type', option.value)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all ${
                  formData.type === option.value
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-600'
                }`}
              >
                <span className="text-xl">{option.icon}</span>
                <span className="font-medium">{option.label}</span>
              </button>
            ))}
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Nouveau {TYPE_OPTIONS.find(t => t.value === formData.type)?.label}
          </h1>
          <p className="text-gray-500">
            Créez votre document avec prévisualisation temps réel
          </p>
        </div>

        {/* Interface principale avec sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Formulaire principal */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Informations de base */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FileText size={20} className="text-indigo-600" />
                  Informations générales
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Objet *
                    </label>
                    <Input
                      value={formData.objet}
                      onChange={(e) => handleChange('objet', e.target.value)}
                      placeholder="Ex: Rénovation salle de bain complète"
                      required
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
                </div>
              </div>

              {/* Lignes du devis */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Calculator size={20} className="text-indigo-600" />
                    Lignes du devis
                  </h2>
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
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="py-3 px-4">
                              <Input
                                value={ligne.description}
                                onChange={(e) => handleLigneChange(index, 'description', e.target.value)}
                                placeholder="Description du produit/service..."
                                className="border-0 focus:ring-1"
                              />
                            </td>
                            <td className="py-3 px-4">
                              <Input
                                type="number"
                                value={ligne.quantite}
                                onChange={(e) => handleLigneChange(index, 'quantite', parseFloat(e.target.value) || 0)}
                                min="0"
                                step="0.01"
                                className="border-0 focus:ring-1 text-center"
                              />
                            </td>
                            <td className="py-3 px-4">
                              <Input
                                type="number"
                                value={ligne.prixUnit}
                                onChange={(e) => handleLigneChange(index, 'prixUnit', parseFloat(e.target.value) || 0)}
                                min="0"
                                step="0.01"
                                className="border-0 focus:ring-1 text-right"
                              />
                            </td>
                            <td className="py-3 px-4">
                              <div className="text-right font-medium text-green-600">
                                {formatCurrency(ligne.total)}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              {lignes.length > 1 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeLigne(index)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
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

              {/* Options avancées */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Options avancées</h2>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                    <div className="flex items-center pt-6">
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
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={loading}
                >
                  Annuler
                </Button>
                
                <Button
                  type="submit"
                  disabled={!isFormValid || loading}
                  className="flex items-center gap-2"
                >
                  {actionLoading === 'save' ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Save size={16} />
                  )}
                  Créer le {TYPE_OPTIONS.find(t => t.value === formData.type)?.label.toLowerCase()}
                </Button>
              </div>
            </form>
          </div>

          {/* Sidebar droite - Aperçu et récapitulatif */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              {/* Récapitulatif des totaux */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Calculator size={20} className="text-indigo-600" />
                  Récapitulatif
                </h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total HT :</span>
                    <span className="font-medium">{formatCurrency(totaux.totalHT)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      TVA ({formData.tva}%) {formData.autoliquidation && '(autoliq.)'}:
                    </span>
                    <span className="font-medium">{formatCurrency(totaux.totalTVA)}</span>
                  </div>
                  
                  <div className="flex justify-between border-t pt-3">
                    <span className="text-gray-600">Total TTC :</span>
                    <span className="font-medium">{formatCurrency(totaux.totalTTC)}</span>
                  </div>
                  
                  {formData.retenueGarantie > 0 && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Retenue ({formData.retenueGarantie}%) :</span>
                        <span className="text-red-600 font-medium">
                          -{formatCurrency(totaux.montantRetenue)}
                        </span>
                      </div>
                      <div className="flex justify-between border-t pt-3 text-lg font-bold">
                        <span className="text-gray-900">Net à payer :</span>
                        <span className="text-indigo-600">{formatCurrency(totaux.montantFinal)}</span>
                      </div>
                    </>
                  )}
                  
                  {formData.retenueGarantie === 0 && (
                    <div className="flex justify-between border-t pt-3 text-lg font-bold">
                      <span className="text-gray-900">Net à payer :</span>
                      <span className="text-indigo-600">{formatCurrency(totaux.totalTTC)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Status de validation */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">État du formulaire</h3>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    {formData.clientId ? (
                      <CheckCircle size={16} className="text-green-500" />
                    ) : (
                      <AlertCircle size={16} className="text-orange-500" />
                    )}
                    <span className={formData.clientId ? 'text-green-700' : 'text-orange-700'}>
                      Client sélectionné
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {formData.objet ? (
                      <CheckCircle size={16} className="text-green-500" />
                    ) : (
                      <AlertCircle size={16} className="text-orange-500" />
                    )}
                    <span className={formData.objet ? 'text-green-700' : 'text-orange-700'}>
                      Objet renseigné
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {lignes.some(l => l.description.trim()) ? (
                      <CheckCircle size={16} className="text-green-500" />
                    ) : (
                      <AlertCircle size={16} className="text-orange-500" />
                    )}
                    <span className={lignes.some(l => l.description.trim()) ? 'text-green-700' : 'text-orange-700'}>
                      Lignes complétées
                    </span>
                  </div>
                  
                  <div className="pt-2 border-t">
                    <span className="text-sm text-gray-500">
                      {lignes.filter(l => l.description.trim()).length} ligne(s) • {formatCurrency(totaux.totalTTC)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Aperçu PDF miniature */}
              {showPreview && isFormValid && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Aperçu PDF</h3>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div style={{ transform: 'scale(0.3)', transformOrigin: 'top left', width: '333%', height: '400px', overflow: 'hidden' }}>
                      <DevisPrintView devis={previewDevis as any} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NouveauDevisPage() {
  return (
    <Suspense fallback={
      <div className="bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    }>
      <NouveauDevisPageContent />
    </Suspense>
  );
}