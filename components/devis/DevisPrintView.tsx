'use client';

import { forwardRef } from 'react';

interface DevisPrintViewProps {
  devis: any;
}

const DevisPrintView = forwardRef<HTMLDivElement, DevisPrintViewProps>(
  ({ devis }, ref) => {
    if (!devis) {
      return (
        <div ref={ref} className="p-8 bg-white">
          <p>Aucun devis à afficher</p>
        </div>
      );
    }

    return (
      <div ref={ref} className="p-8 bg-white max-w-4xl mx-auto">
        {/* En-tête entreprise */}
        <div className="border-b border-gray-200 pb-6 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">ChantierPro</h1>
              <div className="text-sm text-gray-600">
                <p>123 Rue de la Construction</p>
                <p>75001 Paris, France</p>
                <p>Tél: +33 1 23 45 67 89</p>
                <p>Email: contact@chantierpro.fr</p>
              </div>
            </div>
            <div className="text-right">
              <h2 className="text-2xl font-bold text-blue-600 mb-2">DEVIS</h2>
              <div className="text-sm text-gray-600">
                <p><strong>N°:</strong> {devis.numero || 'DEV-2024-001'}</p>
                <p><strong>Date:</strong> {devis.dateCreation ? new Date(devis.dateCreation).toLocaleDateString('fr-FR') : new Date().toLocaleDateString('fr-FR')}</p>
                <p><strong>Validité:</strong> {devis.dateEcheance ? new Date(devis.dateEcheance).toLocaleDateString('fr-FR') : '30 jours'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Informations client */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Client</h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm text-gray-700">
              <p><strong>{devis.client?.name || 'Nom du client'}</strong></p>
              {devis.client?.company && <p>{devis.client.company}</p>}
              <p>{devis.client?.email || 'client@email.com'}</p>
              {devis.client?.phone && <p>{devis.client.phone}</p>}
              {devis.client?.address && <p>{devis.client.address}</p>}
            </div>
          </div>
        </div>

        {/* Objet du devis */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Objet</h3>
          <p className="text-gray-700">{devis.objet || 'Travaux de construction/rénovation'}</p>
        </div>

        {/* Détail des prestations */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Détail des Prestations</h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700">Description</th>
                  <th className="border border-gray-300 px-4 py-3 text-right font-semibold text-gray-700">Quantité</th>
                  <th className="border border-gray-300 px-4 py-3 text-right font-semibold text-gray-700">Prix Unit. HT</th>
                  <th className="border border-gray-300 px-4 py-3 text-right font-semibold text-gray-700">Total HT</th>
                </tr>
              </thead>
              <tbody>
                {devis.lignes?.length > 0 ? (
                  devis.lignes.map((ligne: any, index: number) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="border border-gray-300 px-4 py-3 text-gray-700">
                        <div>
                          <div className="font-medium">{ligne.designation || `Prestation ${index + 1}`}</div>
                          {ligne.description && (
                            <div className="text-sm text-gray-600 mt-1">{ligne.description}</div>
                          )}
                        </div>
                      </td>
                      <td className="border border-gray-300 px-4 py-3 text-right text-gray-700">
                        {ligne.quantite || 1} {ligne.unite || 'u'}
                      </td>
                      <td className="border border-gray-300 px-4 py-3 text-right text-gray-700">
                        {(ligne.prixUnitaire || 0).toLocaleString('fr-FR')} €
                      </td>
                      <td className="border border-gray-300 px-4 py-3 text-right font-semibold text-gray-700">
                        {((ligne.quantite || 1) * (ligne.prixUnitaire || 0)).toLocaleString('fr-FR')} €
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="border border-gray-300 px-4 py-3 text-gray-700">Travaux de construction/rénovation</td>
                    <td className="border border-gray-300 px-4 py-3 text-right text-gray-700">1 u</td>
                    <td className="border border-gray-300 px-4 py-3 text-right text-gray-700">{(devis.totalHT || devis.montant || 0).toLocaleString('fr-FR')} €</td>
                    <td className="border border-gray-300 px-4 py-3 text-right font-semibold text-gray-700">{(devis.totalHT || devis.montant || 0).toLocaleString('fr-FR')} €</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totaux */}
        <div className="mb-8">
          <div className="flex justify-end">
            <div className="w-80">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="space-y-2">
                  <div className="flex justify-between text-gray-700">
                    <span>Total HT:</span>
                    <span className="font-semibold">{(devis.totalHT || devis.montant || 0).toLocaleString('fr-FR')} €</span>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span>TVA ({devis.tva || 20}%):</span>
                    <span className="font-semibold">{(devis.totalTVA || ((devis.totalHT || devis.montant || 0) * (devis.tva || 20) / 100)).toLocaleString('fr-FR')} €</span>
                  </div>
                  <div className="border-t border-gray-300 pt-2">
                    <div className="flex justify-between text-lg font-bold text-gray-900">
                      <span>Total TTC:</span>
                      <span>{(devis.totalTTC || ((devis.totalHT || devis.montant || 0) * (1 + (devis.tva || 20) / 100))).toLocaleString('fr-FR')} €</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Conditions */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Conditions</h3>
          <div className="text-sm text-gray-700 space-y-2">
            <p><strong>Modalités de paiement:</strong> {devis.modalitesPaiement || '30% à la commande, 40% en cours de travaux, 30% à la livraison'}</p>
            <p><strong>Délai d'exécution:</strong> {devis.delaiExecution || '4-6 semaines à compter de la validation du devis'}</p>
            <p><strong>Validité du devis:</strong> Ce devis est valable {devis.validite || 30} jours à compter de sa date d'émission.</p>
          </div>
        </div>

        {/* Notes */}
        {devis.notes && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Notes</h3>
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
              <p className="text-sm text-gray-700">{devis.notes}</p>
            </div>
          </div>
        )}

        {/* Conditions de vente */}
        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Conditions Générales de Vente</h3>
          <div className="text-xs text-gray-600 leading-relaxed">
            <p>{devis.conditionsVente || 'Les présentes conditions générales de vente régissent les relations contractuelles entre ChantierPro et ses clients. L\'acceptation du devis implique l\'acceptation pleine et entière des présentes conditions.'}</p>
          </div>
        </div>

        {/* Signatures */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <p className="text-sm font-semibold text-gray-900 mb-4">ChantierPro</p>
              <div className="h-16 border-b border-gray-300"></div>
              <p className="text-xs text-gray-600 mt-2">Signature et cachet</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 mb-4">Bon pour accord - Client</p>
              <div className="h-16 border-b border-gray-300"></div>
              <p className="text-xs text-gray-600 mt-2">Signature précédée de "Bon pour accord"</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

DevisPrintView.displayName = 'DevisPrintView';

export default DevisPrintView;