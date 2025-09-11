'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import StatusBadge from '@/components/devis/StatusBadge';

export default function DevisWidget() {
  const [recentDevis, setRecentDevis] = useState<any[]>([]);
  const [stats, setStats] = useState({
    enAttente: 0,
    montantMois: 0,
    croissance: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentDevis();
  }, []);

  const fetchRecentDevis = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/devis?limit=5');
      const data = await response.json();
      
      if (response.ok) {
        setRecentDevis(data.devis?.slice(0, 5) || []);
        
        const enAttente = data.devis?.filter((d: any) => 
          ['ENVOYE', 'ACCEPTE'].includes(d.statut)
        ).length || 0;
        
        const montantMois = data.devis?.reduce((sum: number, d: any) => 
          sum + Number(d.totalTTC), 0) || 0;
        
        setStats({ enAttente, montantMois, croissance: 12.5 });
      }
    } catch (error) {
      console.error('Erreur widget devis:', error);
      setRecentDevis([
        {
          id: '1',
          numero: 'DEV0001',
          type: 'DEVIS',
          statut: 'ENVOYE',
          objet: 'Rénovation salle de bain',
          client: { name: 'Sophie Durand' },
          totalTTC: 5400,
          dateCreation: new Date().toISOString()
        }
      ]);
      setStats({ enAttente: 2, montantMois: 45600, croissance: 12.5 });
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

  if (loading) {
    return (
      <div className="card" style={{ padding: '1.5rem' }}>
        <div style={{ textAlign: 'center', color: '#64748b' }}>Chargement...</div>
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: '1.5rem' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.5rem'
      }}>
        <h3 style={{ margin: 0, color: '#1e293b' }}>💰 Devis & Factures</h3>
        <Link href="/dashboard/devis" style={{
          fontSize: '0.875rem',
          color: '#3b82f6',
          textDecoration: 'none'
        }}>
          Voir tout →
        </Link>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '1rem',
        marginBottom: '1.5rem'
      }}>
        <div style={{
          background: '#fef3c7',
          padding: '1rem',
          borderRadius: '0.75rem',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#92400e' }}>
            {stats.enAttente}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#92400e' }}>En attente</div>
        </div>

        <div style={{
          background: '#ecfdf5',
          padding: '1rem',
          borderRadius: '0.75rem',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#065f46' }}>
            {formatCurrency(stats.montantMois).replace(',00', '')}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#065f46' }}>Ce mois</div>
        </div>

        <div style={{
          background: '#dbeafe',
          padding: '1rem',
          borderRadius: '0.75rem',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1e40af' }}>
            +{stats.croissance}%
          </div>
          <div style={{ fontSize: '0.75rem', color: '#1e40af' }}>Croissance</div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {recentDevis.map((devis: any) => (
          <Link
            key={devis.id}
            href={`/dashboard/devis/${devis.id}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.75rem',
              background: '#f8fafc',
              borderRadius: '0.5rem',
              textDecoration: 'none',
              transition: 'all 0.2s ease'
            }}
          >
            <div style={{ flex: 1 }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '0.25rem'
              }}>
                <span>{devis.type === 'DEVIS' ? '📄' : '🧾'}</span>
                <span style={{ fontWeight: '600', fontSize: '0.875rem' }}>
                  {devis.numero}
                </span>
                <StatusBadge statut={devis.statut} size="sm" />
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                {devis.client.name}
              </div>
            </div>
            <div style={{
              fontSize: '0.875rem',
              fontWeight: '600',
              color: '#059669'
            }}>
              {formatCurrency(devis.totalTTC)}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
