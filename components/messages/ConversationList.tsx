"use client";

import { useState } from "react";
import UserAvatar from "./UserAvatar";

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
}

interface ConversationListProps {
  conversations: Conversation[];
  activeConversationId?: string;
  onSelectConversation: (conversationId: string) => void;
  onNewConversation?: () => void;
  loading?: boolean;
}

export default function ConversationList({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  loading = false
}: ConversationListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<'all' | 'unread' | 'chantier'>('all');

  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = conv.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         conv.participants.some(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesFilter = filter === 'all' || 
                         (filter === 'unread' && conv.unreadCount > 0) ||
                         (filter === 'chantier' && conv.type === 'chantier');
    
    return matchesSearch && matchesFilter;
  });

  const formatLastMessageTime = (dateString: string) => {
    const now = new Date();
    const messageDate = new Date(dateString);
    const diffHours = Math.floor((now.getTime() - messageDate.getTime()) / (1000 * 60 * 60));
    
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
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: 'white',
      borderRadius: '1rem',
      overflow: 'hidden'
    }}>
      <div style={{ padding: '1.5rem 1.5rem 1rem 1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1e293b', margin: 0 }}>
            Messages
          </h2>
          {onNewConversation && (
            <button
              onClick={onNewConversation}
              style={{
                width: '2rem',
                height: '2rem',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #3b82f6, #f97316)',
                color: 'white',
                border: 'none',
                cursor: 'pointer',
                fontSize: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Nouvelle conversation"
            >
              ✏️
            </button>
          )}
        </div>

        <div style={{ position: 'relative', marginBottom: '1rem' }}>
          <input
            type="text"
            placeholder="Rechercher une conversation..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '0.5rem 0.75rem 0.5rem 2.5rem',
              border: '1px solid #e2e8f0',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              color: '#1e293b',
              background: '#f8fafc'
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
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {[
            { key: 'all', label: 'Tous', icon: '💬' },
            { key: 'unread', label: 'Non lus', icon: '🔴' },
            { key: 'chantier', label: 'Chantiers', icon: '🏗️' }
          ].map(filterOption => (
            <button
              key={filterOption.key}
              onClick={() => setFilter(filterOption.key as any)}
              style={{
                padding: '0.5rem 0.75rem',
                border: 'none',
                borderRadius: '0.5rem',
                background: filter === filterOption.key 
                  ? 'linear-gradient(135deg, #3b82f6, #f97316)'
                  : '#f1f5f9',
                color: filter === filterOption.key ? 'white' : '#64748b',
                fontSize: '0.75rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}
            >
              <span>{filterOption.icon}</span>
              {filterOption.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ 
        flex: 1, 
        overflowY: 'auto',
        padding: '0 1.5rem 1.5rem 1.5rem'
      }}>
        {filteredConversations.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '2rem 1rem',
            color: '#64748b'
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💬</div>
            <p style={{ margin: 0, fontSize: '0.875rem' }}>
              {searchTerm ? 'Aucune conversation trouvée' : 'Aucune conversation'}
            </p>
          </div>
        ) : (
          filteredConversations.map((conversation) => (
            <div
              key={conversation.id}
              onClick={() => onSelectConversation(conversation.id)}
              style={{
                padding: '0.75rem',
                borderRadius: '0.75rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                background: activeConversationId === conversation.id 
                  ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(249, 115, 22, 0.1))'
                  : 'transparent',
                border: activeConversationId === conversation.id
                  ? '1px solid rgba(59, 130, 246, 0.3)'
                  : '1px solid transparent',
                marginBottom: '0.5rem'
              }}
            >
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
                      whiteSpace: 'nowrap'
                    }}>
                      {conversation.nom}
                    </h3>
                    
                    {conversation.lastMessage && (
                      <span style={{
                        fontSize: '0.75rem',
                        color: '#94a3b8',
                        flexShrink: 0,
                        marginLeft: '0.5rem'
                      }}>
                        {formatLastMessageTime(conversation.lastMessage.createdAt)}
                      </span>
                    )}
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
          ))
        )}
      </div>
    </div>
  );
}
