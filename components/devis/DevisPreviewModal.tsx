'use client';

import { useState } from 'react';
import DevisPrintView from './DevisPrintView';

interface DevisPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  devis: any;
  onSend?: () => void;
  onDownload?: () => void;
}

export default function DevisPreviewModal({ 
  isOpen, 
  onClose, 
  devis, 
  onSend,
  onDownload 
}: DevisPreviewModalProps) {
  const [activeTab, setActiveTab] = useState<'preview' | 'email'>('preview');
  const [emailData, setEmailData] = useState({
    to: devis?.client?.email || '',
    subject: `${devis?.type === 'DEVIS' ? 'Devis' : 'Facture'} ${devis?.numero} - ${devis?.objet}`,
    message: `Bonjour,

Veuillez trouver ci-joint votre ${devis?.type?.toLowerCase()} ${devis?.numero}.

${devis?.type === 'DEVIS' ? 
  'N\'hésitez pas à nous contacter pour toute question ou modification.' :
  'Merci de procéder au règlement dans les délais convenus.'
}

Cordialement,
L'équipe ChantierPro`
  });

  if (!isOpen || !devis) return null;

  const handleSend = () => {
    if (onSend) {
      onSend();
      onClose();
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    if (onDownload) {
      onDownload();
    } else {
      alert('Téléchargement PDF simulé');
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.8)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '1rem',
        width: '100%',
        maxWidth: '1200px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '1.5rem',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h2 style={{ margin: 0, color: '#1e293b' }}>
              {devis.type === 'DEVIS' ? '📄' : '🧾'} Aperçu - {devis.numero}
            </h2>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: '#64748b' }}>
              {devis.objet}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '0.5rem',
              border: 'none',
              background: '#f1f5f9',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontSize: '1.25rem'
            }}
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div style={{
          padding: '0 1.5rem',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          gap: '1rem'
        }}>
          <button
            onClick={() => setActiveTab('preview')}
            style={{
              padding: '1rem 1.5rem',
              border: 'none',
              background: 'transparent',
              borderBottom: activeTab === 'preview' ? '2px solid #3b82f6' : '2px solid transparent',
              color: activeTab === 'preview' ? '#3b82f6' : '#64748b',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            👁️ Aperçu
          </button>
          <button
            onClick={() => setActiveTab('email')}
            style={{
              padding: '1rem 1.5rem',
              border: 'none',
              background: 'transparent',
              borderBottom: activeTab === 'email' ? '2px solid #3b82f6' : '2px solid transparent',
              color: activeTab === 'email' ? '#3b82f6' : '#64748b',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            📧 Email
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          {activeTab === 'preview' ? (
            <div style={{ padding: '2rem' }}>
              <DevisPrintView devis={devis} />
            </div>
          ) : (
            <div style={{ padding: '1.5rem' }}>
              <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                <h3 style={{ marginBottom: '1rem', color: '#1e293b' }}>
                  📧 Envoi par Email
                </h3>
                
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontWeight: '500',
                    color: '#374151'
                  }}>
                    Destinataire
                  </label>
                  <input
                    type="email"
                    value={emailData.to}
                    onChange={(e) => setEmailData({ ...emailData, to: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.5rem'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontWeight: '500',
                    color: '#374151'
                  }}>
                    Objet
                  </label>
                  <input
                    type="text"
                    value={emailData.subject}
                    onChange={(e) => setEmailData({ ...emailData, subject: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.5rem'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontWeight: '500',
                    color: '#374151'
                  }}>
                    Message
                  </label>
                  <textarea
                    value={emailData.message}
                    onChange={(e) => setEmailData({ ...emailData, message: e.target.value })}
                    rows={8}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.5rem',
                      resize: 'vertical'
                    }}
                  />
                </div>

                <div style={{
                  background: '#f0f9ff',
                  padding: '1rem',
                  borderRadius: '0.5rem',
                  marginBottom: '1rem'
                }}>
                  <div style={{ fontSize: '0.875rem', color: '#0369a1' }}>
                    📎 Le PDF sera automatiquement joint à l'email
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{
          padding: '1.5rem',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              onClick={handlePrint}
              style={{
                padding: '0.75rem 1.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.5rem',
                background: 'white',
                color: '#374151',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              🖨️ Imprimer
            </button>
            
            <button
              onClick={handleDownload}
              style={{
                padding: '0.75rem 1.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.5rem',
                background: 'white',
                color: '#374151',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              📄 Télécharger PDF
            </button>
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              onClick={onClose}
              style={{
                padding: '0.75rem 1.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.5rem',
                background: 'white',
                color: '#374151',
                cursor: 'pointer'
              }}
            >
              Fermer
            </button>
            
            {onSend && (
              <button
                onClick={handleSend}
                className="btn-primary"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                📤 Envoyer
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
