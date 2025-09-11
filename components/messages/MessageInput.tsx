"use client";

import { useState, useRef, useCallback } from 'react';

interface MessageInputProps {
  onSendMessage: (text: string, photos: string[]) => Promise<boolean>;
  placeholder?: string;
  disabled?: boolean;
  showUpload?: boolean;
  compact?: boolean;
  maxLength?: number;
}

export default function MessageInput({
  onSendMessage,
  placeholder = "Écrivez votre message...",
  disabled = false,
  showUpload = true,
  compact = false,
  maxLength = 2000
}: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = async () => {
    if (!message.trim() && photos.length === 0) return;
    if (disabled) return;

    const success = await onSendMessage(message.trim(), photos);
    if (success) {
      setMessage('');
      setPhotos([]);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        return;
      }
      e.preventDefault();
      handleSend();
    }
  };

  const adjustTextareaHeight = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      const maxHeight = compact ? 80 : 120;
      textareaRef.current.style.height = Math.min(scrollHeight, maxHeight) + 'px';
    }
  }, [compact]);

  const handleFileSelect = async (files: FileList) => {
    if (!showUpload) return;
    
    setUploading(true);
    const newPhotos: string[] = [];

    for (let i = 0; i < Math.min(files.length, 5); i++) {
      const file = files[i];
      
      if (!file.type.startsWith('image/')) continue;
      if (file.size > 10 * 1024 * 1024) continue;

      try {
        const base64 = await fileToBase64(file);
        newPhotos.push(base64);
      } catch (error) {
        console.error('Erreur upload fichier:', error);
      }
    }

    setPhotos(prev => [...prev, ...newPhotos].slice(0, 5));
    setUploading(false);
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    if (disabled || !showUpload) return;
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled && showUpload) {
      setDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const remainingChars = maxLength - message.length;
  const isOverLimit = remainingChars < 0;

  return (
    <div style={{
      padding: compact ? '0.75rem' : '1rem',
      background: dragOver ? '#f0f9ff' : 'transparent',
      borderRadius: '0.75rem',
      border: dragOver ? '2px dashed #3b82f6' : 'none',
      transition: 'all 0.2s ease'
    }}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      {photos.length > 0 && (
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          marginBottom: '0.75rem',
          flexWrap: 'wrap'
        }}>
          {photos.map((photo, index) => (
            <div key={index} style={{ position: 'relative' }}>
              <img
                src={photo}
                alt={`Upload ${index + 1}`}
                style={{
                  width: '60px',
                  height: '60px',
                  objectFit: 'cover',
                  borderRadius: '0.5rem',
                  border: '1px solid #e2e8f0'
                }}
              />
              <button
                onClick={() => removePhoto(index)}
                style={{
                  position: 'absolute',
                  top: '-6px',
                  right: '-6px',
                  width: '20px',
                  height: '20px',
                  background: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              adjustTextareaHeight();
            }}
            onKeyDown={handleKeyDown}
            placeholder={dragOver ? "Déposez vos fichiers ici..." : placeholder}
            disabled={disabled}
            style={{
              width: '100%',
              minHeight: compact ? '40px' : '60px',
              maxHeight: compact ? '80px' : '120px',
              padding: '0.75rem',
              border: `1px solid ${isOverLimit ? '#ef4444' : '#e2e8f0'}`,
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              fontFamily: 'inherit',
              resize: 'none',
              outline: 'none',
              background: disabled ? '#f9fafb' : 'white',
              color: disabled ? '#9ca3af' : '#1e293b'
            }}
          />
          
          {maxLength && (
            <div style={{
              position: 'absolute',
              bottom: '0.5rem',
              right: '0.75rem',
              fontSize: '0.75rem',
              color: isOverLimit ? '#ef4444' : '#94a3b8',
              pointerEvents: 'none'
            }}>
              {remainingChars}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {showUpload && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                style={{ display: 'none' }}
                onChange={(e) => {
                  if (e.target.files) {
                    handleFileSelect(e.target.files);
                  }
                }}
              />
              
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled || uploading || photos.length >= 5}
                style={{
                  padding: '0.75rem',
                  background: 'transparent',
                  border: '1px solid #e2e8f0',
                  borderRadius: '0.5rem',
                  cursor: disabled || uploading || photos.length >= 5 ? 'not-allowed' : 'pointer',
                  color: disabled || uploading || photos.length >= 5 ? '#9ca3af' : '#64748b',
                  fontSize: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: disabled || uploading || photos.length >= 5 ? 0.5 : 1
                }}
                title={photos.length >= 5 ? 'Maximum 5 photos' : 'Ajouter des photos'}
              >
                {uploading ? '⏳' : '📷'}
              </button>
            </>
          )}

          <button
            onClick={handleSend}
            disabled={disabled || (!message.trim() && photos.length === 0) || isOverLimit}
            style={{
              padding: compact ? '0.5rem 1rem' : '0.75rem 1.5rem',
              background: disabled || (!message.trim() && photos.length === 0) || isOverLimit
                ? '#e5e7eb'
                : 'linear-gradient(135deg, #3b82f6, #f97316)',
              color: disabled || (!message.trim() && photos.length === 0) || isOverLimit ? '#9ca3af' : 'white',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: disabled || (!message.trim() && photos.length === 0) || isOverLimit ? 'not-allowed' : 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <span>📤</span>
            {compact ? '' : 'Envoyer'}
          </button>
        </div>
      </div>

      {!compact && (
        <p style={{
          margin: '0.5rem 0 0 0',
          fontSize: '0.75rem',
          color: '#64748b'
        }}>
          Maj + Entrée pour nouvelle ligne • Glissez-déposez vos photos
        </p>
      )}
    </div>
  );
}
