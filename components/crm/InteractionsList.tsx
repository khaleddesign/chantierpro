'use client';

import { useState, useEffect } from 'react';

interface InteractionsListProps {
  clientId: string;
}

export default function InteractionsList({ clientId }: InteractionsListProps) {
  const [interactions, setInteractions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newInteraction, setNewInteraction] = useState({
    type: 'APPEL',
    objet: '',
    description: '',
    prochaineSuite: ''
  });

  useEffect(() => {
    fetchInteractions();
  }, [clientId]);

  const fetchInteractions = async () => {
    try {
      setLoading(true);
      // Simulation - En production utiliser API
      const mockInteractions = [
        {
          id: '1',
          type: 'APPEL',
          objet: 'Demande de devis cuisine',
          description: 'Le client souhaite rénover sa cuisine. Budget estimé 15k€.',
          dateContact: new Date().toISOString(),
          prochaineSuite: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '2',
          type: 'EMAIL',
          objet: 'Envoi devis DEV0001',
          description: 'Devis envoyé par email avec les détails techniques.',
          dateContact: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
        }
      ];
      setInteractions(mockInteractions);
    } catch (error) {
      console.error('Erreur chargement interactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddInteraction = async () => {
    try {
      // En production, sauvegarder via API
      const nouvelleInteraction = {
        id: Date.now().toString(),
        ...newInteraction,
        dateContact: new Date().toISOString(),
        prochaineSuite: newInteraction.prochaineSuite || null
      };
      
      setInteractions([nouvelleInteraction, ...interactions]);
      setShowForm(false);
      setNewInteraction({
        type: 'APPEL',
        objet: '',
        description: '',
        prochaineSuite: ''
      });
      alert('Interaction ajoutée avec succès');
    } catch (error) {
      console.error('Erreur ajout interaction:', error);
      alert('Erreur lors de l\'ajout');
    }
  };

  const getTypeIcon = (type: string) => {
    const icons = {
      APPEL: '📞',
      EMAIL: '📧',
      VISITE: '🏠',
      REUNION: '🤝',
      AUTRE: '📋'
    };
    return icons[type as keyof typeof icons] || '📋';
  };

  const getTypeColor = (type: string) => {
    const colors = {
      APPEL: '#3b82f6',
      EMAIL: '#10b981',
      VISITE: '#f59e0b',
      REUNION: '#8b5cf6',
      AUTRE: '#64748b'
    };
    return colors[type as keyof typeof colors] || '#64748b';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <div style={{ color: '#64748b' }}>Chargement des interactions...</div>
      </div>
    );
  }

  return (
    <div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.5rem'
      }}>
        <h4 style={{ margin: 0, color: '#374151' }}>
          💬 Historique des Interactions
        </h4>
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary"
          style={{ fontSize: '0.875rem' }}
        >
          ➕ Nouvelle Interaction
        </button>
      </div>

      {interactions.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '3rem',
          background: '#f8fafc',
          borderRadius: '0.75rem'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💬</div>
          <p style={{ color: '#64748b' }}>Aucune interaction enregistrée</p>
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary"
            style={{ marginTop: '1rem' }}
          >
            Ajouter la première interaction
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {interactions.map((interaction) => (
            <div key={interaction.id} style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '0.75rem',
              padding: '1.5rem'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '1rem'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem'
                }}>
                  <div style={{
                    width: '2.5rem',
                    height: '2.5rem',
                    borderRadius: '50%',
                    background: getTypeColor(interaction.type),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1rem'
                  }}>
                    {getTypeIcon(interaction.type)}
                  </div>
                  <div>
                    <div style={{
                      fontWeight: '600',
                      color: '#1e293b',
                      marginBottom: '0.25rem'
                    }}>
                      {interaction.objet}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
                      {interaction.type} • {formatDate(interaction.dateContact)}
                    </div>
                  </div>
                </div>

                {interaction.prochaineSuite && (
                  <div style={{
                    background: '#fef3c7',
                    color: '#92400e',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '0.5rem',
                    fontSize: '0.75rem',
                    fontWeight: '500'
                  }}>
                    📅 Suivi le {formatDate(interaction.prochaineSuite)}
                  </div>
                )}
              </div>

              <div style={{
                color: '#374151',
                fontSize: '0.875rem',
                lineHeight: '1.5'
              }}>
                {interaction.description}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Formulaire d'ajout */}
      {showForm && (
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
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '1rem',
            width: '100%',
            maxWidth: '600px',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <div style={{
              padding: '1.5rem',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{ margin: 0, color: '#1e293b' }}>
                ➕ Nouvelle Interaction
              </h3>
              <button
                onClick={() => setShowForm(false)}
                style={{
                  padding: '0.5rem',
                  border: 'none',
                  background: '#f1f5f9',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  color: '#64748b'
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: '1.5rem' }}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: '500',
                  color: '#374151'
                }}>
                  Type d'interaction
                </label>
                <select
                  value={newInteraction.type}
                  onChange={(e) => setNewInteraction({
                    ...newInteraction,
                    type: e.target.value
                  })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem'
                  }}
                >
                  <option value

="APPEL">📞 Appel téléphonique</option>
                 <option value="EMAIL">📧 Email</option>
                 <option value="VISITE">🏠 Visite sur site</option>
                 <option value="REUNION">🤝 Réunion</option>
                 <option value="AUTRE">📋 Autre</option>
               </select>
             </div>

             <div style={{ marginBottom: '1rem' }}>
               <label style={{
                 display: 'block',
                 marginBottom: '0.5rem',
                 fontWeight: '500',
                 color: '#374151'
               }}>
                 Objet *
               </label>
               <input
                 type="text"
                 value={newInteraction.objet}
                 onChange={(e) => setNewInteraction({
                   ...newInteraction,
                   objet: e.target.value
                 })}
                 placeholder="Ex: Demande de devis, suivi projet..."
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
                 Description *
               </label>
               <textarea
                 value={newInteraction.description}
                 onChange={(e) => setNewInteraction({
                   ...newInteraction,
                   description: e.target.value
                 })}
                 placeholder="Détaillez le contenu de l'interaction..."
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

             <div style={{ marginBottom: '2rem' }}>
               <label style={{
                 display: 'block',
                 marginBottom: '0.5rem',
                 fontWeight: '500',
                 color: '#374151'
               }}>
                 Prochaine suite (optionnel)
               </label>
               <input
                 type="date"
                 value={newInteraction.prochaineSuite}
                 onChange={(e) => setNewInteraction({
                   ...newInteraction,
                   prochaineSuite: e.target.value
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
                 onClick={() => setShowForm(false)}
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
                 onClick={handleAddInteraction}
                 disabled={!newInteraction.objet || !newInteraction.description}
                 className="btn-primary"
                 style={{
                   opacity: (!newInteraction.objet || !newInteraction.description) ? 0.5 : 1,
                   cursor: (!newInteraction.objet || !newInteraction.description) ? 'not-allowed' : 'pointer'
                 }}
               >
                 💾 Enregistrer
               </button>
             </div>
           </div>
         </div>
       </div>
     )}
   </div>
 );
}
