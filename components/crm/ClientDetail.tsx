'use client';

import { useState, useEffect } from 'react';
import * as React from 'react';
import InteractionsList from './InteractionsList';
import OpportunitesPipeline from './OpportunitesPipeline';
import ClientStats from './ClientStats';
import { useClient } from '@/hooks/useClients';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import type { ClientDetailed, Client, TypeClient } from '@/types/crm';

interface ClientDetailProps {
  clientId: string;
}

export default function ClientDetail({ clientId }: ClientDetailProps) {
  // Utilisation des hooks personnalisés
  const { client, loading, error, update: updateClient } = useClient(clientId);
  const { handleError } = useErrorHandler();
  
  const [activeTab, setActiveTab] = useState<'profile' | 'interactions' | 'opportunites' | 'stats'>('profile');
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Client>>({
    name: '',
    email: '',
    phone: '',
    company: '',
    typeClient: 'PARTICULIER' as TypeClient,
    secteurActivite: '',
    effectif: '',
    chiffreAffaires: 0,
    address: '',
    codePostal: '',
    ville: '',
    commercialId: ''
  });

  // Initialiser le formulaire quand les données client sont chargées
  React.useEffect(() => {
    if (client && !editing) {
      setFormData({
        name: client.name || '',
        email: client.email || '',
        phone: client.phone || '',
        company: client.company || '',
        typeClient: client.typeClient || 'PARTICULIER',
        secteurActivite: client.secteurActivite || '',
        effectif: client.effectif || '',
        chiffreAffaires: client.chiffreAffaires || 0,
        address: client.address || '',
        codePostal: client.codePostal || '',
        ville: client.ville || '',
        commercialId: client.commercialId || ''
      });
    }
  }, [client, editing]);

  const handleSave = async () => {
    if (!client) return;
    
    try {
      // Utiliser le hook updateClient avec gestion d'erreur automatique
      await updateClient(formData);
      setEditing(false);
      alert('Client mis à jour avec succès');
    } catch (error) {
      handleError(error, 'Save Client');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const getTypeClientColor = (type: string) => {
    const colors = {
      PARTICULIER: '#3b82f6',
      PROFESSIONNEL: '#10b981',
      SYNDIC: '#f59e0b',
      PROMOTEUR: '#8b5cf6'
    };
    return colors[type as keyof typeof colors] || '#64748b';
  };

  const getTypeClientLabel = (type: string) => {
    const labels = {
      PARTICULIER: 'Particulier',
      PROFESSIONNEL: 'Professionnel',
      SYNDIC: 'Syndic',
      PROMOTEUR: 'Promoteur'
    };
    return labels[type as keyof typeof labels] || type;
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{ color: '#64748b' }}>Chargement du client...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{ color: '#ef4444' }}>Erreur: {error}</div>
      </div>
    );
  }

  if (!client) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{ color: '#ef4444' }}>Client non trouvé</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gap: '1.5rem' }}>
      {/* En-tête client */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '1.5rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: '4rem',
              height: '4rem',
              borderRadius: '50%',
              background: getTypeClientColor(client.typeClient),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '1.5rem',
              fontWeight: 'bold'
            }}>
              {client.name.split(' ').map((n: string) => n[0]).join('')}
            </div>
            
            <div>
              <h2 style={{ margin: '0 0 0.5rem 0', color: '#1e293b' }}>
                {client.name}
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{
                  background: getTypeClientColor(client.typeClient),
                  color: 'white',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '1rem',
                  fontSize: '0.75rem',
                  fontWeight: '500'
                }}>
                  {getTypeClientLabel(client.typeClient)}
                </span>
                {client.company && (
                  <span style={{ color: '#64748b', fontSize: '0.875rem' }}>
                    {client.company}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {/* Quick Actions */}
            {!editing && (
              <>
                <button
                  onClick={() => window.open(`tel:${client.phone}`, '_self')}
                  style={{
                    padding: '0.5rem 0.75rem',
                    border: '1px solid #10b981',
                    borderRadius: '0.5rem',
                    background: '#f0fdf4',
                    color: '#065f46',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    fontWeight: '500'
                  }}
                  title="Appeler le client"
                >
                  📞 Appeler
                </button>
                
                <button
                  onClick={() => window.open(`mailto:${client.email}`, '_blank')}
                  style={{
                    padding: '0.5rem 0.75rem',
                    border: '1px solid #3b82f6',
                    borderRadius: '0.5rem',
                    background: '#eff6ff',
                    color: '#1e40af',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    fontWeight: '500'
                  }}
                  title="Envoyer un email"
                >
                  📧 Email
                </button>

                <button
                  onClick={() => window.open(`/dashboard/devis/nouveau?clientId=${client.id}`, '_blank')}
                  style={{
                    padding: '0.5rem 0.75rem',
                    border: '1px solid #8b5cf6',
                    borderRadius: '0.5rem',
                    background: '#faf5ff',
                    color: '#6b21a8',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    fontWeight: '500'
                  }}
                  title="Créer un devis pour ce client"
                >
                  📄 Devis
                </button>

                <button
                  onClick={() => window.open(`/dashboard/planning/nouveau?clientId=${client.id}`, '_blank')}
                  style={{
                    padding: '0.5rem 0.75rem',
                    border: '1px solid #f59e0b',
                    borderRadius: '0.5rem',
                    background: '#fffbeb',
                    color: '#92400e',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    fontWeight: '500'
                  }}
                  title="Planifier un rendez-vous"
                >
                  📅 RDV
                </button>

                <button
                  onClick={() => window.open(`/dashboard/chantiers?clientId=${client.id}`, '_blank')}
                  style={{
                    padding: '0.5rem 0.75rem',
                    border: '1px solid #ef4444',
                    borderRadius: '0.5rem',
                    background: '#fef2f2',
                    color: '#b91c1c',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    fontWeight: '500'
                  }}
                  title="Voir les chantiers de ce client"
                >
                  🏗️ Chantiers
                </button>

                <button
                  onClick={() => window.open(`/dashboard/factures?clientId=${client.id}`, '_blank')}
                  style={{
                    padding: '0.5rem 0.75rem',
                    border: '1px solid #06b6d4',
                    borderRadius: '0.5rem',
                    background: '#ecfeff',
                    color: '#0891b2',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    fontWeight: '500'
                  }}
                  title="Voir les factures de ce client"
                >
                  🧾 Factures
                </button>
              </>
            )}
            
            <button
              onClick={() => setEditing(!editing)}
              style={{
                padding: '0.5rem 1rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.5rem',
                background: editing ? '#fef3c7' : 'white',
                color: editing ? '#92400e' : '#374151',
                cursor: 'pointer',
                fontSize: '0.875rem'
              }}
            >
              {editing ? '📝 Édition' : '✏️ Modifier'}
            </button>
            
            {editing && (
              <button
                onClick={handleSave}
                className="btn-primary"
                style={{ fontSize: '0.875rem' }}
              >
                💾 Sauvegarder
              </button>
            )}
          </div>
        </div>

        {/* Navigation onglets */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid #e2e8f0',
          marginBottom: '1.5rem'
        }}>
          {[
            { key: 'profile', label: '👤 Profil', icon: '👤' },
            { key: 'interactions', label: '💬 Interactions', icon: '💬' },
            { key: 'opportunites', label: '🎯 Opportunités', icon: '🎯' },
            { key: 'stats', label: '📊 Statistiques', icon: '📊' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              style={{
                padding: '0.75rem 1.5rem',
                border: 'none',
                background: 'transparent',
                color: activeTab === tab.key ? '#3b82f6' : '#64748b',
                borderBottom: activeTab === tab.key ? '2px solid #3b82f6' : '2px solid transparent',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Contenu des onglets */}
        {activeTab === 'profile' && (
          <div>
            {editing ? (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '1.5rem'
              }}>
                <div>
                  <h4 style={{ marginBottom: '1rem', color: '#374151' }}>
                    Informations générales
                  </h4>
                  
                  <div style={{ display: 'grid', gap: '1rem' }}>
                    <div>
                      <label style={{
                        display: 'block',
                        marginBottom: '0.5rem',
                        fontWeight: '500',
                        color: '#374151'
                      }}>
                        Nom complet *
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                        Email *
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                        Téléphone
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
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
                        Type de client
                      </label>
                      <select
                        value={formData.typeClient}
                        onChange={(e) => setFormData({ ...formData, typeClient: e.target.value as any })}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '1px solid #d1d5db',
                          borderRadius: '0.5rem'
                        }}
                      >
                        <option value="PARTICULIER">Particulier</option>
                        <option value="PROFESSIONNEL">Professionnel</option>
                        <option value="SYNDIC">Syndic</option>
                        <option value="PROMOTEUR">Promoteur</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 style={{ marginBottom: '1rem', color: '#374151' }}>
                    Informations professionnelles
                  </h4>
                  
                  <div style={{ display: 'grid', gap: '1rem' }}>
                    <div>
                      <label style={{
                        display: 'block',
                        marginBottom: '0.5rem',
                        fontWeight: '500',
                        color: '#374151'
                      }}>
                        Entreprise
                      </label>
                      <input
                        type="text"
                        value={formData.company}
                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
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
                        Secteur d'activité
                      </label>
                      <input
                        type="text"
                        value={formData.secteurActivite}
                        onChange={(e) => setFormData({ ...formData, secteurActivite: e.target.value })}
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
                        Effectif
                      </label>
                      <select
                        value={formData.effectif}
                        onChange={(e) => setFormData({ ...formData, effectif: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '1px solid #d1d5db',
                          borderRadius: '0.5rem'
                        }}
                      >
                        <option value="">Non renseigné</option>
                        <option value="1-5">1-5 salariés</option>
                        <option value="6-10">6-10 salariés</option>
                        <option value="10-20">10-20 salariés</option>
                        <option value="20-50">20-50 salariés</option>
                        <option value="50+">50+ salariés</option>
                      </select>
                    </div>

                    <div>
                      <label style={{
                        display: 'block',
                        marginBottom: '0.5rem',
                        fontWeight: '500',
                        color: '#374151'
                      }}>
                        Chiffre d'affaires (€)
                      </label>
                      <input
                        type="number"
                        value={formData.chiffreAffaires}
                        onChange={(e) => setFormData({ ...formData, chiffreAffaires: parseFloat(e.target.value) || 0 })}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '1px solid #d1d5db',
                          borderRadius: '0.5rem'
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '2rem'
              }}>
                <div>
                  <h4 style={{ marginBottom: '1rem', color: '#374151' }}>
                    📞 Contact
                  </h4>
                  <div style={{ display: 'grid', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ color: '#64748b' }}>📧</span>
                      <span>{client.email}</span>
                    </div>
                    {client.phone && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ color: '#64748b' }}>📞</span>
                        <span>{client.phone}</span>
                      </div>
                    )}
                    {client.address && (
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                        <span style={{ color: '#64748b' }}>📍</span>
                        <span>
                          {client.address}<br/>
                          {client.codePostal} {client.ville}<br/>
                          {(client as any).pays || 'France'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h4 style={{ marginBottom: '1rem', color: '#374151' }}>
                    🏢 Professionnel
                  </h4>
                  <div style={{ display: 'grid', gap: '0.75rem' }}>
                    {client.company && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ color: '#64748b' }}>🏢</span>
                        <span>{client.company}</span>
                      </div>
                    )}
                    {client.secteurActivite && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ color: '#64748b' }}>💼</span>
                        <span>{client.secteurActivite}</span>
                      </div>
                    )}
                    {client.effectif && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ color: '#64748b' }}>👥</span>
                        <span>{client.effectif} salariés</span>
                      </div>
                    )}
                    {client.chiffreAffaires && client.chiffreAffaires > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ color: '#64748b' }}>💰</span>
                        <span>{formatCurrency(client.chiffreAffaires)} CA</span>
                      </div>
                    )}
                    {(client as any).sourceProspection && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ color: '#64748b' }}>📈</span>
                        <span>{(client as any).sourceProspection}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'interactions' && (
          <InteractionsList clientId={clientId} />
        )}

        {activeTab === 'opportunites' && (
          <OpportunitesPipeline clientId={clientId} />
        )}

        {activeTab === 'stats' && (
          <ClientStats clientId={clientId} />
        )}
      </div>
    </div>
  );
}
