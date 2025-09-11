"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, Edit, Download, Send, Check, X, 
  FileText, Calendar, DollarSign, User, MapPin, 
  Clock, AlertCircle, CheckCircle2, CreditCard,
  Eye, Printer, Mail, Pen
} from "lucide-react";
import { useDevis } from "@/hooks/useDevis";
import { usePDF } from "@/hooks/usePDF";
import { useToastContext } from "@/components/providers/ToastProvider";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { DevisForm } from "@/components/devis/DevisForm";
import { SignatureComponent } from "@/components/devis/SignatureComponent";

const statusColors = {
  BROUILLON: { bg: "bg-gray-100", text: "text-gray-800", icon: "📝" },
  ENVOYE: { bg: "bg-blue-100", text: "text-blue-800", icon: "📤" },
  ACCEPTE: { bg: "bg-green-100", text: "text-green-800", icon: "✅" },
  REFUSE: { bg: "bg-red-100", text: "text-red-800", icon: "❌" },
  FACTURE: { bg: "bg-purple-100", text: "text-purple-800", icon: "💳" },
  EXPIRE: { bg: "bg-orange-100", text: "text-orange-800", icon: "⏰" },
  ANNULE: { bg: "bg-gray-100", text: "text-gray-600", icon: "🚫" },
  PAYE: { bg: "bg-green-100", text: "text-green-800", icon: "✅" }
};

const statusLabels = {
  BROUILLON: 'Brouillon',
  ENVOYE: 'Envoyé',
  ACCEPTE: 'Accepté',
  REFUSE: 'Refusé',
  FACTURE: 'Facturé',
  EXPIRE: 'Expiré',
  ANNULE: 'Annulé',
  PAYE: 'Payé'
};

const typeLabels = {
  DEVIS: 'Devis',
  FACTURE: 'Facture',
  AVOIR: 'Avoir'
};

export default function DevisDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { 
    currentDevis, 
    loading, 
    error, 
    fetchDevisById, 
    updateDevis, 
    convertToFacture,
    clearError 
  } = useDevis();
  const { downloadPDF, previewPDF } = usePDF();
  const { success, error: showError } = useToastContext();
  
  const [showEditForm, setShowEditForm] = useState(false);
  const [showSignature, setShowSignature] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const devisId = params.id as string;

  useEffect(() => {
    if (devisId) {
      fetchDevisById(devisId);
    }
  }, [devisId, fetchDevisById]);

  useEffect(() => {
    if (error) {
      showError('Erreur', error);
      clearError();
    }
  }, [error, showError, clearError]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const canEdit = () => {
    if (!user || !currentDevis) return false;
    return user.role === 'ADMIN' || 
           (user.role === 'COMMERCIAL' && currentDevis.statut === 'BROUILLON');
  };

  const canSign = () => {
    if (!user || !currentDevis) return false;
    return user.role === 'CLIENT' && 
           currentDevis.clientId === user.id && 
           currentDevis.statut === 'ENVOYE';
  };

  const canConvertToFacture = () => {
    if (!user || !currentDevis) return false;
    return (user.role === 'ADMIN' || user.role === 'COMMERCIAL') &&
           currentDevis.type === 'DEVIS' &&
           currentDevis.statut === 'ACCEPTE';
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!currentDevis) return;

    setActionLoading(`status-${newStatus}`);
    try {
      await updateDevis(currentDevis.id, { statut: newStatus as any });
      success('Succès', `Statut mis à jour : ${statusLabels[newStatus as keyof typeof statusLabels]}`);
    } catch (error: any) {
      showError('Erreur', error.message || 'Erreur lors de la mise à jour du statut');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDownloadPDF = async () => {
    if (!currentDevis) return;

    setActionLoading('pdf');
    try {
      await downloadPDF(currentDevis, {
        includeSignature: !!currentDevis.dateSignature
      });
      success('Succès', 'PDF téléchargé avec succès');
    } catch (error: any) {
      showError('Erreur', error.message || 'Erreur lors de la génération du PDF');
    } finally {
      setActionLoading(null);
    }
  };

  const handlePreviewPDF = async () => {
    if (!currentDevis) return;

    setActionLoading('preview');
    try {
      await previewPDF(currentDevis, {
        includeSignature: !!currentDevis.dateSignature
      });
    } catch (error: any) {
      showError('Erreur', error.message || 'Erreur lors de la prévisualisation du PDF');
    } finally {
      setActionLoading(null);
    }
  };

  const handleConvertToFacture = async () => {
    if (!currentDevis) return;

    setActionLoading('convert');
    try {
      await convertToFacture(currentDevis.id);
      success('Succès', 'Devis converti en facture avec succès');
      router.push('/dashboard/devis');
    } catch (error: any) {
      showError('Erreur', error.message || 'Erreur lors de la conversion');
    } finally {
      setActionLoading(null);
    }
  };

  const handleFormSuccess = () => {
    setShowEditForm(false);
    if (devisId) {
      fetchDevisById(devisId);
    }
  };

  if (loading && !currentDevis) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="bg-white rounded-lg p-6 space-y-4">
              <div className="h-6 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!currentDevis && !loading) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center py-12">
            <AlertCircle size={64} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Devis non trouvé</h3>
            <p className="text-gray-500 mb-6">
              Le devis demandé n'existe pas ou vous n'avez pas les droits pour le consulter.
            </p>
            <Link href="/dashboard/devis">
              <Button>
                <ArrowLeft size={16} className="mr-2" />
                Retour aux devis
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!currentDevis) return null;

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Navigation */}
        <div className="flex items-center justify-between mb-8">
          <Link 
            href="/dashboard/devis"
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft size={20} />
            <span>Retour aux devis</span>
          </Link>

          <div className="flex items-center gap-2">
            {canEdit() && (
              <Button
                variant="outline"
                onClick={() => setShowEditForm(true)}
                disabled={!!actionLoading}
              >
                <Edit size={16} className="mr-2" />
                Modifier
              </Button>
            )}

            <Button
              variant="outline"
              onClick={handlePreviewPDF}
              disabled={actionLoading === 'preview'}
            >
              {actionLoading === 'preview' ? (
                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mr-2" />
              ) : (
                <Eye size={16} className="mr-2" />
              )}
              Prévisualiser
            </Button>

            <Button
              variant="outline"
              onClick={handleDownloadPDF}
              disabled={actionLoading === 'pdf'}
            >
              {actionLoading === 'pdf' ? (
                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mr-2" />
              ) : (
                <Download size={16} className="mr-2" />
              )}
              PDF
            </Button>
          </div>
        </div>

        {/* En-tête du devis */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  {typeLabels[currentDevis.type]} {currentDevis.numero}
                </h1>
                <p className="text-gray-600">{currentDevis.objet}</p>
              </div>
              
              <div className="text-right">
                <div className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${statusColors[currentDevis.statut].bg} ${statusColors[currentDevis.statut].text}`}>
                  <span className="mr-1">{statusColors[currentDevis.statut].icon}</span>
                  <span>{statusLabels[currentDevis.statut]}</span>
                </div>
                
                <div className="mt-3 text-2xl font-bold text-indigo-600">
                  {formatAmount(currentDevis.montant)}
                </div>
              </div>
            </div>

            {/* Informations principales */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <User size={20} className="text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Client</h3>
                  <p className="text-gray-600">{currentDevis.client.name}</p>
                  {currentDevis.client.company && (
                    <p className="text-sm text-gray-500">{currentDevis.client.company}</p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Calendar size={20} className="text-green-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Échéance</h3>
                  <p className="text-gray-600">{formatDate(currentDevis.dateEcheance)}</p>
                  <p className="text-sm text-gray-500">
                    Créé le {formatDate(currentDevis.dateCreation)}
                  </p>
                </div>
              </div>

              {currentDevis.chantier && (
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <MapPin size={20} className="text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Chantier</h3>
                    <p className="text-gray-600">{currentDevis.chantier.nom}</p>
                    {currentDevis.chantier.adresse && (
                      <p className="text-sm text-gray-500">{currentDevis.chantier.adresse}</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Actions rapides */}
            <div className="flex items-center gap-2 mt-6 pt-6 border-t border-gray-200">
              {canSign() && (
                <Button
                  onClick={() => setShowSignature(true)}
                  className="flex items-center gap-2"
                >
                  <Pen size={16} />
                  Signer le devis
                </Button>
              )}

              {canConvertToFacture() && (
                <Button
                  onClick={handleConvertToFacture}
                  disabled={actionLoading === 'convert'}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
                >
                  {actionLoading === 'convert' ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <CreditCard size={16} />
                  )}
                  Convertir en facture
                </Button>
              )}

              {(user?.role === 'ADMIN' || user?.role === 'COMMERCIAL') && currentDevis.statut === 'BROUILLON' && (
                <Button
                  variant="outline"
                  onClick={() => handleStatusChange('ENVOYE')}
                  disabled={actionLoading === 'status-ENVOYE'}
                  className="flex items-center gap-2"
                >
                  {actionLoading === 'status-ENVOYE' ? (
                    <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send size={16} />
                  )}
                  Envoyer au client
                </Button>
              )}

              {user?.role === 'ADMIN' && currentDevis.statut === 'ENVOYE' && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => handleStatusChange('ACCEPTE')}
                    disabled={actionLoading === 'status-ACCEPTE'}
                    className="flex items-center gap-2 text-green-600 border-green-600 hover:bg-green-50"
                  >
                    {actionLoading === 'status-ACCEPTE' ? (
                      <div className="w-4 h-4 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Check size={16} />
                    )}
                    Accepter
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleStatusChange('REFUSE')}
                    disabled={actionLoading === 'status-REFUSE'}
                    className="flex items-center gap-2 text-red-600 border-red-600 hover:bg-red-50"
                  >
                    {actionLoading === 'status-REFUSE' ? (
                      <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <X size={16} />
                    )}
                    Refuser
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Détails du devis */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lignes du devis */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Détail des prestations</h2>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left py-3 px-6 font-medium text-gray-900">Description</th>
                      <th className="text-left py-3 px-6 font-medium text-gray-900">Qté</th>
                      <th className="text-left py-3 px-6 font-medium text-gray-900">P.U.</th>
                      <th className="text-left py-3 px-6 font-medium text-gray-900">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {(currentDevis?.ligneDevis || []).map((ligne, index) => (
                      <tr key={ligne.id || index}>
                        <td className="py-4 px-6">
                          <div className="text-gray-900">{ligne.description}</div>
                        </td>
                        <td className="py-4 px-6 text-gray-600">
                          {ligne.quantite}
                        </td>
                        <td className="py-4 px-6 text-gray-600">
                          {formatAmount(ligne.prixUnit)}
                        </td>
                        <td className="py-4 px-6 font-medium text-gray-900">
                          {formatAmount(ligne.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Récapitulatif et informations */}
          <div className="space-y-6">
            {/* Totaux */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Récapitulatif</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total HT :</span>
                  <span className="font-medium">{formatAmount(currentDevis.totalHT)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    TVA ({currentDevis.tva}%) {currentDevis.autoliquidation && '(autoliq.)'}:
                  </span>
                  <span className="font-medium">{formatAmount(currentDevis.totalTVA)}</span>
                </div>
                
                <div className="flex justify-between border-t pt-3">
                  <span className="text-gray-600">Total TTC :</span>
                  <span className="font-medium">{formatAmount(currentDevis.totalTTC)}</span>
                </div>
                
                {currentDevis.retenueGarantie && currentDevis.retenueGarantie > 0 && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Retenue ({currentDevis.retenueGarantie}%) :</span>
                      <span className="text-red-600 font-medium">
                        -{formatAmount((currentDevis.totalTTC * currentDevis.retenueGarantie) / 100)}
                      </span>
                    </div>
                    <div className="flex justify-between border-t pt-3 text-lg font-bold">
                      <span className="text-gray-900">Net à payer :</span>
                      <span className="text-indigo-600">{formatAmount(currentDevis.montant)}</span>
                    </div>
                  </>
                )}
                
                {(!currentDevis.retenueGarantie || currentDevis.retenueGarantie === 0) && (
                  <div className="flex justify-between border-t pt-3 text-lg font-bold">
                    <span className="text-gray-900">Net à payer :</span>
                    <span className="text-indigo-600">{formatAmount(currentDevis.montant)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Signature */}
            {currentDevis.dateSignature && (
              <div className="bg-green-50 rounded-xl border border-green-200 p-6">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 size={20} className="text-green-600" />
                  <h3 className="font-semibold text-green-900">Devis signé</h3>
                </div>
                <p className="text-sm text-green-800">
                  Signé électroniquement le {formatDate(currentDevis.dateSignature)}
                </p>
                <p className="text-sm text-green-700 mt-1">
                  Par {currentDevis.client.name}
                </p>
              </div>
            )}

            {/* Modalités */}
            {currentDevis.modalitesPaiement && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-3">Modalités de paiement</h3>
                <p className="text-sm text-gray-600">{currentDevis.modalitesPaiement}</p>
              </div>
            )}

            {/* Conditions */}
            {currentDevis.conditionsVente && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-3">Conditions de vente</h3>
                <p className="text-sm text-gray-600">{currentDevis.conditionsVente}</p>
              </div>
            )}

            {/* Notes */}
            {currentDevis.notes && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-3">Notes</h3>
                <p className="text-sm text-gray-600">{currentDevis.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Modals */}
        {showEditForm && (
          <DevisForm 
            devis={currentDevis}
            onClose={() => setShowEditForm(false)}
            onSuccess={handleFormSuccess}
          />
        )}

        {showSignature && (
          <SignatureComponent 
            devis={currentDevis}
            onClose={() => setShowSignature(false)}
            onSigned={handleFormSuccess}
          />
        )}
      </div>
    </div>
  );
}