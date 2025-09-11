'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import TotauxCalculator from '@/components/devis/TotauxCalculator';
import LigneDevisComponent from '@/components/devis/LigneDevis';

interface LigneDevisEdit {
  designation: string;
  quantite: string;
  prixUnitaire: string;
  total: number;
}

interface LigneCalcul {
  quantite: number;
  prixUnit: number;
  tva?: number;
}

interface DevisEdit {
  id: string;
  numero: string;
  type: 'DEVIS' | 'FACTURE';
  statut: string;
  objet: string;
  clientId: string;
  chantierId?: string;
  dateValidite?: string;
  notes?: string;
  conditionsVente?: string;
  client: {
    id: string;
    name: string;
    company?: string;
  };
  chantier?: {
    id: string;
    nom: string;
  };
  lignes: Array<{
    designation: string;
    quantite: number;
    prixUnitaire: number;
    tva: number;
  }>;
}

export default function EditDevisPage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [devis, setDevis] = useState<DevisEdit | null>(null);
  const [chantiers, setChantiers] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    objet: '',
    chantierId: '',
    dateValidite: '',
    notes: '',
    conditionsVente: '',
    lignes: [] as LigneDevisEdit[]
  });

  useEffect(() => {
    if (params.id) {
      fetchDevis();
    }
  }, [params.id]);

  useEffect(() => {
    if (devis?.clientId) {
      fetchChantiers(devis.clientId);
    }
  }, [devis?.clientId]);

  const fetchDevis = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/devis/${params.id}`);
      const data = await response.json();
      
      if (response.ok) {
        setDevis(data);
        setFormData({
          objet: data.objet,
          chantierId: data.chantierId || '',
          dateValidite: data.dateValidite ? data.dateValidite.split('T')[0] : '',
          notes: data.notes || '',
          conditionsVente: data.conditionsVente || '',
          lignes: data.lignes.map((ligne: any) => ({
            designation: ligne.designation,
            quantite: ligne.quantite.toString(),
            prixUnitaire: ligne.prixUnitaire.toString(),
            
            total: Number(ligne.total)
          }))
        });
      } else {
        alert(data.error || 'Erreur lors du chargement');
        router.push('/dashboard/devis');
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const fetchChantiers = async (clientId: string) => {
    try {
      const response = await fetch(`/api/chantiers?clientId=${clientId}`);
      const data = await response.json();
      if (response.ok) {
        setChantiers(data.chantiers || []);
      }
    } catch (error) {
      console.error('Erreur chargement chantiers:', error);
      setChantiers([]);
    }
  };

  const updateLigne = (index: number, field: string, value: string) => {
    const newLignes = [...formData.lignes];
    newLignes[index] = { ...newLignes[index], [field]: value };
    
    if (field === 'quantite' || field === 'prixUnitaire') {
      const quantite = parseFloat(newLignes[index].quantite) || 0;
      const prix = parseFloat(newLignes[index].prixUnitaire) || 0;
      newLignes[index].total = quantite * prix;
    }

    setFormData({ ...formData, lignes: newLignes });
  };

  const addLigne = () => {
    setFormData({
      ...formData,
      lignes: [
        ...formData.lignes,
        { designation: '', quantite: '1', prixUnitaire: '0', total: 0 }
      ]
    });
  };

  const removeLigne = (index: number) => {
    if (formData.lignes.length > 1) {
      const newLignes = formData.lignes.filter((_, i) => i !== index);
      setFormData({ ...formData, lignes: newLignes });
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      const response = await fetch(`/api/devis/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
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

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ 
          fontSize: '2rem', 
          fontWeight: 'bold', 
          color: '#1e293b',
          margin: '0 0 0.5rem 0',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <span>{devis.type === 'DEVIS' ? '📄' : '🧾'}</span>
          Modifier {devis.numero}
        </h1>
        <p style={{ color: '#64748b', margin: 0 }}>
          Client: {devis.client.name} {devis.client.company && `(${devis.client.company})`}
        </p>
      </div>

      <div className="card" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '1.5rem', color: '#1e293b' }}>
          Informations générales
        </h3>
        
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '1.5rem',
          marginBottom: '1.5rem'
        }}>
          <div>
            <label style={{ 
              display: 'block',
              marginBottom: '0.5rem',
              fontWeight: '500',
              color: '#374151'
            }}>
              Objet *
            </label>
            <input
              type="text"
              value={formData.objet}
              onChange={(e) => setFormData({ ...formData, objet: e.target.value })}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.5rem',
                background: 'white'
              }}
            />
          </div>

          <div>
            <label style={{ 
              display: 'block',
              marginBottom: '0.5rem',
              fontWeight: '500',
              color: '#374151'
            }}>
              Chantier
            </label>
            <select
              value={formData.chantierId}
              onChange={(e) => setFormData({ ...formData, chantierId: e.target.value })}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.5rem',
                background: 'white'
              }}
            >
              <option value="">Pas de chantier associé</option>
              {chantiers.map((chantier) => (
                <option key={chantier.id} value={chantier.id}>
                  {chantier.nom}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
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
            onChange={(e) => setFormData({ ...formData, dateValidite: e.target.value })}
            style={{
              padding: '0.75rem',
              border: '1px solid #d1d5db',
              borderRadius: '0.5rem',
              background: 'white'
            }}
          />
        </div>
      </div>

      <div className="card" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <div style={{ 
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem'
        }}>
          <h3 style={{ margin: 0, color: '#1e293b' }}>
            Lignes du {devis.type.toLowerCase()}
          </h3>
          <button
            onClick={addLigne}
            style={{
              padding: '0.5rem 1rem',
              border: 'none',
              borderRadius: '0.5rem',
              background: '#10b981',
              color: 'white',
              cursor: 'pointer',
              fontSize: '0.875rem'
            }}
          >
            ➕ Ajouter une ligne
          </button>
        </div>

        <div style={{ 
          background: '#f8fafc',
          padding: '1rem',
          borderRadius: '0.5rem',
          marginBottom: '1rem'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'auto 2fr 80px 100px 80px 100px 40px',
            gap: '0.5rem',
            fontWeight: '600',
            fontSize: '0.875rem',
            color: '#374151'
          }}>
            <div>#</div>
            <div>Désignation</div>
            <div>Qté</div>
            <div>Prix Unit.</div>
            <div>TVA %</div>
            <div>Total HT</div>
            <div></div>
          </div>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          {formData.lignes.map((ligne, index) => (
            <LigneDevisComponent
              key={index}
              ligne={ligne}
              index={index}
              canDelete={formData.lignes.length > 1}
              onUpdate={updateLigne}
              onDelete={removeLigne}
            />
          ))}
        </div>

        <TotauxCalculator 
          lignes={formData.lignes.map((ligne): LigneCalcul => ({
            quantite: parseFloat(ligne.quantite) || 0,
            prixUnit: parseFloat(ligne.prixUnitaire) || 0,
          }))}
        />
      </div>

      <div className="card" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '1.5rem', color: '#1e293b' }}>
          Informations complémentaires
        </h3>
        
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ 
            display: 'block',
            marginBottom: '0.5rem',
            fontWeight: '500',
            color: '#374151'
          }}>
            Notes
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Notes internes ou informations complémentaires..."
            rows={3}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #d1d5db',
              borderRadius: '0.5rem',
              background: 'white',
              resize: 'vertical'
            }}
          />
        </div>

        <div>
          <label style={{ 
            display: 'block',
            marginBottom: '0.5rem',
            fontWeight: '500',
            color: '#374151'
          }}>
            Conditions de vente
          </label>
          <textarea
            value={formData.conditionsVente}
            onChange={(e) => setFormData({ ...formData, conditionsVente: e.target.value })}
            placeholder="Conditions de vente, modalités de paiement..."
            rows={3}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #d1d5db',
              borderRadius: '0.5rem',
              background: 'white',
              resize: 'vertical'
            }}
          />
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
          disabled={saving || !formData.objet || formData.lignes.some(l => !l.designation)}
          className="btn-primary"
          style={{
            opacity: (saving || !formData.objet || formData.lignes.some(l => !l.designation)) ? 0.5 : 1,
            cursor: (saving || !formData.objet || formData.lignes.some(l => !l.designation)) ? 'not-allowed' : 'pointer'
          }}
        >
          {saving ? 'Sauvegarde...' : 'Sauvegarder'}
        </button>
      </div>
    </div>
  );
}
