"use client";

import { useState, useRef, useEffect } from 'react';

interface MessageEditProps {
  messageId: string;
  originalText: string;
  onSave: (messageId: string, newText: string) => Promise<boolean>;
  onCancel: () => void;
  maxLength?: number;
}

export default function MessageEdit({
  messageId,
  originalText,
  onSave,
  onCancel,
  maxLength = 2000
}: MessageEditProps) {
  const [text, setText] = useState(originalText);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(text.length, text.length);
    }
  }, []);

  useEffect(() => {
    setHasChanges(text.trim() !== originalText.trim());
  }, [text, originalText]);

  const handleSave = async () => {
    if (!hasChanges || !text.trim()) return;
    
    setSaving(true);
    try {
      const success = await onSave(messageId, text.trim());
      if (success) {
        onCancel();
      }
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onCancel();
    }
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      handleSave();
    }
  };

  const remainingChars = maxLength - text.length;
  const isOverLimit = remainingChars < 0;

  return (
    <div style={{
      background: 'white',
      border: '2px solid #3b82f6',
      borderRadius: '0.75rem',
      padding: '1rem',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
    }}>
      <div style={{ marginBottom: '0.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>
            ✏️ Modification du message
          </span>
          <span style={{ 
            fontSize: '0.75rem', 
            color: isOverLimit ? '#ef4444' : '#64748b' 
          }}>
            {remainingChars} caractères restants
          </span>
        </div>
        
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          style={{
            width: '100%',
            minHeight: '80px',
            maxHeight: '200px',
            padding: '0.75rem',
            border: `1px solid ${isOverLimit ? '#ef4444' : '#e5e7eb'}`,
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            fontFamily: 'inherit',
            resize: 'vertical',
            outline: 'none',
            lineHeight: 1.5
          }}
          placeholder="Modifiez votre message..."
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
          ⌘ + Entrée pour sauvegarder • Échap pour annuler
        </div>
        
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={onCancel}
            disabled={saving}
            style={{
              padding: '0.5rem 1rem',
              background: 'transparent',
              border: '1px solid #e5e7eb',
              borderRadius: '0.5rem',
              color: '#64748b',
              cursor: saving ? 'not-allowed' : 'pointer',
              fontSize: '0.875rem',
              opacity: saving ? 0.5 : 1,
              transition: 'all 0.2s ease'
            }}
          >
            Annuler
          </button>
          
          <button
            onClick={handleSave}
            disabled={!hasChanges || saving || isOverLimit || !text.trim()}
            style={{
              padding: '0.5rem 1.5rem',
              background: (!hasChanges || saving || isOverLimit || !text.trim()) 
                ? '#e5e7eb' 
                : 'linear-gradient(135deg, #3b82f6, #f97316)',
              color: (!hasChanges || saving || isOverLimit || !text.trim()) ? '#9ca3af' : 'white',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: (!hasChanges || saving || isOverLimit || !text.trim()) ? 'not-allowed' : 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500',
              transition: 'all 0.2s ease'
            }}
          >
            {saving ? '⏳ Sauvegarde...' : 'Sauvegarder'}
          </button>
        </div>
      </div>
    </div>
  );
}
