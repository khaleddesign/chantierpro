'use client';

import { useState, useEffect } from 'react';
import SituationCard from './SituationCard';
import SituationForm from './SituationForm';
import ProgressionTracker from './ProgressionTracker';

interface SituationManagerProps {
  devisId: string;
  devisNumero: string;
  totalInitial: number;
  canCreateSituation?: boolean;
}

export default function SituationManager({
  devisId,
  devisNumero,
  totalInitial,
  canCreateSituation = true
}: SituationManagerProps) {
  const [situations, setSituations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedSituation, setSelectedSituation] = useState<string | null>(null);

  useEffect(() => {
    fetchSituations();
  }, [devisId]);

  const fetchSituations = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/devis/${devisId}/situations`);
      const data = await response.json();
      
      if (response.ok) {
        setSituations(data.situations || []);
      }
    } catch (error) {
      console.error('Erreur chargement situations:', error);
      setSituations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSituation = async (situationData: any) => {
    try {
      const response = await fetch(`/api/devis/${devisId}/situations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(situationData)
      });

      if (response.ok) {
        await fetchSituations();
        setShowForm(false);
        alert('Situation créée avec succès');
      } else {
        const error = await response.json();
        alert(error.error || 'Erreur lors de la création');
      }
    } catch (error) {
      console.error('Erreur création situation:', error);
      alert('Erreur lors de la création');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const totalAvancement = situations.reduce((sum, sit) => sum + (sit.avancement || 0), 0) / situations.length || 0;
  const totalFacture = situations.reduce((sum, sit) => sum + (sit.totalTTC || 0), 0);

  if (loading) {
    return (
      <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{ color: '#64748b' }}>Chargement des situations...</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gap: '1.5rem' }}>
      {/* En-tête avec progression globale */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem'
        }}>
          <h3 style={{ margin: 0, color: '#1e293b' }}>
            📊 Situations de Travaux - {devisNumero}
          </h3>
          
          {canCreateSituation && (
            <button
              onClick={() => setShowForm(true)}
              className="btn-primary"
              style={{ fontSize: '0.875rem' }}
            >
              ➕ Nouvelle Situation
            </button>
          )}
        </div>

        <ProgressionTracker
          totalInitial={totalInitial}
          situations={situations}
          avancementGlobal={totalAvancement}
        />
      </div>

      {/* Liste des situations */}
      {situations.length === 0 ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
          <h4 style={{ color: '#1e293b', marginBottom: '0.5rem' }}>
            Aucune situation créée
          </h4>
          <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
            Créez votre première situation de travaux pour commencer le suivi d'avancement.
          </p>
          {canCreateSituation && (
            <button
              onClick={() => setShowForm(true)}
              className="btn-primary"
            >
              Créer la première situation
            </button>
          )}
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
          gap: '1rem'
        }}>
          {situations.map((situation) => (
            <SituationCard
              key={situation.id}
              situation={situation}
              onSelect={() => setSelectedSituation(situation.id)}
              onRefresh={fetchSituations}
            />
          ))}
        </div>
      )}

      {/* Récapitulatif financier */}
      {situations.length > 0 && (
        <div className="card" style={{ padding: '1.5rem' }}>
          <h4 style={{ marginBottom: '1rem', color: '#1e293b' }}>
            💰 Récapitulatif Financier
          </h4>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem'
          }}>
            <div style={{
              background: '#f0f9ff',
              padding: '1rem',
              borderRadius: '0.75rem',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#0369a1' }}>
                {formatCurrency(totalInitial)}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#0369a1' }}>
                Montant Initial
              </div>
            </div>
            
            <div style={{
              background: '#ecfdf5',
              padding: '1rem',
              borderRadius: '0.75rem',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#065f46' }}>
                {formatCurrency(totalFacture)}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#065f46' }}>
                Total Facturé
              </div>
            </div>
            
            <div style={{
              background: '#fef3c7',
              padding: '1rem',
              borderRadius: '0.75rem',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#92400e' }}>
                {Math.round(totalAvancement)}%
              </div>
              <div style={{ fontSize: '0.875rem', color: '#92400e' }}>
                Avancement Moyen
              </div>
            </div>
            
            <div style={{
              background: totalFacture < totalInitial ? '#fee2e2' : '#ecfdf5',
              padding: '1rem',
              borderRadius: '0.75rem',
              textAlign: 'center'
            }}>
              <div style={{ 
                fontSize: '1.25rem', 
                fontWeight: 'bold', 
                color: totalFacture < totalInitial ? '#dc2626' : '#065f46'
              }}>
                {formatCurrency(totalInitial - totalFacture)}
              </div>
              <div style={{ 
                fontSize: '0.875rem', 
                color: totalFacture < totalInitial ? '#dc2626' : '#065f46'
              }}>
                {totalFacture < totalInitial ? 'Reste à Facturer' : 'Dépassement'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Formulaire de création */}
      {showForm && (
        <SituationForm
          devisId={devisId}
          devisNumero={devisNumero}
          numeroSituation={situations.length + 1}
          onSubmit={handleCreateSituation}
          onCancel={() => setShowForm(false)}
        />
      )}
    </div>
  );
}
