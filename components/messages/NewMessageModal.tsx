"use client";

import { useState, useEffect, useCallback } from 'react';
import UserAvatar from './UserAvatar';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'COMMERCIAL' | 'OUVRIER' | 'CLIENT';
  company?: string;
  lastActive?: string;
  isOnline?: boolean;
}

interface Chantier {
  id: string;
  nom: string;
  client: User;
  assignees: User[];
  photo?: string;
}

interface NewMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectRecipients: (recipients: User[], type: 'direct' | 'chantier', chantierId?: string) => void;
}

export default function NewMessageModal({ isOpen, onClose, onSelectRecipients }: NewMessageModalProps) {
  const [activeTab, setActiveTab] = useState<'users' | 'chantiers' | 'groupes'>('users');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [selectedChantier, setSelectedChantier] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const [users, setUsers] = useState<User[]>([]);
  const [chantiers, setChantiers] = useState<Chantier[]>([]);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  // Fetch contacts on mount
  useEffect(() => {
    if (isOpen) {
      fetchContacts();
    }
  }, [isOpen]);

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/messages/contacts');
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
        setChantiers(data.chantiers || []);
      }
    } catch (error) {
      console.error('Erreur chargement contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.company?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredChantiers = chantiers.filter(chantier =>
    chantier.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    chantier.client.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleUserToggle = (user: User) => {
    setSelectedUsers(prev => {
      const exists = prev.find(u => u.id === user.id);
      if (exists) {
        return prev.filter(u => u.id !== user.id);
      } else {
        return [...prev, user];
      }
    });
  };

  const handleChantierSelect = (chantierId: string) => {
    const chantier = chantiers.find(c => c.id === chantierId);
    if (chantier) {
      setSelectedChantier(chantierId);
      setSelectedUsers([chantier.client, ...chantier.assignees]);
    }
  };

  const handleSearchSubmit = () => {
    if (searchTerm && !searchHistory.includes(searchTerm)) {
      setSearchHistory(prev => [searchTerm, ...prev.slice(0, 4)]);
    }
  };

  const handleConfirm = () => {
    if (selectedUsers.length === 0) return;
    
    const type = selectedChantier ? 'chantier' : 'direct';
    onSelectRecipients(selectedUsers, type, selectedChantier || undefined);
    handleClose();
  };

  const handleClose = () => {
    setSearchTerm('');
    setSelectedUsers([]);
    setSelectedChantier(null);
    setActiveTab('users');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      backdropFilter: 'blur(4px)'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '1rem',
        width: '90%',
        maxWidth: '600px',
        maxHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '1.5rem',
          borderBottom: '1px solid #e2e8f0',
          background: 'linear-gradient(135deg, #3b82f6, #f97316)',
          color: 'white'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '600' }}>
              ✏️ Nouveau Message
            </h2>
            <button
              onClick={handleClose}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                color: 'white',
                borderRadius: '0.5rem',
                width: '2rem',
                height: '2rem',
                cursor: 'pointer',
                fontSize: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              ×
            </button>
          </div>
        </div>

        {/* Search */}
        <div style={{ padding: '1rem', borderBottom: '1px solid #f1f5f9' }}>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit()}
              placeholder="🔍 Rechercher contacts, chantiers..."
              style={{
                width: '100%',
                padding: '0.75rem 1rem 0.75rem 2.5rem',
                border: '1px solid #e2e8f0',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                background: '#f8fafc'
              }}
            />
            <div style={{
              position: 'absolute',
              left: '0.75rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#64748b',
              pointerEvents: 'none'
            }}>
              🔍
            </div>
          </div>

          {/* Search History */}
          {searchHistory.length > 0 && !searchTerm && (
            <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {searchHistory.map((term, index) => (
                <button
                  key={index}
                  onClick={() => setSearchTerm(term)}
                  style={{
                    padding: '0.25rem 0.5rem',
                    background: '#f1f5f9',
                    border: '1px solid #e2e8f0',
                    borderRadius: '1rem',
                    fontSize: '0.75rem',
                    color: '#64748b',
                    cursor: 'pointer'
                  }}
                >
                  {term}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0' }}>
          {[
            { key: 'users', label: 'Utilisateurs', icon: '👥', count: users.length },
            { key: 'chantiers', label: 'Par Chantier', icon: '🏗️', count: chantiers.length },
            { key: 'groupes', label: 'Groupes', icon: '👨‍👩‍👧‍👦', count: 0, disabled: true }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => !tab.disabled && setActiveTab(tab.key as 'users' | 'chantiers' | 'groupes')}
              disabled={tab.disabled}
              style={{
                flex: 1,
                padding: '0.75rem 1rem',
                border: 'none',
                background: activeTab === tab.key ? '#f0f9ff' : 'transparent',
                color: tab.disabled ? '#94a3b8' : activeTab === tab.key ? '#3b82f6' : '#64748b',
                borderBottom: activeTab === tab.key ? '2px solid #3b82f6' : 'none',
                cursor: tab.disabled ? 'not-allowed' : 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              <span>{tab.icon}</span>
              {tab.label}
              {tab.count > 0 && (
                <span style={{
                  background: activeTab === tab.key ? '#3b82f6' : '#e2e8f0',
                  color: activeTab === tab.key ? 'white' : '#64748b',
                  fontSize: '0.75rem',
                  padding: '0.125rem 0.5rem',
                  borderRadius: '1rem',
                  minWidth: '1.25rem'
                }}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', minHeight: '300px' }}>
          {loading ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '200px',
              color: '#64748b'
            }}>
              <div>⏳ Chargement...</div>
            </div>
          ) : (
            <>
              {/* Tab Utilisateurs */}
              {activeTab === 'users' && (
                <div style={{ padding: '1rem' }}>
                  {filteredUsers.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                      <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>👥</div>
                      <p>Aucun utilisateur trouvé</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {filteredUsers.map((user) => {
                        const isSelected = selectedUsers.some(u => u.id === user.id);
                        return (
                          <div
                            key={user.id}
                            onClick={() => handleUserToggle(user)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.75rem',
                              padding: '0.75rem',
                              borderRadius: '0.5rem',
                              cursor: 'pointer',
                              background: isSelected ? '#f0f9ff' : 'transparent',
                              border: isSelected ? '1px solid #3b82f6' : '1px solid transparent',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            <UserAvatar 
                              user={user} 
                              size="md" 
                            />
                            <div style={{ flex: 1 }}>
                              <p style={{ margin: 0, fontWeight: '500', color: '#1e293b' }}>
                                {user.name}
                              </p>
                              <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>
                                {user.role} {user.company && `• ${user.company}`}
                              </p>
                              {user.lastActive && (
                                <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8' }}>
                                  Actif {user.lastActive}
                                </p>
                              )}
                            </div>
                            <div style={{
                              width: '1.25rem',
                              height: '1.25rem',
                              borderRadius: '50%',
                              background: isSelected ? '#3b82f6' : 'transparent',
                              border: `2px solid ${isSelected ? '#3b82f6' : '#d1d5db'}`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              {isSelected && (
                                <span style={{ color: 'white', fontSize: '0.75rem' }}>✓</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Tab Par Chantier */}
              {activeTab === 'chantiers' && (
                <div style={{ padding: '1rem' }}>
                  {filteredChantiers.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                      <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🏗️</div>
                      <p>Aucun chantier trouvé</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {filteredChantiers.map((chantier) => {
                        const isSelected = selectedChantier === chantier.id;
                        return (
                          <div
                            key={chantier.id}
                            onClick={() => handleChantierSelect(chantier.id)}
                            style={{
                              padding: '1rem',
                              borderRadius: '0.75rem',
                              cursor: 'pointer',
                              background: isSelected ? '#f0f9ff' : 'white',
                              border: isSelected ? '1px solid #3b82f6' : '1px solid #e2e8f0',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                              <div style={{
                                width: '2.5rem',
                                height: '2.5rem',
                                borderRadius: '0.5rem',
                                background: chantier.photo ? `url(${chantier.photo})` : 'linear-gradient(135deg, #3b82f6, #f97316)',
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontSize: '1.25rem'
                              }}>
                                {!chantier.photo && '🏗️'}
                              </div>
                              <div style={{ flex: 1 }}>
                                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '600', color: '#1e293b' }}>
                                  {chantier.nom}
                                </h3>
                                <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b' }}>
                                  Client: {chantier.client.name}
                                </p>
                              </div>
                            </div>
                            
                            <div style={{ paddingLeft: '3.25rem' }}>
                              <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.75rem', color: '#64748b', fontWeight: '500' }}>
                                Équipe ({chantier.assignees.length + 1} membres):
                              </p>
                              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                <UserAvatar user={chantier.client} size="sm" />
                                {chantier.assignees.map((assignee) => (
                                  <UserAvatar key={assignee.id} user={assignee} size="sm" />
                                ))}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Tab Groupes (Future) */}
              {activeTab === 'groupes' && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '200px',
                  textAlign: 'center',
                  color: '#64748b'
                }}>
                  <div>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🚧</div>
                    <p>Conversations de groupe</p>
                    <p style={{ fontSize: '0.875rem' }}>Fonctionnalité à venir</p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Selected Users Preview */}
        {selectedUsers.length > 0 && (
          <div style={{
            padding: '1rem',
            borderTop: '1px solid #e2e8f0',
            background: '#f8fafc'
          }}>
            <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', color: '#64748b', fontWeight: '500' }}>
              Destinataires sélectionnés ({selectedUsers.length}):
            </p>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {selectedUsers.map((user) => (
                <div
                  key={user.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    background: 'white',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '1rem',
                    border: '1px solid #e2e8f0',
                    fontSize: '0.75rem'
                  }}
                >
                  <UserAvatar user={user} size="sm" />
                  <span>{user.name}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUserToggle(user);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#64748b',
                      fontSize: '0.875rem',
                      padding: '0',
                      marginLeft: '0.25rem'
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{
          padding: '1rem',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <p style={{ 
            margin: 0, 
            fontSize: '0.875rem', 
            color: selectedUsers.length === 0 ? '#ef4444' : '#64748b' 
          }}>
            {selectedUsers.length === 0 
              ? 'Sélectionnez au moins 1 destinataire'
              : `${selectedUsers.length} destinataire${selectedUsers.length > 1 ? 's' : ''} sélectionné${selectedUsers.length > 1 ? 's' : ''}`
            }
          </p>
          
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={handleClose}
              style={{
                padding: '0.5rem 1rem',
                border: '1px solid #e2e8f0',
                borderRadius: '0.5rem',
                background: 'white',
                color: '#64748b',
                cursor: 'pointer',
                fontSize: '0.875rem'
              }}
            >
              Annuler
            </button>
            <button
              onClick={handleConfirm}
              disabled={selectedUsers.length === 0}
              className="btn-primary"
              style={{
                padding: '0.5rem 1.5rem',
                fontSize: '0.875rem',
                opacity: selectedUsers.length === 0 ? 0.5 : 1,
                cursor: selectedUsers.length === 0 ? 'not-allowed' : 'pointer'
              }}
            >
              Continuer →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}