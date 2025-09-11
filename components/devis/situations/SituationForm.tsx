'use client';

import { useState } from 'react';

interface SituationFormProps {
  devisId: string;
  devisNumero: string;
  numeroSituation: number;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

export default function SituationForm({
  devisId,
  devisNumero,
  numeroSituation,
  onSubmit,
  onCancel
}: SituationFormProps) {
  const [formData, setFormData] = useState({
    avancement: 0,
    notes: '',
    dateValidite: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.avancement || formData.avancement <= 0) {
      newErrors.avancement = 'L\'avancement doit être supérieur à 0%';
    }

    if (formData.avancement > 100) {
      newErrors.avancement = 'L\'avancement ne peut pas dépasser 100%';
    }

    if (!formData.notes.trim()) {
      newErrors.notes = 'Une description est requise';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit({
        avancement: formData.avancement,
        notes: formData.notes.trim(),
        dateValidite: formData.dateValidite
      });
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1rem'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '1rem',
        width: '100%',
        maxWidth: '600px',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        {/* En-tête */}
        <div style={{
          padding: '1.5rem',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h3 style={{ margin: 0, color: '#1e293b' }}>
            📊 Nouvelle Situation S{String(numeroSituation).padStart(2, '0')}
          </h3>
          <button
            onClick={onCancel}
            style={{
              padding: '0.5rem',
              border: 'none',
              background: '#f1f5f9',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              color: '#64748b'
            }}
          >
            ✕
          </button>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} style={{ padding: '1.5rem' }}>
          <div style={{
            background: '#f0f9ff',
            padding: '1rem',
            borderRadius: '0.5rem',
            marginBottom: '1.5rem',
            border: '1px solid #0ea5e9'
          }}>
            <div style={{ fontWeight: '600', color: '#0369a1', marginBottom: '0.5rem' }}>
              Devis de référence
            </div>
            <div style={{ fontSize: '0.875rem', color: '#0369a1' }}>
              {devisNumero} → {devisNumero}-S{String(numeroSituation).padStart(2, '0')}
            </div>
          </div>

          {/* Avancement */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontWeight: '500',
              color: '#374151'
            }}>
              Pourcentage d'avancement * (0-100%)
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <input
                type="range"
                min="0"
                max="100"
                value={formData.avancement}
                onChange={(e) => setFormData({
                  ...formData,
                  avancement: parseInt(e.target.value)
                })}
                style={{ flex: 1 }}
              />
              <input
                type="number"
                min="0"
                max="100"
                value={formData.avancement}
                onChange={(e) => setFormData({
                  ...formData,
                  avancement: parseInt(e.target.value) || 0
                })}
                style={{
                  width: '80px',
                  padding: '0.5rem',
                  border: `1px solid ${errors.avancement ? '#ef4444' : '#d1d5db'}`,
                  borderRadius: '0.5rem',
                  textAlign: 'center'
                }}
              />
              <span style={{ fontSize: '0.875rem', color: '#64748b' }}>%</span>
            </div>
            {errors.avancement && (
              <div style={{
                fontSize: '0.75rem',
                color: '#ef4444',
                marginTop: '0.25rem'
              }}>
                {errors.avancement}
              </div>
            )}
          </div>

          {/* Visualisation de l'avancement */}
          <div style={{
            background: '#f8fafc',
            padding: '1rem',
            borderRadius: '0.5rem',
            marginBottom: '1.5rem'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '0.5rem'
            }}>
              <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>
                Avancement visuel
              </span>
              <span style={{
                fontSize: '1rem',
                fontWeight: 'bold',
                color: formData.avancement >= 100 ? '#10b981' : '#3b82f6'
              }}>
                {formData.avancement}%
              </span>
            </div>
            <div style={{
              width: '100%',
              height: '1rem',
              background: '#e5e7eb',
              borderRadius: '0.5rem',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${Math.min(formData.avancement, 100)}%`,
                height: '100%',
                background: formData.avancement >= 100 ? '#10b981' : 
                           formData.avancement >= 50 ? '#3b82f6' : '#f59e0b',
                borderRadius: '0.5rem',
                transition: 'all 0.3s ease'
              }} />
            </div>
          </div>

          {/* Description */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontWeight: '500',
              color: '#374151'
            }}>
              Description des travaux réalisés *
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({
                ...formData,
                notes: e.target.value
              })}
              placeholder="Ex: Gros œuvre terminé, pose de la charpente en cours..."
              rows={4}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: `1px solid ${errors.notes ? '#ef4444' : '#d1d5db'}`,
                borderRadius: '0.5rem',
                resize: 'vertical',
                fontFamily: 'inherit'
              }}
            />
            {errors.notes && (
              <div style={{
                fontSize: '0.75rem',
                color: '#ef4444',
                marginTop: '0.25rem'
              }}>
                {errors.notes}
              </div>
            )}
          </div>

          {/* Date de validité */}
          <div style={{ marginBottom: '2rem' }}>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontWeight: '500',
              color: '#374151'
            }}>
              Date de validité
            </label>
            <input
              type="date"
              value={formData.dateValidite}
              onChange={(e) => setFormData({
                ...formData,
                dateValidite: e.target.value
              })}
              style={{
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.5rem'
              }}
            />
          </div>

          {/* Actions */}
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '1rem',
            paddingTop: '1rem',
            borderTop: '1px solid #e2e8f0'
          }}>
            <button
              type="button"
              onClick={onCancel}
              style={{
                padding: '0.75rem 1.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.5rem',
                background: 'white',
                color: '#374151',
                cursor: 'pointer'
              }}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={Object.keys(errors).length > 0}
              style={{
                opacity: Object.keys(errors).length > 0 ? 0.5 : 1,
                cursor: Object.keys(errors).length > 0 ? 'not-allowed' : 'pointer'
              }}
            >
              📊 Créer la Situation
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
