'use client';

import Link from 'next/link';

interface DevisCardProps {
  devis: {
    id: string;
    numero: string;
    type: 'DEVIS' | 'FACTURE';
    statut: string;
    objet: string;
    totalTTC?: number;
    dateCreation: string;
    client: {
      id: string;
      name: string;
      company?: string;
    };
    chantier?: {
      id: string;
      nom: string;
    };
  };
}

export default function DevisCard({ devis }: DevisCardProps) {
  const getStatusColor = (statut: string) => {
    const colors = {
      BROUILLON: '#64748b',
      ENVOYE: '#3b82f6',
      ACCEPTE: '#10b981',
      REFUSE: '#ef4444',
      PAYE: '#059669',
      ANNULE: '#6b7280'
    };
    return colors[statut as keyof typeof colors] || '#64748b';
  };

  const getStatusText = (statut: string) => {
    const texts = {
      BROUILLON: 'Brouillon',
      ENVOYE: 'Envoyé',
      ACCEPTE: 'Accepté',
      REFUSE: 'Refusé',
      PAYE: 'Payé',
      ANNULE: 'Annulé'
    };
    return texts[statut as keyof typeof texts] || statut;
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
  
  return (
    <Link 
      href={`/dashboard/devis/${devis.id}`}
      className="block h-full transition-all duration-300 transform hover:scale-102 hover:shadow-lg"
    >
      <div className="h-full bg-white shadow rounded-lg overflow-hidden border border-gray-200 hover:border-indigo-300">
        <div className="px-4 py-5 sm:p-6 flex flex-col h-full">
          <div className="flex justify-between items-start">
            <div className="text-lg font-semibold text-indigo-600 truncate mb-2">
              {devis.numero}
            </div>
            <span 
              style={{ 
                backgroundColor: `${getStatusColor(devis.statut)}20`,
                color: getStatusColor(devis.statut),
              }}
              className="px-2 py-1 text-xs font-semibold rounded-full"
            >
              {getStatusText(devis.statut)}
            </span>
          </div>
          
          <div className="mt-1 text-sm text-gray-500">
            {devis.type === 'DEVIS' ? 'Devis' : 'Facture'}
          </div>
          
          <h3 className="mt-2 text-base font-medium text-gray-900 line-clamp-2">
            {devis.objet}
          </h3>
          
          <div className="mt-3 flex-grow">
            <div className="flex items-center text-sm text-gray-500">
              <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
              <span className="truncate">{devis.client.name}</span>
            </div>
            
            {devis.chantier && (
              <div className="mt-1 flex items-center text-sm text-gray-500">
                <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 01-1.581.814L10 13.197l-4.419 2.617A1 1 0 014 15V4z" clipRule="evenodd" />
                </svg>
                <span className="truncate">{devis.chantier.nom}</span>
              </div>
            )}
            
            <div className="mt-1 flex items-center text-sm text-gray-500">
              <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
              <span>{formatDate(devis.dateCreation)}</span>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <div className="text-sm font-medium text-gray-500">
                Montant total
              </div>
              <div className="text-lg font-bold text-gray-900">
                {formatCurrency(devis.totalTTC || 0)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
