"use client";

import { useState, useEffect, useRef } from 'react';

interface MediaFile {
  id: string;
  url: string;
  name: string;
  type: 'image' | 'document' | 'video';
  size?: number;
  uploadedBy: {
    id: string;
    name: string;
  };
  uploadedAt: string;
}

interface MediaViewerProps {
  files: MediaFile[];
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
  onDownload?: (file: MediaFile) => void;
  onShare?: (file: MediaFile) => void;
  onDelete?: (file: MediaFile) => void;
}

export default function MediaViewer({
  files,
  initialIndex = 0,
  isOpen,
  onClose,
  onDownload,
  onShare,
  onDelete
}: MediaViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const viewerRef = useRef<HTMLDivElement>(null);

  const currentFile = files[currentIndex];

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          goToPrevious();
          break;
        case 'ArrowRight':
          goToNext();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, currentIndex]);

  const goToPrevious = () => {
    setCurrentIndex(prev => prev > 0 ? prev - 1 : files.length - 1);
    setIsLoading(true);
    setError(null);
  };

  const goToNext = () => {
    setCurrentIndex(prev => prev < files.length - 1 ? prev + 1 : 0);
    setIsLoading(true);
    setError(null);
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const kb = bytes / 1024;
    const mb = kb / 1024;
    if (mb >= 1) return `${mb.toFixed(1)} MB`;
    return `${kb.toFixed(0)} KB`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDownload = async () => {
    if (!currentFile || !onDownload) return;
    
    try {
      const response = await fetch(currentFile.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = currentFile.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      onDownload(currentFile);
    } catch (error) {
      console.error('Erreur téléchargement:', error);
    }
  };

  const renderContent = () => {
    if (!currentFile) return null;

    switch (currentFile.type) {
      case 'image':
        return (
          <img
            src={currentFile.url}
            alt={currentFile.name}
            style={{
              maxWidth: '90vw',
              maxHeight: '80vh',
              objectFit: 'contain',
              borderRadius: '0.5rem',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
            }}
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setIsLoading(false);
              setError('Impossible de charger l\'image');
            }}
          />
        );

      case 'video':
        return (
          <video
            controls
            style={{
              maxWidth: '90vw',
              maxHeight: '80vh',
              borderRadius: '0.5rem',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
            }}
            onLoadedData={() => setIsLoading(false)}
            onError={() => {
              setIsLoading(false);
              setError('Impossible de charger la vidéo');
            }}
          >
            <source src={currentFile.url} />
            Votre navigateur ne supporte pas la lecture vidéo.
          </video>
        );

      case 'document':
        return (
          <div style={{
            background: 'white',
            borderRadius: '1rem',
            padding: '2rem',
            maxWidth: '500px',
            textAlign: 'center',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
          }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📄</div>
            <h3 style={{ margin: '0 0 1rem 0', color: '#1e293b' }}>{currentFile.name}</h3>
            <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
              Document • {formatFileSize(currentFile.size)}
            </p>
            
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                onClick={handleDownload}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'linear-gradient(135deg, #3b82f6, #f97316)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500'
                }}
              >
                📥 Télécharger
              </button>
              
              <button
                onClick={() => window.open(currentFile.url, '_blank')}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'transparent',
                  color: '#3b82f6',
                  border: '1px solid #3b82f6',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500'
                }}
              >
                🔗 Ouvrir
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.9)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        backdropFilter: 'blur(4px)'
      }}
      onClick={onClose}
    >
      <div
        ref={viewerRef}
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1rem'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{
          position: 'absolute',
          top: '-4rem',
          right: '0',
          zIndex: 10,
          display: 'flex',
          gap: '0.5rem'
        }}>
          {onShare && (
            <button
              onClick={() => onShare(currentFile)}
              style={{
                width: '2.5rem',
                height: '2.5rem',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '50%',
                color: 'white',
                cursor: 'pointer',
                fontSize: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backdropFilter: 'blur(10px)'
              }}
              title="Partager"
            >
              📤
            </button>
          )}

          <button
            onClick={handleDownload}
            style={{
              width: '2.5rem',
              height: '2.5rem',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '50%',
              color: 'white',
              cursor: 'pointer',
              fontSize: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(10px)'
            }}
            title="Télécharger"
          >
            📥
          </button>

          {onDelete && (
            <button
              onClick={() => onDelete(currentFile)}
              style={{
                width: '2.5rem',
                height: '2.5rem',
                background: 'rgba(239, 68, 68, 0.2)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                borderRadius: '50%',
                color: '#ef4444',
                cursor: 'pointer',
                fontSize: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backdropFilter: 'blur(10px)'
              }}
              title="Supprimer"
            >
              🗑️
            </button>
          )}

          <button
            onClick={onClose}
            style={{
              width: '2.5rem',
              height: '2.5rem',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '50%',
              color: 'white',
              cursor: 'pointer',
              fontSize: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(10px)'
            }}
            title="Fermer"
          >
            ×
          </button>
        </div>

        {files.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              style={{
                position: 'absolute',
                left: '-4rem',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '3rem',
                height: '3rem',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '50%',
                color: 'white',
                cursor: 'pointer',
                fontSize: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backdropFilter: 'blur(10px)'
              }}
            >
              ‹
            </button>

            <button
              onClick={goToNext}
              style={{
                position: 'absolute',
                right: '-4rem',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '3rem',
                height: '3rem',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '50%',
                color: 'white',
                cursor: 'pointer',
                fontSize: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backdropFilter: 'blur(10px)'
              }}
            >
              ›
            </button>
          </>
        )}

        <div style={{ position: 'relative' }}>
          {isLoading && currentFile.type !== 'document' && (
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              color: 'white',
              fontSize: '1.5rem'
            }}>
              ⏳ Chargement...
            </div>
          )}

          {error && (
            <div style={{
              color: 'white',
              textAlign: 'center',
              padding: '2rem',
              background: 'rgba(239, 68, 68, 0.2)',
              borderRadius: '0.5rem',
              border: '1px solid rgba(239, 68, 68, 0.4)'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>❌</div>
              <p>{error}</p>
            </div>
          )}

          {renderContent()}
        </div>

        <div style={{
          background: 'rgba(0, 0, 0, 0.7)',
          color: 'white',
          padding: '1rem 1.5rem',
          borderRadius: '0.75rem',
          textAlign: 'center',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem' }}>
            {currentFile.name}
          </h4>
          <p style={{ margin: 0, fontSize: '0.875rem', color: '#94a3b8' }}>
            Par {currentFile.uploadedBy.name} • {formatDate(currentFile.uploadedAt)}
            {currentFile.size && ` • ${formatFileSize(currentFile.size)}`}
          </p>
          {files.length > 1 && (
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem', color: '#94a3b8' }}>
              {currentIndex + 1} sur {files.length}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
