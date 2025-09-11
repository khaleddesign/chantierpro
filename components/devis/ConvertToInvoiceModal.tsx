'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface ConvertToInvoiceModalProps {
  devis: {
    id: string;
    numero: string;
    totalTTC: number;
  };
  isOpen: boolean;
  onClose: () => void;
}

export default function ConvertToInvoiceModal({ devis, isOpen, onClose }: ConvertToInvoiceModalProps) {
  const [loading, setLoading] = useState(false);
  const [echeanceDays, setEcheanceDays] = useState(30);
  const router = useRouter();

  if (!isOpen) return null;

  const handleConvert = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(`/api/devis/${devis.id}/convert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          options: {
            echeanceDays
          }
        }),
      });

      const result = await response.json();

      if (response.ok) {
        alert(result.message || 'Conversion réussie');
        
        // Redirection vers la facture créée
        if (result.facture?.id) {
          router.push(`/dashboard/devis/${result.facture.id}`);
        } else {
          router.refresh();
          onClose();
        }
      } else {
        alert(result.error || 'Erreur lors de la conversion');
      }
    } catch (error) {
      console.error('Erreur lors de la conversion:', error);
      alert('Une erreur est survenue lors de la conversion');
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

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Convertir en facture
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    Vous êtes sur le point de convertir le devis <span className="font-semibold">{devis.numero}</span> en facture. 
                    Cette action est irréversible.
                  </p>
                </div>
                
                <div className="mt-4 space-y-4">
                  <div>
                    <label htmlFor="echeance" className="block text-sm font-medium text-gray-700">
                      Délai de paiement (jours)
                    </label>
                    <select
                      id="echeance"
                      value={echeanceDays}
                      onChange={(e) => setEcheanceDays(Number(e.target.value))}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    >
                      <option value={15}>15 jours</option>
                      <option value={30}>30 jours</option>
                      <option value={45}>45 jours</option>
                      <option value={60}>60 jours</option>
                    </select>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-md">
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-gray-500">Montant total</span>
                      <span className="text-sm font-medium">{formatCurrency(devis.totalTTC)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Facture à payer avant</span>
                      <span className="text-sm font-medium">
                        {new Date(Date.now() + echeanceDays * 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              disabled={loading}
              onClick={handleConvert}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Conversion en cours...
                </>
              ) : (
                'Convertir en facture'
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Annuler
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
