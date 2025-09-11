'use client';

import { useState, useEffect } from 'react';

interface OpportunitesPipelineProps {
  clientId: string;
}

export default function OpportunitesPipeline({ clientId }: OpportunitesPipelineProps) {
  const [opportunites, setOpportunites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newOpportunite, setNewOpportunite] = useState({
    nom: '',
    description: '',
    valeurEstimee: 0,
    probabilite: 50,
    statut: 'PROSPECT',
    dateCloture: ''
  });

  useEffect(() => {
    fetchOpportunites();
  }, [clientId]);

  const fetchOpportunites = async () => {
    try {
      setLoading(true);
      // Simulation - En production utiliser API
      const mockOpportunites = [
        {
          id: '1',
          nom: 'Rénovation Cuisine Complète',
          description: 'Projet de rénovation complète de la cuisine avec électroménager haut de gamme.',
          valeurEstimee: 25000,
          probabilite: 75,
          statut: 'PROPOSITION',
          dateCloture: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date().toISOString()
        },
        {
          id: '2',
          nom: 'Extension Maison',
          description: 'Extension de 30m² avec création d\'une suite parentale.',
          valeurEstimee: 45000,
          probabilite: 40,
          statut: 'QUALIFIE',
          dateCloture: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
        }
      ];
      setOpportunites(mockOpportunites);
    } catch (error) {
      console.error('Erreur chargement opportunités:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddOpportunite = async () => {
    try {
      const nouvelleOpportunite = {
        id: Date.now().toString(),
        ...newOpportunite,
        dateCloture: newOpportunite.dateCloture || null,
        createdAt: new Date().toISOString()
      };
      
      setOpportunites([nouvelleOpportunite, ...opportunites]);
      setShowForm(false);
      setNewOpportunite({
        nom: '',
        description: '',
        valeurEstimee: 0,
        probabilite: 50,
        statut: 'PROSPECT',
        dateCloture: ''
      });
      alert('Opportunité créée avec succès');
    } catch (error) {
      console.error('Erreur création opportunité:', error);
      alert('Erreur lors de la création');
    }
  };

  const updateStatutOpportunite = async (id: string, nouveauStatut: string) => {
    try {
      const newOpportunites = opportunites.map(opp => 
        opp.id === id ? { ...opp, statut: nouveauStatut } : opp
      );
      setOpportunites(newOpportunites);
      alert('Statut mis à jour');
    } catch (error) {
      console.error('Erreur mise à jour:', error);
      alert('Erreur lors de la mise à jour');
    }
  };

  const getStatutColor = (statut: string) => {
    const colors = {
      PROSPECT: '#64748b',
      QUALIFIE: '#3b82f6',
      PROPOSITION: '#f59e0b',
      NEGOCIATION: '#8b5cf6',
      GAGNE: '#10b981',
      PERDU: '#ef4444'
    };
    return colors[statut as keyof typeof colors] || '#64748b';
  };

  const getStatutLabel = (statut: string) => {
    const labels = {
      PROSPECT: 'Prospect',
      QUALIFIE: 'Qualifié',
      PROPOSITION: 'Proposition',
      NEGOCIATION: 'Négociation',
      GAGNE: 'Gagné',
      PERDU: 'Perdu'
    };
    return labels[statut as keyof typeof labels] || statut;
  };

  const getProbabiliteColor = (probabilite: number) => {
    if (probabilite >= 80) return '#10b981';
    if (probabilite >= 60) return '#f59e0b';
    if (probabilite >= 40) return '#3b82f6';
    return '#ef4444';
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

  const totalValue = opportunites.reduce((sum, opp) => sum + opp.valeurEstimee, 0);
  const averageProbability = opportunites.length > 0 ? 
    Math.round(opportunites.reduce((sum, opp) => sum + opp.probabilite, 0) / opportunites.length) : 0;

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <div style={{ color: '#64748b' }}>Chargement des opportunités...</div>
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
          🎯 Pipeline Commercial
        </h4>
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary"
          style={{ fontSize: '0.875rem' }}
        >
          ➕ Nouvelle Opportunité
        </button>
      </div>

      {/* KPIs rapides */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '1rem',
        marginBottom: '1.5rem'
      }}>
        <div style={{
          background: '#f0f9ff',
          padding: '1rem',
          borderRadius: '0.75rem',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: '#0369a1'
          }}>
            {opportunites.length}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#0369a1' }}>
            Opportunités
          </div>
        </div>

        <div style={{
          background: '#ecfdf5',
          padding: '1rem',
          borderRadius: '0.75rem',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '1.25rem',
            fontWeight: 'bold',
            color: '#059669'
          }}>
            {formatCurrency(totalValue)}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#059669' }}>
            Valeur Pipeline
          </div>
        </div>

        <div style={{
          background: '#fef3c7',
          padding: '1rem',
          borderRadius: '0.75rem',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: '#d97706'
          }}>
            {averageProbability}%
          </div>
          <div style={{ fontSize: '0.75rem', color: '#d97706' }}>
            Probabilité Moy.
          </div>
        </div>

        <div style={{
          background: '#f3f4f6',
          padding: '1rem',
          borderRadius: '0.75rem',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '1.25rem',
            fontWeight: 'bold',
            color: '#6b7280'
          }}>
            {formatCurrency(totalValue * (averageProbability / 100))}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
            Valeur Pondérée
          </div>
        </div>
      </div>

      {opportunites.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '3rem',
          background: '#f8fafc',
          borderRadius: '0.75rem'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎯</div>
          <p style={{ color: '#64748b' }}>Aucune opportunité en cours</p>
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary"
            style={{ marginTop: '1rem' }}
          >
            Créer la première opportunité
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {opportunites.map((opportunite) => (
            <div key={opportunite.id} style={{
              background: 'white',
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
                <div style={{ flex: 1 }}>
                  <h5 style={{
                    margin: '0 0 0.5rem 0',
                    color: '#1e293b',
                    fontSize: '1.125rem',
                    fontWeight: '600'
                  }}>
                    {opportunite.nom}
                  </h5>
                  <p style={{
                    margin: '0 0 1rem 0',
                    color: '#64748b',
                    fontSize: '0.875rem',
                    lineHeight: '1.4'
                  }}>
                    {opportunite.description}
                  </p>
                  
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    flexWrap: 'wrap'
                  }}>
                    <div style={{
                      fontSize: '1.25rem',
                      fontWeight: 'bold',
                      color: '#059669'
                    }}>
                      {formatCurrency(opportunite.valeurEstimee)}
                    </div>
                    
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      <span style={{
                        fontSize: '0.875rem',
                        color: getProbabiliteColor(opportunite.probabilite),
                        fontWeight: '600'
                      }}>
                        {opportunite.probabilite}%
                      </span>
                      <div style={{
                        width: '60px',
                        height: '6px',
                        background: '#e5e7eb',
                        borderRadius: '3px',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          width: `${opportunite.probabilite}%`,
                          height: '100%',
                          background: getProbabiliteColor(opportunite.probabilite),
                          borderRadius: '3px'
                        }} />
                      </div>
                    </div>
                    
                    {opportunite.dateCloture && (
                      <div style={{
                        fontSize: '0.75rem',
                        color: '#64748b'
                      }}>
                        📅 Clôture prévue: {formatDate(opportunite.dateCloture)}
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ marginLeft: '1rem' }}>
                  <select
                    value={opportunite.statut}
                    onChange={(e) => updateStatutOpportunite(opportunite.id, e.target.value)}
                    style={{
                      padding: '0.5rem 0.75rem',
                      border: `2px solid ${getStatutColor(opportunite.statut)}`,
                      borderRadius: '0.5rem',
                      background: 'white',
                      color: getStatutColor(opportunite.statut),
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="PROSPECT">Prospect</option>
                    <option value="QUALIFIE">Qualifié</option>
                    <option value="PROPOSITION">Proposition</option>
                    <option value="NEGOCIATION">Négociation</option>
                    <option value="GAGNE">Gagné</option>
                    <option value="PERDU">Perdu</option>
                  </select>
                </div>
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
                🎯 Nouvelle Opportunité
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
                  Nom de l'opportunité *
                </label>
                <input
                  type="text"
                  value={newOpportunite.nom}
                  onChange={(e) => setNewOpportunite({
                    ...newOpportunite,
                    nom: e.target.value
                  })}
                  placeholder="Ex: Rénovation cuisine, Extension maison..."
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
                  Description
                </label>
                <textarea
                  value={newOpportunite.description}
                  onChange={(e) => setNewOpportunite({
                    ...newOpportunite,
                    description: e.target.value
                  })}
                  placeholder="Détaillez le projet..."
                  rows={3}
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
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1rem',
                marginBottom: '1rem'
              }}>
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontWeight: '500',
                    color: '#374151'
                  }}>
                    Valeur estimée (€) *
                  </label>
                  <input
                    type="number"
                    value={newOpportunite.valeurEstimee}
                    onChange={(e) => setNewOpportunite({
                      ...newOpportunite,
                      valeurEstimee: parseFloat(e.target.value) || 0
                    })}
                    min="0"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.5rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontWeight: '500',
                    color: '#374151'
                  }}>
                    Probabilité (%)
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={newOpportunite.probabilite}
                      onChange={(e) => setNewOpportunite({
                        ...newOpportunite,
                        probabilite: parseInt(e.target.value)
                      })}
                      style={{ flex: 1 }}
                    />
                    <span style={{
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: getProbabiliteColor(newOpportunite.probabilite),
                      minWidth: '3rem',
                      textAlign: 'center'
                    }}>
                      {newOpportunite.probabilite}%
                    </span>
                  </div>
                </div>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1rem',
                marginBottom: '2rem'
              }}>
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontWeight: '500',
                    color: '#374151'
                  }}>
                    Statut
                  </label>
                  <select
                    value={newOpportunite.statut}
                    onChange={(e) => setNewOpportunite({
                      ...newOpportunite,
                      statut: e.target.value
                    })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.5rem'
                    }}
                  >
                    <option value="PROSPECT">Prospect</option>
                    <option value="QUALIFIE">Qualifié</option>
                    <option value="PROPOSITION">Proposition</option>
                    <option value="NEGOCIATION">Négociation</option>
                  </select>
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontWeight: '500',
                    color: '#374151'
                  }}>
                    Date de clôture prévue
                  </label>
                  <input
                    type="date"
                    value={newOpportunite.dateCloture}
                    onChange={(e) => setNewOpportunite({
                      ...newOpportunite,
                      dateCloture: e.target.value
                    })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.5rem'
                    }}
                  />
                </div>
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
                  onClick={handleAddOpportunite}
                  disabled={!newOpportunite.nom || !newOpportunite.valeurEstimee}
                  className="btn-primary"
                  style={{
                    opacity: (!newOpportunite.nom || !newOpportunite.valeurEstimee) ? 0.5 : 1,
                    cursor: (!newOpportunite.nom || !newOpportunite.valeurEstimee) ? 'not-allowed' : 'pointer'
                  }}
                >
                  🎯 Créer l'Opportunité
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
