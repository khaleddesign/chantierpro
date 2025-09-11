'use client';

import { useState, useEffect } from 'react';

interface TVAMultiTauxProps {
  devisId: string;
  ligneDevis: any[];
  onUpdate?: (repartition: any) => void;
  readOnly?: boolean;
}

export default function TVAMultiTaux({
  devisId,
  ligneDevis,
  onUpdate,
  readOnly = false
}: TVAMultiTauxProps) {
  const [repartitionTVA, setRepartitionTVA] = useState({
    tva55: 0,
    tva10: 0,
    tva20: 0,
    totalHT: 0,
    totalTVA: 0,
    totalTTC: 0
  });

  const [lignesDetail, setLignesDetail] = useState<any[]>([]);
  const [autoliquidation, setAutoliquidation] = useState(false);
  const [mentionAutoliq, setMentionAutoliq] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRepartitionTVA();
  }, [devisId]);

  const fetchRepartitionTVA = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/devis/${devisId}/tva-multitaux`);
      const data = await response.json();
      
      if (response.ok) {
        setRepartitionTVA(data.repartitionTVA);
        setAutoliquidation(data.autoliquidation);
        setMentionAutoliq(data.mentionAutoliq || '');
        
        // Initialiser les lignes avec les taux par défaut
        const lignesAvecTVA = ligneDevis.map((ligne, index) => ({
          ligneId: ligne.id,
          designation: ligne.description,
          montantHT: ligne.total,
          tauxTVA: 20.0,
          categorie: 'Fourniture',
          unite: ligne.unite || 'forfait'
        }));
        setLignesDetail(lignesAvecTVA);
      }
    } catch (error) {
      console.error('Erreur chargement TVA:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateLigneTVA = (index: number, field: string, value: any) => {
    const newLignes = [...lignesDetail];
    newLignes[index] = { ...newLignes[index], [field]: value };
    setLignesDetail(newLignes);
    calculerRepartition(newLignes);
  };

  const calculerRepartition = (lignes: any[]) => {
    let tva55 = 0, tva10 = 0, tva20 = 0;
    let totalHT = 0;

    lignes.forEach((ligne) => {
      const montantTVA = ligne.montantHT * (ligne.tauxTVA / 100);
      totalHT += ligne.montantHT;
      
      if (ligne.tauxTVA === 5.5) tva55 += montantTVA;
      else if (ligne.tauxTVA === 10) tva10 += montantTVA;
      else if (ligne.tauxTVA === 20) tva20 += montantTVA;
    });

    const totalTVA = autoliquidation ? 0 : (tva55 + tva10 + tva20);
    const totalTTC = totalHT + totalTVA;

    const nouvelleRepartition = {
      tva55: autoliquidation ? 0 : tva55,
      tva10: autoliquidation ? 0 : tva10,
      tva20: autoliquidation ? 0 : tva20,
      totalHT,
      totalTVA,
      totalTTC
    };

    setRepartitionTVA(nouvelleRepartition);
    
    if (onUpdate) {
      onUpdate(nouvelleRepartition);
    }
  };

  const handleSaveRepartition = async () => {
    try {
      const response = await fetch(`/api/devis/${devisId}/tva-multitaux`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lignesDetailTVA: lignesDetail,
          autoliquidation,
          mentionAutoliq
        })
      });

      if (response.ok) {
        alert('Répartition TVA mise à jour avec succès');
      } else {
        const error = await response.json();
        alert(error.error || 'Erreur lors de la mise à jour');
      }
    } catch (error) {
      console.error('Erreur sauvegarde TVA:', error);
      alert('Erreur lors de la sauvegarde');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{ color: '#64748b' }}>Chargement TVA multi-taux...</div>
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: '1.5rem' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.5rem'
      }}>
        <h3 style={{ margin: 0, color: '#1e293b' }}>
          🧮 TVA Multi-Taux BTP
        </h3>
        
        {!readOnly && (
          <button
            onClick={handleSaveRepartition}
            className="btn-primary"
            style={{ fontSize: '0.875rem' }}
          >
            💾 Sauvegarder
          </button>
        )}
      </div>

      {/* Autoliquidation */}
      <div style={{
        background: '#fef3c7',
        border: '1px solid #f59e0b',
        borderRadius: '0.75rem',
        padding: '1rem',
        marginBottom: '1.5rem'
      }}>
        <label style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          cursor: 'pointer'
        }}>
          <input
            type="checkbox"
            checked={autoliquidation}
            onChange={(e) => {
              setAutoliquidation(e.target.checked);
              if (e.target.checked) {
                setMentionAutoliq('TVA non applicable, art. 293 B du CGI - Autoliquidation');
              } else {
                setMentionAutoliq('');
              }
              calculerRepartition(lignesDetail);
            }}
            disabled={readOnly}
          />
          <span style={{ fontWeight: '500', color: '#92400e' }}>
            Autoliquidation de la TVA (sous-traitance)
          </span>
        </label>
        
        {autoliquidation && (
          <textarea
            value={mentionAutoliq}
            onChange={(e) => setMentionAutoliq(e.target.value)}
            placeholder="Mention légale d'autoliquidation..."
            readOnly={readOnly}
            rows={2}
            style={{
              width: '100%',
              marginTop: '0.75rem',
              padding: '0.5rem',
              border: '1px solid #f59e0b',
              borderRadius: '0.5rem',
              background: 'white',
              fontSize: '0.875rem'
            }}
          />
        )}
      </div>

      {/* Table des lignes avec TVA */}
      <div style={{
        background: '#f8fafc',
        borderRadius: '0.5rem',
        overflow: 'hidden',
        marginBottom: '1.5rem'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '2fr 100px 80px 100px 120px 100px',
          gap: '0.5rem',
          padding: '1rem',
          background: '#e2e8f0',
          fontWeight: '600',
          fontSize: '0.875rem',
          color: '#374151'
        }}>
          <div>Désignation</div>
          <div>Montant HT</div>
          <div>TVA %</div>
          <div>Catégorie</div>
          <div>Unité</div>
          <div>TVA</div>
        </div>

        {lignesDetail.map((ligne, index) => (
          <div key={ligne.ligneId || index} style={{
            display: 'grid',
            gridTemplateColumns: '2fr 100px 80px 100px 120px 100px',
            gap: '0.5rem',
            padding: '1rem',
            borderBottom: index < lignesDetail.length - 1 ? '1px solid #e2e8f0' : 'none',
            alignItems: 'center'
          }}>
            <div style={{ fontSize: '0.875rem' }}>
              {ligne.designation}
            </div>
            
            <div style={{
              fontSize: '0.875rem',
              fontWeight: '500',
              textAlign: 'right'
            }}>
              {formatCurrency(ligne.montantHT)}
            </div>
            
            <select
              value={ligne.tauxTVA}
              onChange={(e) => updateLigneTVA(index, 'tauxTVA', parseFloat(e.target.value))}
              disabled={readOnly || autoliquidation}
              style={{
                padding: '0.25rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.25rem',
                fontSize: '0.75rem',
                background: autoliquidation ? '#f3f4f6' : 'white',
                opacity: autoliquidation ? 0.5 : 1
              }}
            >
              <option value={5.5}>5,5%</option>
              <option value={10}>10%</option>
              <option value={20}>20%</option>
            </select>
            
            <select
              value={ligne.categorie}
              onChange={(e) => updateLigneTVA(index, 'categorie', e.target.value)}
              disabled={readOnly}
              style={{
                padding: '0.25rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.25rem',
                fontSize: '0.75rem',
                background: 'white'
              }}
            >
              <option value="Fourniture">Fourniture</option>
              <option value="Main d'œuvre">Main d'œuvre</option>
              <option value="Mixte">Mixte</option>
            </select>
            
            <input
              type="text"
              value={ligne.unite}
              onChange={(e) => updateLigneTVA(index, 'unite', e.target.value)}
              disabled={readOnly}
              style={{
                padding: '0.25rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.25rem',
                fontSize: '0.75rem',
                background: readOnly ? '#f3f4f6' : 'white'
              }}
            />
            
            <div style={{
              fontSize: '0.875rem',
              fontWeight: '500',
              textAlign: 'right',
              color: autoliquidation ? '#9ca3af' : '#059669'
            }}>
              {formatCurrency(autoliquidation ? 0 : (ligne.montantHT * ligne.tauxTVA / 100))}
            </div>
          </div>
        ))}
      </div>

      {/* Récapitulatif TVA */}
      <div style={{
        background: '#f0f9ff',
        border: '1px solid #0ea5e9',
        borderRadius: '0.75rem',
        padding: '1.5rem'
      }}>
        <h4 style={{ margin: '0 0 1rem 0', color: '#0369a1' }}>
          📊 Récapitulatif TVA
        </h4>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '1rem',
          marginBottom: '1rem'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: '1.125rem',
              fontWeight: 'bold',
              color: repartitionTVA.tva55 > 0 ? '#059669' : '#9ca3af'
            }}>
              {formatCurrency(repartitionTVA.tva55)}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#0369a1' }}>
              TVA 5,5%
            </div>
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: '1.125rem',
              fontWeight: 'bold',
              color: repartitionTVA.tva10 > 0 ? '#059669' : '#9ca3af'
            }}>
              {formatCurrency(repartitionTVA.tva10)}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#0369a1' }}>
              TVA 10%
            </div>
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: '1.125rem',
              fontWeight: 'bold',
              color: repartitionTVA.tva20 > 0 ? '#059669' : '#9ca3af'
            }}>
              {formatCurrency(repartitionTVA.tva20)}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#0369a1' }}>
              TVA 20%
            </div>
          </div>
        </div>
        
        <div style={{ 
          borderTop: '1px solid #0ea5e9',
          paddingTop: '1rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '1rem',
          textAlign: 'center'
        }}>
          <div>
            <div style={{ fontSize: '1rem', fontWeight: '600', color: '#0369a1' }}>
              {formatCurrency(repartitionTVA.totalHT)}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#0369a1' }}>Total HT</div>
          </div>
          
          <div>
            <div style={{
              fontSize: '1rem',
              fontWeight: '600',
              color: autoliquidation ? '#dc2626' : '#0369a1'
            }}>
              {formatCurrency(repartitionTVA.totalTVA)}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#0369a1' }}>
              Total TVA {autoliquidation && '(Autoliq.)'}
            </div>
          </div>
          
          <div>
            <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#0369a1' }}>
              {formatCurrency(repartitionTVA.totalTTC)}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#0369a1' }}>Total TTC</div>
          </div>
        </div>
      </div>
    </div>
  );
}
