'use client';

import Link from 'next/link';

interface SituationCardProps {
  situation: {
    id: string;
    numero: string;
    situationNumero: number;
    avancement: number;
    totalTTC: number;
    statut: string;
    dateCreation: string;
    notes?: string;
    ligneDevis: any[];
  };
  onSelect?: () => void;
  onRefresh?: () => void;
}

export default function SituationCard({ situation, onSelect, onRefresh }: SituationCardProps) {
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
    <div 
      className="card"
      style={{
        padding: '1.5rem',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        border: '1px solid #e2e8f0'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
      onClick={onSelect}
    >
      {/* En-tête */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '1rem'
      }}>
        <div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '0.25rem'
          }}>
            <span style={{ fontSize: '1.25rem' }}>📊</span>
            <span style={{
              fontWeight: 'bold',
              color: '#1e293b',
              fontSize: '1.125rem'
            }}>
              Situation S{String(situation.situationNumero).padStart(2, '0')}
            </span>
          </div>
          <div style={{
            fontSize: '0.875rem',
            color: '#64748b'
          }}>
            {situation.numero}
          </div>
        </div>

        <span style={{
          background: getStatusColor(situation.statut),
          color: 'white',
          padding: '0.25rem 0.75rem',
          borderRadius: '1rem',
          fontSize: '0.75rem',
          fontWeight: '500'
        }}>
          {getStatusText(situation.statut)}
        </span>
      </div>

      {/* Progression */}
      <div style={{ marginBottom: '1rem' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '0.5rem'
        }}>
          <span style={{ fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>
            Avancement
          </span>
          <span style={{ fontSize: '0.875rem', fontWeight: 'bold', color: '#059669' }}>
            {situation.avancement}%
          </span>
        </div>
        
        <div style={{
          width: '100%',
          height: '0.5rem',
          background: '#e5e7eb',
          borderRadius: '0.25rem',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${Math.min(situation.avancement, 100)}%`,
            height: '100%',
            background: situation.avancement >= 100 ? '#10b981' : '#3b82f6',
            borderRadius: '0.25rem',
            transition: 'width 0.3s ease'
          }} />
        </div>
      </div>

      {/* Montant */}
      <div style={{
        background: '#f0f9ff',
        padding: '0.75rem',
        borderRadius: '0.5rem',
        marginBottom: '1rem'
      }}>
        <div style={{
          fontSize: '1.25rem',
          fontWeight: 'bold',
          color: '#0369a1',
          textAlign: 'center'
        }}>
          {formatCurrency(situation.totalTTC)}
        </div>
        <div style={{
          fontSize: '0.75rem',
          color: '#0369a1',
          textAlign: 'center'
        }}>
          {situation.ligneDevis.length} ligne{situation.ligneDevis.length > 1 ? 's' : ''}
        </div>
      </div>

      {/* Informations */}
      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
        <div style={{ marginBottom: '0.25rem' }}>
          Créée le {formatDate(situation.dateCreation)}
        </div>
        {situation.notes && (
          <div style={{
            fontStyle: 'italic',
            background: '#f8fafc',
            padding: '0.5rem',
            borderRadius: '0.25rem',
            marginTop: '0.5rem'
          }}>
            "{situation.notes.length > 60 ? situation.notes.substring(0, 60) + '...' : situation.notes}"
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{
        marginTop: '1rem',
        paddingTop: '1rem',
        borderTop: '1px solid #e5e7eb',
        display: 'flex',
        gap: '0.5rem'
      }}>
        <Link
          href={`/dashboard/devis/${situation.id}`}
          style={{
            flex: 1,
            padding: '0.5rem',
            background: '#f1f5f9',
            color: '#374151',
            textDecoration: 'none',
            borderRadius: '0.25rem',
            textAlign: 'center',
            fontSize: '0.75rem'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          👁️ Voir
        </Link>
        
        {situation.statut === 'BROUILLON' && (
          <Link
            href={`/dashboard/devis/${situation.id}/edit`}
            style={{
              flex: 1,
              padding: '0.5rem',
              background: '#dbeafe',
              color: '#1e40af',
              textDecoration: 'none',
              borderRadius: '0.25rem',
              textAlign: 'center',
              fontSize: '0.75rem'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            ✏️ Modifier
          </Link>
        )}
      </div>
    </div>
  );
}
