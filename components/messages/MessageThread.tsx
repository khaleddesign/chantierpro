"use client";

import { useState, useEffect, useRef } from 'react';
import UserAvatar from './UserAvatar';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';

interface ThreadMessage {
  id: string;
  message: string;
  photos: string[];
  createdAt: string;
  lu: boolean;
  expediteur: {
    id: string;
    name: string;
    role: string;
  };
  parentId?: string;
  replies?: ThreadMessage[];
}

interface MessageThreadProps {
  parentMessage: ThreadMessage;
  thread: ThreadMessage[];
  currentUserId: string;
  onSendReply: (text: string, photos: string[], parentId: string) => Promise<boolean>;
  onLoadMoreReplies?: (parentId: string) => void;
  maxDepth?: number;
  currentDepth?: number;
  collapsed?: boolean;
}

export default function MessageThread({
  parentMessage,
  thread,
  currentUserId,
  onSendReply,
  onLoadMoreReplies,
  maxDepth = 3,
  currentDepth = 0,
  collapsed: initialCollapsed = false
}: MessageThreadProps) {
  const [collapsed, setCollapsed] = useState(initialCollapsed);
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [sending, setSending] = useState(false);
  const replyInputRef = useRef<HTMLDivElement>(null);

  const replies = thread.filter(msg => msg.parentId === parentMessage.id);
  const hasReplies = replies.length > 0;
  const canReply = currentDepth < maxDepth;

  useEffect(() => {
    if (showReplyInput && replyInputRef.current) {
      replyInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [showReplyInput]);

  const handleReply = async (text: string, photos: string[]) => {
    if (!text.trim()) return false;
    
    setSending(true);
    try {
      const success = await onSendReply(text, photos, parentMessage.id);
      if (success) {
        setShowReplyInput(false);
        setCollapsed(false);
      }
      return success;
    } finally {
      setSending(false);
    }
  };

  const toggleCollapsed = () => {
    setCollapsed(!collapsed);
  };

  const getIndentLevel = () => {
    return Math.min(currentDepth * 2, 6);
  };

  return (
    <div 
      style={{ 
        marginLeft: `${getIndentLevel()}rem`,
        borderLeft: currentDepth > 0 ? '2px solid #f1f5f9' : 'none',
        paddingLeft: currentDepth > 0 ? '1rem' : '0',
        marginTop: currentDepth > 0 ? '0.5rem' : '0'
      }}
    >
      <div style={{ position: 'relative' }}>
        {currentDepth > 0 && (
          <div
            style={{
              position: 'absolute',
              left: '-1rem',
              top: '1rem',
              width: '0.75rem',
              height: '2px',
              background: '#e2e8f0'
            }}
          />
        )}

        <MessageBubble
          message={parentMessage}
          currentUserId={currentUserId}
          isOwn={parentMessage.expediteur.id === currentUserId}
          showAvatar={true}
        />

        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.5rem', 
          marginTop: '0.25rem',
          marginBottom: '0.5rem',
          paddingLeft: currentDepth > 0 ? '3rem' : '0'
        }}>
          {hasReplies && (
            <button
              onClick={toggleCollapsed}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.75rem',
                color: '#3b82f6',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                padding: '0.25rem',
                borderRadius: '0.25rem',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#f0f9ff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <span style={{ transform: collapsed ? 'rotate(-90deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}>
                ▼
              </span>
              {collapsed ? `Voir ${replies.length} réponse${replies.length > 1 ? 's' : ''}` : `Masquer les réponses`}
            </button>
          )}

          {canReply && !showReplyInput && (
            <button
              onClick={() => setShowReplyInput(true)}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.75rem',
                color: '#64748b',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                padding: '0.25rem',
                borderRadius: '0.25rem',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#3b82f6';
                e.currentTarget.style.background = '#f8fafc';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#64748b';
                e.currentTarget.style.background = 'transparent';
              }}
            >
              ↩️ Répondre
            </button>
          )}
        </div>

        {showReplyInput && canReply && (
          <div 
            ref={replyInputRef}
            style={{ 
              marginBottom: '1rem',
              paddingLeft: currentDepth > 0 ? '3rem' : '0',
              background: '#f8fafc',
              padding: '1rem',
              borderRadius: '0.75rem',
              border: '1px solid #e2e8f0'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <UserAvatar 
                user={{ id: currentUserId, name: 'Vous', role: 'USER' }} 
                size="sm" 
              />
              <div style={{ flex: 1 }}>
                <p style={{ 
                  margin: 0, 
                  fontSize: '0.75rem', 
                  color: '#64748b',
                  marginBottom: '0.5rem'
                }}>
                  En réponse à <strong>{parentMessage.expediteur.name}</strong>
                </p>
              </div>
            </div>
            
            <MessageInput
              onSendMessage={handleReply}
              placeholder={`Répondre à ${parentMessage.expediteur.name}...`}
              disabled={sending}
              compact={true}
            />
            
            <div style={{ 
              display: 'flex', 
              justifyContent: 'flex-end', 
              gap: '0.5rem',
              marginTop: '0.5rem'
            }}>
              <button
                onClick={() => setShowReplyInput(false)}
                disabled={sending}
                style={{
                  padding: '0.5rem 1rem',
                  background: 'transparent',
                  border: '1px solid #e2e8f0',
                  borderRadius: '0.5rem',
                  color: '#64748b',
                  cursor: sending ? 'not-allowed' : 'pointer',
                  fontSize: '0.875rem',
                  opacity: sending ? 0.5 : 1
                }}
              >
                Annuler
              </button>
            </div>
          </div>
        )}

        {hasReplies && !collapsed && (
          <div style={{ marginTop: '0.5rem' }}>
            {replies.map((reply) => (
              <MessageThread
                key={reply.id}
                parentMessage={reply}
                thread={thread}
                currentUserId={currentUserId}
                onSendReply={onSendReply}
                onLoadMoreReplies={onLoadMoreReplies}
                maxDepth={maxDepth}
                currentDepth={currentDepth + 1}
              />
            ))}
            
            {replies.length >= 10 && onLoadMoreReplies && (
              <button
                onClick={() => onLoadMoreReplies(parentMessage.id)}
                style={{
                  marginTop: '0.5rem',
                  marginLeft: '3rem',
                  background: 'transparent',
                  border: '1px solid #e2e8f0',
                  color: '#3b82f6',
                  padding: '0.5rem 1rem',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#f0f9ff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                Charger plus de réponses...
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
