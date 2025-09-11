"use client";

import { useState, useRef } from 'react';
import UserAvatar from "./UserAvatar";
import MessageActions from "./MessageActions";
import MessageEdit from "./MessageEdit";

interface MessageBubbleProps {
  message: {
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
    isEdited?: boolean;
    editedAt?: string;
    isPinned?: boolean;
  };
  isOwn: boolean;
  showAvatar?: boolean;
  currentUserId: string;
  onReply?: (messageId: string) => void;
  onEdit?: (messageId: string, newText: string) => Promise<boolean>;
  onDelete?: (messageId: string) => void;
  onCopy?: (messageId: string) => void;
  onPin?: (messageId: string) => void;
  onReport?: (messageId: string) => void;
}

export default function MessageBubble({ 
  message, 
  isOwn, 
  showAvatar = true,
  onReply,
  onEdit,
  onDelete,
  onCopy,
  onPin,
  onReport
}: MessageBubbleProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const bubbleRef = useRef<HTMLDivElement>(null);

  const formatTime = (dateString: string) => {
    const today = new Date();
    const messageDate = new Date(dateString);
    const isToday = today.toDateString() === messageDate.toDateString();
    
    if (isToday) {
      return messageDate.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    
    return messageDate.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const canEdit = () => {
    if (!isOwn || !onEdit) return false;
    const messageTime = new Date(message.createdAt).getTime();
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;
    return (now - messageTime) < fiveMinutes;
  };

  const handleDoubleClick = () => {
    if (canEdit()) {
      setIsEditing(true);
    }
  };

  const handleCopy = async (messageId: string) => {
    try {
      await navigator.clipboard.writeText(message.message);
      onCopy?.(messageId);
    } catch (error) {
      console.error('Failed to copy message:', error);
    }
  };

  const handleEditSave = async (messageId: string, newText: string) => {
    if (onEdit) {
      const success = await onEdit(messageId, newText);
      if (success) {
        setIsEditing(false);
      }
      return success;
    }
    return false;
  };

  if (isEditing) {
    return (
      <div style={{
        display: 'flex',
        gap: '0.75rem',
        marginBottom: '1rem',
        flexDirection: isOwn ? 'row-reverse' : 'row',
        alignItems: 'flex-start'
      }}>
        {showAvatar && !isOwn && (
          <UserAvatar 
            user={message.expediteur} 
            size="sm"
          />
        )}
        
        <div style={{ maxWidth: '70%', width: '100%' }}>
          <MessageEdit
            messageId={message.id}
            originalText={message.message}
            onSave={handleEditSave}
            onCancel={() => setIsEditing(false)}
          />
        </div>
        
        {showAvatar && isOwn && (
          <UserAvatar 
            user={message.expediteur} 
            size="sm"
          />
        )}
      </div>
    );
  }

  return (
    <div
      ref={bubbleRef}
      style={{
        display: 'flex',
        gap: '0.75rem',
        marginBottom: '1rem',
        flexDirection: isOwn ? 'row-reverse' : 'row',
        alignItems: 'flex-end',
        position: 'relative'
      }}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {showAvatar && !isOwn && (
        <UserAvatar 
          user={message.expediteur} 
          size="sm"
        />
      )}

      <div
        style={{
          maxWidth: '70%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: isOwn ? 'flex-end' : 'flex-start',
          position: 'relative'
        }}
      >
        {!isOwn && (
          <div style={{
            fontSize: '0.75rem',
            color: '#64748b',
            marginBottom: '0.25rem',
            fontWeight: '500'
          }}>
            {message.expediteur.name}
          </div>
        )}

        <div
          style={{
            background: isOwn 
              ? 'linear-gradient(135deg, #3b82f6, #f97316)'
              : 'white',
            color: isOwn ? 'white' : '#1e293b',
            padding: '0.75rem 1rem',
            borderRadius: isOwn 
              ? '1rem 1rem 0.25rem 1rem'
              : '1rem 1rem 1rem 0.25rem',
            boxShadow: isOwn 
              ? '0 4px 12px rgba(59, 130, 246, 0.3)'
              : '0 2px 8px rgba(0,0,0,0.1)',
            border: isOwn ? 'none' : '1px solid #e2e8f0',
            wordBreak: 'break-word',
            lineHeight: 1.5,
            position: 'relative',
            cursor: canEdit() ? 'pointer' : 'default'
          }}
          onDoubleClick={handleDoubleClick}
          title={canEdit() ? 'Double-cliquez pour modifier' : ''}
        >
          {message.isPinned && (
            <div style={{
              position: 'absolute',
              top: '-8px',
              right: isOwn ? 'auto' : '-8px',
              left: isOwn ? '-8px' : 'auto',
              background: '#f59e0b',
              color: 'white',
              borderRadius: '50%',
              width: '1.5rem',
              height: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.75rem',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }}>
              📌
            </div>
          )}

          {message.message}

          {message.photos.length > 0 && (
            <div style={{ 
              marginTop: '0.5rem',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
              gap: '0.5rem'
            }}>
              {message.photos.map((photo, index) => (
                <img
                  key={index}
                  src={photo}
                  alt={`Photo ${index + 1}`}
                  style={{
                    width: '100%',
                    maxWidth: '200px',
                    borderRadius: '0.5rem',
                    cursor: 'pointer'
                  }}
                  onClick={() => window.open(photo, '_blank')}
                />
              ))}
            </div>
          )}

          {showActions && (onReply || onEdit || onDelete || onCopy || onPin) && (
            <div style={{
              position: 'absolute',
              top: '-0.5rem',
              right: isOwn ? 'auto' : '-2.5rem',
              left: isOwn ? '-2.5rem' : 'auto',
              zIndex: 10
            }}>
              <MessageActions
                messageId={message.id}
                isOwn={isOwn}
                canEdit={canEdit()}
                canDelete={true}
                onReply={onReply || (() => {})}
                onEdit={() => setIsEditing(true)}
                onDelete={onDelete || (() => {})}
                onCopy={handleCopy}
                onPin={onPin || (() => {})}
                onReport={onReport}
              />
            </div>
          )}
        </div>

        <div style={{
          fontSize: '0.75rem',
          color: '#94a3b8',
          marginTop: '0.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          {formatTime(message.createdAt)}
          {message.isEdited && (
            <span style={{ fontStyle: 'italic' }} title={`Modifié le ${formatTime(message.editedAt || message.createdAt)}`}>
              (modifié)
            </span>
          )}
          {isOwn && (
            <span style={{ 
              color: message.lu ? '#10b981' : '#94a3b8',
              fontSize: '0.75rem'
            }}>
              {message.lu ? '✓✓' : '✓'}
            </span>
          )}
        </div>
      </div>

      {showAvatar && isOwn && (
        <UserAvatar 
          user={message.expediteur} 
          size="sm"
        />
      )}
    </div>
  );
}
