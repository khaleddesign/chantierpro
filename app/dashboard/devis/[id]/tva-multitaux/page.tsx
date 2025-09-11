'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

interface LigneDevis {
  id: string;
  description: string;
  quantite: number;
  prixUnit: number;
  total: number;
}

interface LigneDetailTVA {
  ligneId: string;
  tauxTVA: number;
  categorie?: string;
}

interface DevisDetail {
  id: string;
  numero: string;
  type: 'DEVIS' | 'FACTURE';
  statut: string;
  objet: string;
  totalHT: number;
  ligneDevis: LigneDevis[];
}

export default function TvaMultitauxPage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [devis, setDevis] = useState<DevisDetail | null>(null);
  const [lignesTVA, setLignesTVA] = useState<LigneDetailTVA[]>([]);

  useEffect(() => {
    if (params.id) {
      fetchDevis();
    }
  }, [params.id]);

  const fetchDevis = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/devis/${params.id}`);
      const data = await response.json();
      
      if (response.ok) {
        setDevis(data);
        
        // Initialiser les lignes TVA avec la valeur par défaut (20%)
        const initialLignesTVA = data.ligneDevis.map((ligne: LigneDevis) => ({
          ligneId: ligne.id,
          tauxTVA: 20,
          categorie: 'Construction neuve'
        }));
        
        setLignesTVA(initialLignesTVA);
        
        // Tenter de récupérer les taux TVA existants
        fetchExistingTVA();
      } else {
        alert(data.error || 'Erreur lors du chargement');
        router.push(`/dashboard/devis/${params.id}`);
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchExistingTVA = async () => {
    try {
      const response = await fetch(`/api/devis/${params.id}/tva-multitaux`);
      if (response.ok) {
        const data = await response.json();
        
        if (data.success && data.lignesDetailTVA) {
          setLignesTVA(data.lignesDetailTVA);
        }
      }
    } catch (error) {
      console.error('Erreur chargement TVA:', error);
    }
  };

  const updateLigneTVA = (ligneId: string, tauxTVA: number, categorie?: string) => {
    const newLignesTVA = lignesTVA.map(ligne => {
      if (ligne.ligneId === ligneId) {
        return { ...ligne, tauxTVA, categorie };
      }
      return ligne;
    });
    
    setLignesTVA(newLignesTVA);
  };

  const getTauxCategorie = (taux: number) => {
    switch (taux) {
      case 5.5:
        return 'Rénovation énergétique';
      case 10:
        return 'Amélioration habitation';
      case 20:
        return 'Construction neuve';
      default:
        return '';
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      const response = await fetch(`/api/devis/${params.id}/tva-multitaux`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lignesDetailTVA: lignesTVA
        })
      });

      const result = await response.json();

      if (response.ok) {
        router.push(`/dashboard/devis/${params.id}`);
      } else {
        alert(result.error || 'Erreur lors de la sauvegarde');
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const calculateTotals = () => {
    if (!devis) return { tva55: 0, tva10: 0, tva20: 0, totalTVA: 0 };
    
    const totals = { tva55: 0, tva10: 0, tva20: 0, totalTVA: 0 };
    
    lignesTVA.forEach(ligneTVA => {
      const ligne = devis.ligneDevis.find(l => l.id === ligneTVA.ligneId);
      if (ligne) {
        const montantTVA = ligne.total * (ligneTVA.tauxTVA / 100);
        
        if (ligneTVA.tauxTVA === 5.5) totals.tva55 += montantTVA;
        else if (ligneTVA.tauxTVA === 10) totals.tva10 += montantTVA;
        else if (ligneTVA.tauxTVA === 20) totals.tva20 += montantTVA;
        
        totals.totalTVA += montantTVA;
      }
    });
    
    return totals;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  if (loading) {
    return (
      <div style={{ 
        padding: '2rem',
        textAlign: 'center',
        color: '#64748b'
      }}>
        Chargement...
      </div>
    );
  }

  if (!devis) {
    return (
      <div style={{ 
        padding: '2rem',
        textAlign: 'center',
        color: '#64748b'
      }}>
        Document non trouvé
      </div>
    );
  }

  if (devis.statut !== 'BROUILLON') {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div className="card" style={{ padding: '2rem', maxWidth: '500px', margin: '0 auto' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔒</div>
          <h2 style={{ color: '#1e293b', marginBottom: '1rem' }}>
            Modification impossible
          </h2>
          <p style={{ color: '#64748b', marginBottom: '2rem' }}>
            Seuls les documents en brouillon peuvent être modifiés.
          </p>
          <button
            onClick={() => router.push(`/dashboard/devis/${params.id}`)}
            className="btn-primary"
          >
            Retour au document
          </button>
        </div>
      </div>
    );
  }

  const tvaTotals = calculateTotals();

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ 
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          marginBottom: '0.5rem'
        }}>
          <Link 
            href={`/dashboard/devis/${params.id}`}
            style={{ 
              color: '#64748b',
              textDecoration: 'none',
              fontSize: '0.875rem'
            }}
          >
            ← Retour au document
          </Link>
        </div>
        <h1 style={{ 
          fontSize: '2rem', 
          fontWeight: 'bold', 
          color: '#1e293b',
          margin: '0 0 0.5rem 0',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <span>🧮</span>
          TVA Multi-taux - {devis.numero}
        </h1>
        <p style={{ color: '#64748b', margin: 0 }}>
          {devis.objet}
        </p>
      </div>

      <div className="card" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '1.5rem', color: '#1e293b' }}>
          Configuration des taux de TVA par ligne
        </h3>
        
        <div style={{ 
          background: '#f0f9ff',
          border: '1px solid #0ea5e9',
          borderRadius: '0.5rem',
          padding: '1.5rem',
          marginBottom: '2rem'
        }}>
          <h4 style={{ color: '#0369a1', marginTop: 0, marginBottom: '0.5rem' }}>
            Taux applicables au BTP
          </h4>
          <ul style={{ 
            margin: 0,
            padding: 0,
            listStyle: 'none',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            color: '#0369a1',
            fontSize: '0.875rem'
          }}>
            <li>• <strong>5,5%</strong> - Travaux de rénovation énergétique</li>
            <li>• <strong>10%</strong> - Travaux d'amélioration, de transformation, d'aménagement et d'entretien de logements achevés depuis plus de 2 ans</li>
            <li>• <strong>20%</strong> - Construction neuve, travaux sur logements récents et autres prestations</li>
          </ul>
        </div>
        
        <div style={{ 
          background: '#f8fafc',
          padding: '1rem',
          borderRadius: '0.5rem',
          marginBottom: '1rem'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '2fr 80px 100px 150px 150px',
            gap: '1rem',
            fontWeight: '600',
            fontSize: '0.875rem',
            color: '#374151'
          }}>
            <div>Désignation</div>
            <div>Qté</div>
            <div>Total HT</div>
            <div>Taux TVA</div>
            <div>Catégorie</div>
          </div>
        </div>

        <div style={{ marginBottom: '2rem' }}>
          {devis.ligneDevis.map((ligne, index) => {
            const ligneTVA = lignesTVA.find(l => l.ligneId === ligne.id) || {
              ligneId: ligne.id,
              tauxTVA: 20
            };
            
            return (
              <div key={ligne.id} style={{
                display: 'grid',
                gridTemplateColumns: '2fr 80px 100px 150px 150px',
                gap: '1rem',
                alignItems: 'center',
                padding: '1rem 0',
                borderBottom: index < devis.ligneDevis.length - 1 ? '1px solid #e5e7eb' : 'none'
              }}>
                <div style={{ fontSize: '0.875rem' }}>
                  {ligne.description}
                </div>
                <div style={{ 
                  textAlign: 'center',
                  fontSize: '0.875rem',
                  color: '#64748b'
                }}>
                  {ligne.quantite}
                </div>
                <div style={{ 
                  textAlign: 'right',
                  fontWeight: '500',
                  fontSize: '0.875rem'
                }}>
                  {formatCurrency(Number(ligne.total))}
                </div>
                <div>
                  <select
                    value={ligneTVA.tauxTVA}
                    onChange={(e) => updateLigneTVA(ligne.id, Number(e.target.value), getTauxCategorie(Number(e.target.value)))}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.5rem',
                      background: 'white',
                      fontSize: '0.875rem'
                    }}
                  >
                    <option value={5.5}>5,5%</option>
                    <option value={10}>10%</option>
                    <option value={20}>20%</option>
                  </select>
                </div>
                <div style={{ 
                  fontSize: '0.875rem',
                  color: '#64748b'
                }}>
                  {ligneTVA.categorie || getTauxCategorie(ligneTVA.tauxTVA)}
                </div>
              </div>
            );
          })}
        </div>
        
        <div style={{
          background: '#f0f9ff',
          border: '1px solid #0ea5e9',
          borderRadius: '0.5rem',
          padding: '1.5rem'
        }}>
          <h4 style={{ margin: '0 0 1rem 0', color: '#0369a1' }}>
            Récapitulatif TVA
          </h4>
          
          <div style={{ 
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '2rem'
          }}>
            <div>
              <div style={{ 
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem'
              }}>
                <div style={{ 
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '0.75rem',
                  background: 'white',
                  borderRadius: '0.5rem',
                  border: '1px solid #e2e8f0'
                }}>
                  <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
                    TVA 5,5% (rénovation énergétique)
                  </div>
                  <div style={{ fontSize: '0.875rem', fontWeight: '600' }}>
                    {formatCurrency(tvaTotals.tva55)}
                  </div>
                </div>
                
                <div style={{ 
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '0.75rem',
                  background: 'white',
                  borderRadius: '0.5rem',
                  border: '1px solid #e2e8f0'
                }}>
                  <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
                    TVA 10% (amélioration habitation)
                  </div>
                  <div style={{ fontSize: '0.875rem', fontWeight: '600' }}>
                    {formatCurrency(tvaTotals.tva10)}
                  </div>
                </div>
                
                <div style={{ 
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '0.75rem',
                  background: 'white',
                  borderRadius: '0.5rem',
                  border: '1px solid #e2e8f0'
                }}>
                  <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
                    TVA 20% (construction neuve)
                  </div>
                  <div style={{ fontSize: '0.875rem', fontWeight: '600' }}>
                    {formatCurrency(tvaTotals.tva20)}
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <div style={{ 
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem'
              }}>
                <div style={{ 
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '0.75rem',
                  background: 'white',
                  borderRadius: '0.5rem',
                  border: '1px solid #e2e8f0'
                }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: '600' }}>
                    Total HT
                  </div>
                  <div style={{ fontSize: '0.875rem', fontWeight: '600' }}>
                    {formatCurrency(Number(devis.totalHT))}
                  </div>
                </div>
                
                <div style={{ 
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '0.75rem',
                  background: 'white',
                  borderRadius: '0.5rem',
                  border: '1px solid #e2e8f0'
                }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: '600' }}>
                    Total TVA
                  </div>
                  <div style={{ fontSize: '0.875rem', fontWeight: '600' }}>
                    {formatCurrency(tvaTotals.totalTVA)}
                  </div>
                </div>
                
                <div style={{ 
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '0.75rem',
                  background: '#e0f2fe',
                  borderRadius: '0.5rem',
                  border: '1px solid #0ea5e9'
                }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#0369a1' }}>
                    Total TTC
                  </div>
                  <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#0369a1' }}>
                    {formatCurrency(Number(devis.totalHT) + tvaTotals.totalTVA)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1rem',
        background: '#f8fafc',
        borderRadius: '0.5rem',
        border: '1px solid #e2e8f0'
      }}>
        <button
          onClick={() => router.push(`/dashboard/devis/${params.id}`)}
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
          onClick={handleSave}
          disabled={saving}
          className="btn-primary"
          style={{
            opacity: saving ? 0.5 : 1,
            cursor: saving ? 'not-allowed' : 'pointer'
          }}
        >
          {saving ? 'Sauvegarde...' : 'Sauvegarder les taux TVA'}
        </button>
      </div>
    </div>
  );
}
