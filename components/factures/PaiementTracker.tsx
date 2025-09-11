'use client';

import { useState, useEffect } from 'react';
import StatusBadge from '@/components/devis/StatusBadge';

interface PaiementTrackerProps {
  factureId: string;
  montantTotal: number;
  statut: string;
}

export default function PaiementTracker({ factureId, montantTotal, statut }: PaiementTrackerProps) {
  const [paiements, setPaiements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddPaiement, setShowAddPaiement] = useState(false);
  const [newPaiement, setNewPaiement] = useState({
    montant: '',
    methodePaiement: 'VIREMENT',
    reference: '',
    datePaiement: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchPaiements();
  }, [factureId]);

  const fetchPaiements = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/factures/paiements?factureId=${factureId}`);
      const data = await response.json();
      
      if (response.ok) {
        setPaiements(data.paiements || []);
      }
    } catch (error) {
      console.error('Erreur chargement paiements:', error);
      setPaiements([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPaiement = async () => {
    try {
      const response = await fetch('/api/factures/paiements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          factureId,
          ...newPaiement
        })
      });

      if (response.ok) {
        await fetchPaiements();
        setShowAddPaiement(false);
        setNewPaiement({
          montant: '',
          methodePaiement: 'VIREMENT',
          reference: '',
          datePaiement: new Date().toISOString().split('T')[0]
        });
        alert('Paiement enregistré avec succès');
      } else {
        alert('Erreur lors de l\'enregistrement');
      }
    } catch (error) {
      console.error('Erreur ajout paiement:', error);
      alert('Erreur lors de l\'enregistrement');
    }
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

  const totalPaye = paiements.reduce((sum, p) => sum + Number(p.montant), 0);
  const resteDu = montantTotal - totalPaye;

  return (
    <div className="card" style={{ padding: '1.5rem' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.5rem'
      }}>
        <h3 style={{ margin: 0, color: '#1e293b' }}>💰 Suivi des Paiements</h3>
        
        {statut !== 'PAYE' && (
          <button
            onClick={() => setShowAddPaiement(true)}
            className="btn-primary"
            style={{ fontSize: '0.875rem' }}
          >
            ➕ Ajouter Paiement
          </button>
        )}
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '1rem',
        marginBottom: '1.5rem'
      }}>
        <div style={{
          background: '#f0f9ff',
          padding: '1rem',
          borderRadius: '0.75rem',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#0369a1' }}>
            {formatCurrency(montantTotal)}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#0369a1' }}>Total Facture</div>
        </div>

        <div style={{
          background: '#ecfdf5',
          padding: '1rem',
          borderRadius: '0.75rem',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#065f46' }}>
            {formatCurrency(totalPaye)}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#065f46' }}>Total Payé</div>
        </div>

        <div style={{
          background: resteDu > 0 ? '#fef3c7' : '#ecfdf5',
          padding: '1rem',
          borderRadius: '0.75rem',
          textAlign: 'center'
        }}>
          <div style={{ 
            fontSize: '1.25rem', 
            fontWeight: 'bold', 
            color: resteDu > 0 ? '#92400e' : '#065f46'
          }}>
            {formatCurrency(resteDu)}
          </div>
          <div style={{ 
            fontSize: '0.75rem', 
            color: resteDu > 0 ? '#92400e' : '#065f46'
          }}>
            Reste Dû
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
          Chargement des paiements...
        </div>
      ) : paiements.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💳</div>
          <p>Aucun paiement enregistré</p>
        </div>
      ) : (
        <div>
          <h4 style={{ marginBottom: '1rem', color: '#374151' }}>Historique des paiements</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {paiements.map((paiement) => (
              <div key={paiement.id} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1rem',
                background: '#f8fafc',
                borderRadius: '0.5rem',
                border: '1px solid #e2e8f0'
              }}>
                <div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '0.25rem'
                  }}>
                    <span style={{ fontWeight: '600', fontSize: '0.875rem' }}>
                      {formatCurrency(paiement.montant)}
                    </span>
                    <StatusBadge 
                      statut={paiement.status === 'CONFIRME' ? 'PAYE' : 'ENVOYE'} 
                      size="sm" 
                    />
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    {paiement.methodePaiement} • {paiement.reference}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    Payé le {formatDate(paiement.datePaiement)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showAddPaiement && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '1rem',
            width: '100%',
            maxWidth: '500px',
            margin: '1rem'
          }}>
            <div style={{
              padding: '1.5rem',
              borderBottom: '1px solid #e2e8f0'
            }}>
              <h3 style={{ margin: 0, color: '#1e293b' }}>➕ Ajouter un Paiement</h3>
            </div>

            <div style={{ padding: '1.5rem' }}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: '500',
                  color: '#374151'
                }}>
                  Montant *
                </label>
                <input
                  type="number"
                  value={newPaiement.montant}
                  onChange={(e) => setNewPaiement({
                    ...newPaiement,
                    montant: e.target.value
                  })}
                  placeholder="0.00"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: '500',
                  color: '#374151'
                }}>
                  Méthode de Paiement
                </label>
                <select
                  value={newPaiement.methodePaiement}
                  onChange={(e) => setNewPaiement({
                    ...newPaiement,
                    methodePaiement: e.target.value
                  })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem'
                  }}
                >
                  <option value="VIREMENT">Virement Bancaire</option>
                  <option value="CHEQUE">Chèque</option>
                  <option value="CARTE">Carte Bancaire</option>
                  <option value="ESPECES">Espèces</option>
                  <option value="PRELEVEMENT">Prélèvement</option>
                </select>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: '500',
                  color: '#374151'
                }}>
                  Référence
                </label>
                <input
                  type="text"
                  value={newPaiement.reference}
                  onChange={(e) => setNewPaiement({
                    ...newPaiement,
                    reference: e.target.value
                  })}
                  placeholder="Numéro de chèque, référence virement..."
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: '500',
                  color: '#374151'
                }}>
                  Date de Paiement
                </label>
                <input
                  type="date"
                  value={newPaiement.datePaiement}
                  onChange={(e) => setNewPaiement({
                    ...newPaiement,
                    datePaiement: e.target.value
                  })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem'
                  }}
                />
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '1rem'
              }}>
                <button
                  onClick={() => setShowAddPaiement(false)}
                  style={{
                    padding: '0.75rem 1.5rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem',
                    background: 'white',
                    color: '#374151',
                    cursor: 'pointer'
                  }}
                >
                  Annuler
                </button>
                <button
                  onClick={handleAddPaiement}
                  disabled={!newPaiement.montant}
                  className="btn-primary"
                  style={{
                    opacity: !newPaiement.montant ? 0.5 : 1,
                    cursor: !newPaiement.montant ? 'not-allowed' : 'pointer'
                  }}
                >
                  Enregistrer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
