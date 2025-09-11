
'use client';

import { useState, useEffect } from 'react';

interface RelanceManagerProps {
  factureId: string;
  factureNumero: string;
  clientName: string;
  montantDu: number;
}

export default function RelanceManager({ factureId, factureNumero, clientName, montantDu }: RelanceManagerProps) {
  const [relances, setRelances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateRelance, setShowCreateRelance] = useState(false);
  const [newRelance, setNewRelance] = useState({
    type: 'PREMIERE',
    message: ''
  });

  useEffect(() => {
    fetchRelances();
  }, [factureId]);

  const fetchRelances = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/factures/relances?factureId=${factureId}`);
      const data = await response.json();
      
      if (response.ok) {
        setRelances(data.relances || []);
      }
    } catch (error) {
      console.error('Erreur chargement relances:', error);
      setRelances([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRelance = async () => {
    try {
      const response = await fetch('/api/factures/relances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          factureId,
          ...newRelance
        })
      });

      if (response.ok) {
        await fetchRelances();
        setShowCreateRelance(false);
        setNewRelance({ type: 'PREMIERE', message: '' });
        alert('Relance envoyée avec succès');
      } else {
        alert('Erreur lors de l\'envoi');
      }
    } catch (error) {
      console.error('Erreur création relance:', error);
      alert('Erreur lors de l\'envoi');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const getTypeLabel = (type: string) => {
    const labels = {
      PREMIERE: '1ère Relance',
      DEUXIEME: '2ème Relance',
      FINALE: 'Mise en Demeure'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getTypeColor = (type: string) => {
    const colors = {
      PREMIERE: '#3b82f6',
      DEUXIEME: '#f59e0b',
      FINALE: '#ef4444'
    };
    return colors[type as keyof typeof colors] || '#64748b';
  };

  const getNextRelanceType = () => {
    if (relances.length === 0) return 'PREMIERE';
    if (relances.length === 1) return 'DEUXIEME';
    return 'FINALE';
  };

  return (
    <div className="card" style={{ padding: '1.5rem' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.5rem'
      }}>
        <h3 style={{ margin: 0, color: '#1e293b' }}>📧 Gestion des Relances</h3>
        
        {relances.length < 3 && (
          <button
            onClick={() => setShowCreateRelance(true)}
            style={{
              padding: '0.5rem 1rem',
              border: 'none',
              borderRadius: '0.5rem',
              background: '#f59e0b',
              color: 'white',
              cursor: 'pointer',
              fontSize: '0.875rem'
            }}
          >
            📧 Nouvelle Relance
          </button>
        )}
      </div>

      <div style={{
        background: '#fef3c7',
        padding: '1rem',
        borderRadius: '0.75rem',
        marginBottom: '1.5rem',
        border: '1px solid #f59e0b'
      }}>
        <div style={{ fontWeight: '600', color: '#92400e', marginBottom: '0.25rem' }}>
          Facture {factureNumero}
        </div>
        <div style={{ fontSize: '0.875rem', color: '#92400e' }}>
          Client: {clientName} • Montant dû: {formatCurrency(montantDu)}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
          Chargement des relances...
        </div>
      ) : relances.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📧</div>
          <p>Aucune relance envoyée</p>
          <p style={{ fontSize: '0.875rem' }}>
            Créez une première relance pour commencer le processus de recouvrement.
          </p>
        </div>
      ) : (
        <div>
          <h4 style={{ marginBottom: '1rem', color: '#374151' }}>Historique des relances</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {relances.map((relance, index) => (
              <div key={relance.id} style={{
                padding: '1rem',
                background: '#f8fafc',
                borderRadius: '0.5rem',
                border: '1px solid #e2e8f0'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '0.5rem'
                }}>
                  <div>
                    <span style={{
                      background: getTypeColor(relance.type),
                      color: 'white',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '0.5rem',
                      fontSize: '0.75rem',
                      fontWeight: '500'
                    }}>
                      {getTypeLabel(relance.type)}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: '0.75rem', color: '#64748b' }}>
                    Envoyée le {formatDate(relance.dateEnvoi)}
                    {relance.dateEcheance && (
                      <div>Échéance: {formatDate(relance.dateEcheance)}</div>
                    )}
                  </div>
                </div>
                
                <div style={{
                  fontSize: '0.875rem',
                  color: '#374151',
                  backgroundColor: 'white',
                 padding: '0.75rem',
                 borderRadius: '0.25rem',
                 marginTop: '0.5rem',
                 fontStyle: 'italic'
               }}>
                 "{relance.message}"
               </div>
             </div>
           ))}
         </div>
       </div>
     )}

     {showCreateRelance && (
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
           maxWidth: '600px',
           margin: '1rem'
         }}>
           <div style={{
             padding: '1.5rem',
             borderBottom: '1px solid #e2e8f0'
           }}>
             <h3 style={{ margin: 0, color: '#1e293b' }}>📧 Créer une Relance</h3>
           </div>

           <div style={{ padding: '1.5rem' }}>
             <div style={{ marginBottom: '1rem' }}>
               <label style={{
                 display: 'block',
                 marginBottom: '0.5rem',
                 fontWeight: '500',
                 color: '#374151'
               }}>
                 Type de Relance
               </label>
               <select
                 value={newRelance.type}
                 onChange={(e) => setNewRelance({
                   ...newRelance,
                   type: e.target.value
                 })}
                 style={{
                   width: '100%',
                   padding: '0.75rem',
                   border: '1px solid #d1d5db',
                   borderRadius: '0.5rem'
                 }}
               >
                 <option value="PREMIERE">1ère Relance (Aimable)</option>
                 <option value="DEUXIEME">2ème Relance (Ferme)</option>
                 <option value="FINALE">Mise en Demeure</option>
               </select>
             </div>

             <div style={{ marginBottom: '1.5rem' }}>
               <label style={{
                 display: 'block',
                 marginBottom: '0.5rem',
                 fontWeight: '500',
                 color: '#374151'
               }}>
                 Message Personnalisé
               </label>
               <textarea
                 value={newRelance.message}
                 onChange={(e) => setNewRelance({
                   ...newRelance,
                   message: e.target.value
                 })}
                 placeholder="Laissez vide pour utiliser le message par défaut..."
                 rows={4}
                 style={{
                   width: '100%',
                   padding: '0.75rem',
                   border: '1px solid #d1d5db',
                   borderRadius: '0.5rem',
                   resize: 'vertical'
                 }}
               />
             </div>

             <div style={{
               background: '#f0f9ff',
               padding: '1rem',
               borderRadius: '0.5rem',
               marginBottom: '1.5rem'
             }}>
               <div style={{ fontSize: '0.875rem', color: '#0369a1', marginBottom: '0.5rem', fontWeight: '500' }}>
                 Aperçu de l'envoi:
               </div>
               <div style={{ fontSize: '0.75rem', color: '#0369a1' }}>
                 📧 À: {clientName}<br/>
                 📄 Facture: {factureNumero}<br/>
                 💰 Montant: {formatCurrency(montantDu)}<br/>
                 📅 Type: {getTypeLabel(newRelance.type)}
               </div>
             </div>

             <div style={{
               display: 'flex',
               justifyContent: 'flex-end',
               gap: '1rem'
             }}>
               <button
                 onClick={() => setShowCreateRelance(false)}
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
                 onClick={handleCreateRelance}
                 style={{
                   padding: '0.75rem 1.5rem',
                   border: 'none',
                   borderRadius: '0.5rem',
                   background: '#f59e0b',
                   color: 'white',
                   cursor: 'pointer'
                 }}
               >
                 📧 Envoyer Relance
               </button>
             </div>
           </div>
         </div>
       </div>
     )}
   </div>
 );
}
