"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import UserAvatar from "./UserAvatar";
import NewMessageModal from "./NewMessageModal";

interface Conversation {
  id: string;
  nom: string;
  type: 'chantier' | 'direct' | 'groupe';
  participants: Array<{
    id: string;
    name: string;
    role: string;
  }>;
  lastMessage?: {
    id: string;
    message: string;
    createdAt: string;
    expediteur: {
      name: string;
    };
  } | null;
  unreadCount: number;
  photo?: string;
  updatedAt: string;
  isPinned?: boolean;
  isFavorite?: boolean;
}

interface ConversationListProps {
  conversations: Conversation[];
  activeConversationId?: string;
  onSelectConversation: (conversationId: string) => void;
  loading?: boolean;
}

export default function ConversationList({
  conversations,
  activeConversationId,
  onSelectConversation,
  loading = false
}: ConversationListProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<'all' | 'unread' | 'chantier' | 'favorites'>('all');
  const [showNewMessageModal, setShowNewMessageModal] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Raccourci clavier Ctrl+F pour la recherche
  useEffect(() => {
    const handleKeyboard = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        router.push('/dashboard/messages/recherche');
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        setShowNewMessageModal(true);
      }
    };

    window.addEventListener('keydown', handleKeyboard);
    return () => window.removeEventListener('keydown', handleKeyboard);
  }, [router]);

  // Charger l'historique de recherche
  useEffect(() => {
    const history = localStorage.getItem('conversation-search-history');
    if (history) {
      try {
        setSearchHistory(JSON.parse(history));
      } catch (error) {
        console.warn('Historique de recherche de conversation corrompu, suppression:', error);
        localStorage.removeItem('conversation-search-history');
        setSearchHistory([]);
      }
    }
  }, []);

  const saveSearchTerm = (term: string) => {
    if (term.trim() && !searchHistory.includes(term)) {
      const newHistory = [term, ...searchHistory].slice(0, 5);
      setSearchHistory(newHistory);
      localStorage.setItem('conversation-search-history', JSON.stringify(newHistory));
    }
  };

  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = conv.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         conv.participants.some(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesFilter = filter === 'all' || 
                         (filter === 'unread' && conv.unreadCount > 0) ||
                         (filter === 'chantier' && conv.type === 'chantier') ||
                         (filter === 'favorites' && conv.isFavorite);
    
    return matchesSearch && matchesFilter;
  });

  const handleNewMessageConfirm = (recipients: any[], type: 'direct' | 'chantier', chantierId?: string) => {
    setShowNewMessageModal(false);
    
    // Rediriger vers la page nouveau message avec les destinataires pré-sélectionnés
    const params = new URLSearchParams();
    params.set('recipients', recipients.map(r => r.id).join(','));
    if (type === 'chantier' && chantierId) {
      params.set('chantier', chantierId);
    }
    
    router.push(`/dashboard/messages/nouveau?${params.toString()}`);
  };

  const handleToggleFavorite = (conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    // TODO: Implémenter l'ajout/suppression des favoris
    console.log('Toggle favorite:', conversationId);
  };

  const formatLastMessageTime = (dateString: string) => {
    const now = new Date();
    const messageDate = new Date(dateString);
    const diffMs = now.getTime() - messageDate.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'À l\'instant';
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffHours < 168) return `Il y a ${Math.floor(diffHours / 24)}j`;
    return messageDate.toLocaleDateString('fr-FR');
  };

  const LoadingSkeleton = () => (
    <div style={{ padding: '1rem' }}>
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          style={{
            height: '70px',
            background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
            backgroundSize: '200% 100%',
            animation: 'loading 1.5s infinite',
            borderRadius: '0.75rem',
            marginBottom: '0.5rem'
          }}
        />
      ))}
    </div>
  );

  if (loading) return <LoadingSkeleton />;

  return (
    <>
      <div style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'white',
        borderRadius: '1rem',
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        
        {/* Header avec actions */}
        <div style={{ padding: '1.5rem 1.5rem 1rem 1.5rem', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1e293b', margin: 0 }}>
              💬 Messages
            </h2>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => setShowNewMessageModal(true)}
                className="btn-primary"
                style={{
                  padding: '0.5rem 0.75rem',
                  fontSize: '0.875rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
                title="Nouveau message (Ctrl+N)"
              >
                ✏️ Nouveau
              </button>
            </div>
          </div>

          {/* Barre de recherche avec raccourcis */}
          <div style={{ position: 'relative', marginBottom: '1rem' }}>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="🔍 Rechercher conversations... (Ctrl+F)"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                if (e.target.value.trim()) {
                  saveSearchTerm(e.target.value);
                }
              }}
              onFocus={() => setShowSearchSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSearchSuggestions(false), 200)}
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem 0.5rem 2.5rem',
                border: '1px solid #e2e8f0',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                color: '#1e293b',
                background: 'white'
              }}
            />
            <div style={{
              position: 'absolute',
              left: '0.75rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#64748b'
            }}>
              🔍
            </div>
            
            {/* Bouton recherche globale */}
            <button
              onClick={() => router.push('/dashboard/messages/recherche' + (searchTerm ? `?q=${encodeURIComponent(searchTerm)}` : ''))}
              style={{
                position: 'absolute',
                right: '0.5rem',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: '#64748b',
                cursor: 'pointer',
                padding: '0.25rem',
                borderRadius: '0.25rem',
                fontSize: '0.75rem'
              }}
              title="Recherche globale (Ctrl+K)"
            >
              🌐
            </button>

            {/* Suggestions de recherche */}
            {showSearchSuggestions && searchHistory.length > 0 && !searchTerm && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                background: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: '0.5rem',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                marginTop: '0.25rem',
                zIndex: 10,
                maxHeight: '150px',
                overflowY: 'auto'
              }}>
                <div style={{ padding: '0.5rem', borderBottom: '1px solid #f1f5f9' }}>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '500' }}>
                    Recherches récentes:
                  </span>
                </div>
                {searchHistory.map((term, index) => (
                  <button
                    key={index}
                    onClick={() => setSearchTerm(term)}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '0.5rem 0.75rem',
                      border: 'none',
                      background: 'none',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      color: '#1e293b'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                  >
                    🕒 {term}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Filtres améliorés */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {[
              { key: 'all', label: 'Tous', icon: '💬', count: conversations.length },
              { key: 'unread', label: 'Non lus', icon: '🔴', count: conversations.filter(c => c.unreadCount > 0).length },
              { key: 'chantier', label: 'Chantiers', icon: '🏗️', count: conversations.filter(c => c.type === 'chantier').length },
              { key: 'favorites', label: 'Favoris', icon: '⭐', count: conversations.filter(c => c.isFavorite).length }
            ].map(filterOption => (
              <button
                key={filterOption.key}
                onClick={() => setFilter(filterOption.key as any)}
                style={{
                  padding: '0.4rem 0.75rem',
                  borderRadius: '0.5rem',
                  background: filter === filterOption.key 
                    ? 'linear-gradient(135deg, #3b82f6, #f97316)'
                    : 'white',
                  color: filter === filterOption.key ? 'white' : '#64748b',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  fontWeight: '500',
                  border: filter === filterOption.key ? 'none' : '1px solid #e2e8f0'
                }}
              >
                <span>{filterOption.icon}</span>
                {filterOption.label}
                {filterOption.count > 0 && (
                  <span style={{
                    background: filter === filterOption.key ? 'rgba(255,255,255,0.3)' : '#f1f5f9',
                    color: filter === filterOption.key ? 'white' : '#64748b',
                    fontSize: '0.7rem',
                    padding: '0.125rem 0.375rem',
                    borderRadius: '0.75rem',
                    fontWeight: '600',
                    minWidth: '1rem'
                  }}>
                    {filterOption.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Liste des conversations */}
        <div style={{ 
          flex: 1, 
          overflowY: 'auto',
          padding: '0.5rem'
        }}>
          {filteredConversations.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '3rem 1rem',
              color: '#64748b'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
                {searchTerm ? '🔍' : filter === 'unread' ? '✅' : filter === 'favorites' ? '⭐' : '💬'}
              </div>
              <h3 style={{ fontSize: '1.125rem', marginBottom: '0.5rem', color: '#1e293b' }}>
                {searchTerm ? 'Aucun résultat' :
                 filter === 'unread' ? 'Tout est lu !' :
                 filter === 'favorites' ? 'Aucun favori' :
                 'Aucune conversation'}
              </h3>
              <p style={{ margin: '0 0 1.5rem 0', fontSize: '0.875rem' }}>
                {searchTerm ? 'Essayez avec d\'autres termes' :
                 filter === 'unread' ? 'Tous vos messages ont été lus' :
                 filter === 'favorites' ? 'Ajoutez vos conversations importantes aux favoris' :
                 'Commencez une nouvelle conversation'}
              </p>
              
              {!searchTerm && (
                <button
                  onClick={() => setShowNewMessageModal(true)}
                  className="btn-primary"
                  style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
                >
                  ✏️ Nouveau message
                </button>
              )}
              
              {searchTerm && (
                <button
                  onClick={() => router.push(`/dashboard/messages/recherche?q=${encodeURIComponent(searchTerm)}`)}
                  className="btn-primary"
                  style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
                >
                  🌐 Recherche globale
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {/* Conversations épinglées en premier */}
              {filteredConversations
                .filter(conv => conv.isPinned)
                .map((conversation) => (
                  <ConversationItem
                    key={conversation.id}
                    conversation={conversation}
                    isActive={activeConversationId === conversation.id}
                    onSelect={onSelectConversation}
                    onToggleFavorite={handleToggleFavorite}
                    isPinned={true}
                  />
                ))}
              
              {/* Autres conversations */}
              {filteredConversations
                .filter(conv => !conv.isPinned)
                .map((conversation) => (
                  <ConversationItem
                    key={conversation.id}
                    conversation={conversation}
                    isActive={activeConversationId === conversation.id}
                    onSelect={onSelectConversation}
                    onToggleFavorite={handleToggleFavorite}
                  />
                ))}
            </div>
          )}
        </div>

        {/* Footer avec raccourcis */}
        <div style={{ 
          padding: '1rem', 
          borderTop: '1px solid #e2e8f0',
          background: '#f8fafc'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
              {filteredConversations.length} conversation{filteredConversations.length > 1 ? 's' : ''}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
              Ctrl+N • Ctrl+F • Ctrl+K
            </div>
          </div>
        </div>
      </div>

      {/* Modal nouveau message */}
      <NewMessageModal
        isOpen={showNewMessageModal}
        onClose={() => setShowNewMessageModal(false)}
        onSelectRecipients={handleNewMessageConfirm}
      />

      <style jsx>{`
        @keyframes loading {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </>
  );
}

// Composant pour chaque conversation
function ConversationItem({ 
  conversation, 
  isActive, 
  onSelect, 
  onToggleFavorite,
  isPinned = false 
}: {
  conversation: Conversation;
  isActive: boolean;
  onSelect: (id: string) => void;
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
  isPinned?: boolean;
}) {
  const formatLastMessageTime = (dateString: string) => {
    const now = new Date();
    const messageDate = new Date(dateString);
    const diffHours = Math.floor((now.getTime() - messageDate.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'maintenant';
    if (diffHours < 24) return `${diffHours}h`;
    if (diffHours < 168) return `${Math.floor(diffHours / 24)}j`;
    return messageDate.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
  };

  return (
    <div
      onClick={() => onSelect(conversation.id)}
      style={{
        padding: '1rem',
        borderRadius: '0.75rem',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        background: isActive 
          ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(249, 115, 22, 0.1))'
          : 'transparent',
        border: isActive
          ? '1px solid rgba(59, 130, 246, 0.3)'
          : '1px solid transparent',
        marginBottom: '0.25rem',
        position: 'relative'
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          e.currentTarget.style.background = '#f8fafc';
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          e.currentTarget.style.background = 'transparent';
        }
      }}
    >
      {/* Badge épinglé */}
      {isPinned && (
        <div style={{
          position: 'absolute',
          top: '0.5rem',
          right: '0.5rem',
          color: '#f59e0b',
          fontSize: '0.75rem'
        }}>
          📌
        </div>
      )}

      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
        <div style={{ position: 'relative' }}>
          {conversation.photo ? (
            <img
              src={conversation.photo}
              alt={conversation.nom}
              style={{
                width: '3rem',
                height: '3rem',
                borderRadius: '0.75rem',
                objectFit: 'cover'
              }}
            />
          ) : (
            <div style={{
              width: '3rem',
              height: '3rem',
              borderRadius: '0.75rem',
              background: 'linear-gradient(135deg, #3b82f6, #f97316)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '1.25rem'
            }}>
              {conversation.type === 'chantier' ? '🏗️' : '💬'}
            </div>
          )}
          
          {conversation.unreadCount > 0 && (
            <div style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              background: '#ef4444',
              color: 'white',
              fontSize: '0.75rem',
              borderRadius: '50%',
              minWidth: '1.25rem',
              height: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }}>
              {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
            </div>
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'flex-start',
            marginBottom: '0.25rem'
          }}>
            <h3 style={{
              margin: 0,
              fontSize: '0.875rem',
              fontWeight: '600',
              color: '#1e293b',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              flex: 1
            }}>
              {conversation.nom}
            </h3>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: '0.5rem' }}>
              {conversation.lastMessage && (
                <span style={{
                  fontSize: '0.75rem',
                  color: '#94a3b8',
                  flexShrink: 0
                }}>
                  {formatLastMessageTime(conversation.lastMessage.createdAt)}
                </span>
              )}
              
              <button
                onClick={(e) => onToggleFavorite(conversation.id, e)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: conversation.isFavorite ? '#f59e0b' : '#d1d5db',
                  fontSize: '0.875rem',
                  padding: '0.25rem'
                }}
                title={conversation.isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
              >
                ⭐
              </button>
            </div>
          </div>

          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.25rem',
            marginBottom: '0.25rem'
          }}>
            {conversation.participants.slice(0, 3).map((participant, index) => (
              <UserAvatar
                key={participant.id}
                user={participant}
                size="sm"
              />
            ))}
            {conversation.participants.length > 3 && (
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                +{conversation.participants.length - 3}
              </span>
            )}
          </div>

          {conversation.lastMessage ? (
            <p style={{
              margin: 0,
              fontSize: '0.75rem',
              color: '#64748b',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              lineHeight: 1.4
            }}>
              <strong>{conversation.lastMessage.expediteur.name}:</strong> {conversation.lastMessage.message}
            </p>
          ) : (
            <p style={{
              margin: 0,
              fontSize: '0.75rem',
              color: '#94a3b8',
              fontStyle: 'italic'
            }}>
              Aucun message
            </p>
          )}
        </div>
      </div>
    </div>
  );
}