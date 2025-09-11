"use client";

import { useState, useRef, useEffect } from 'react';
import { useMessages } from '@/hooks/useMessages';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';

interface ChatWidgetProps {
  chantierId: string;
  userId?: string;
  minimized?: boolean;
}

export default function ChatWidget({ 
  chantierId, 
  userId = 'test-client-123',
  minimized: initialMinimized = true 
}: ChatWidgetProps) {
  const [isMinimized, setIsMinimized] = useState(initialMinimized);
  const [isVisible, setIsVisible] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const {
    messages,
    sendMessage,
    setActiveConversation,
    loadingMessages,
    sending,
    error
  } = useMessages();

  // Charger la conversation du chantier
  useEffect(() => {
    if (chantierId) {
      setActiveConversation(chantierId);
    }
  }, [chantierId, setActiveConversation]);

  // Auto-scroll vers le bas
  useEffect(() => {
    if (!isMinimized && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isMinimized]);

  // Animation d'apparition
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 500);
    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  const toggleWidget = () => {
    setIsMinimized(!isMinimized);
  };

  const handleSendMessage = async (text: string, photos: string[]) => {
    const success = await sendMessage(text, chantierId, undefined, photos);
    return success;
  };

  if (isMinimized) {
    return (
      <div
        style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          zIndex: 1000,
          cursor: 'pointer'
        }}
        onClick={toggleWidget}
      >
        <div
          style={{
            width: '3.5rem',
            height: '3.5rem',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #3b82f6, #f97316)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '1.5rem',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            transition: 'all 0.3s ease',
            animation: 'bounce 2s infinite'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          💬
        </div>
        
        <style jsx>{`
          @keyframes bounce {
            0%, 20%, 53%, 80%, 100% {
              transform: translateY(0);
            }
            40%, 43% {
              transform: translateY(-10px);
            }
            70% {
              transform: translateY(-5px);
            }
            90% {
              transform: translateY(-2px);
            }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '2rem',
        right: '2rem',
        width: '400px',
        height: '500px',
        background: 'white',
        borderRadius: '1rem',
        boxShadow: '0 20px 25px rgba(0, 0, 0, 0.1)',
        border: '1px solid #e5e7eb',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 1000,
        overflow: 'hidden',
        animation: 'slideUp 0.3s ease-out'
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '1rem',
          background: 'linear-gradient(135deg, #3b82f6, #f97316)',
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <div>
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '600' }}>
            💬 Chat du chantier
          </h3>
          <p style={{ margin: 0, fontSize: '0.75rem', opacity: 0.9 }}>
            Discussion temps réel
          </p>
        </div>
        
        <button
          onClick={toggleWidget}
          style={{
            background: 'rgba(255, 255, 255, 0.2)',
            border: 'none',
            color: 'white',
            borderRadius: '0.375rem',
            width: '2rem',
            height: '2rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1rem'
          }}
        >
          ✕
        </button>
      </div>

      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}
      >
        {error && (
          <div
            style={{
              background: '#fee2e2',
              border: '1px solid #fecaca',
              borderRadius: '0.5rem',
              padding: '0.75rem',
              color: '#dc2626',
              fontSize: '0.875rem',
              textAlign: 'center'
            }}
          >
            ⚠️ {error}
          </div>
        )}

        {loadingMessages ? (
          <div style={{ textAlign: 'center', color: '#64748b' }}>
            <div>⏳</div>
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem' }}>
              Chargement des messages...
            </p>
          </div>
        ) : messages.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#64748b', padding: '2rem' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💬</div>
            <p style={{ margin: 0, fontSize: '0.875rem' }}>
              Aucun message encore.<br />
              Démarrez la conversation !
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={{
                id: message.id,
                message: message.content,
                photos: message.photos,
                createdAt: message.timestamp,
                lu: message.read || false,
                expediteur: {
                  id: message.senderId,
                  name: message.senderName,
                  role: message.senderRole || 'user'
                },
                isEdited: false,
                editedAt: undefined,
                isPinned: false
              }}
              currentUserId={userId}
              isOwn={message.senderId === userId}
            />
          ))
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={{ borderTop: '1px solid #e5e7eb' }}>
        <MessageInput
          onSendMessage={handleSendMessage}
          disabled={sending}
          placeholder="Écrivez votre message..."
          compact={true}
        />
      </div>

      <style jsx>{`
        @keyframes slideUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
