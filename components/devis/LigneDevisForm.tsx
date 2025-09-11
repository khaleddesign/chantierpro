'use client';

import { useState } from 'react';

interface LigneDevisFormProps {
  formData: any;
  setFormData: (data: any) => void;
}

export default function LigneDevisForm({ formData, setFormData }: LigneDevisFormProps) {
  const [showBiblioPrix, setShowBiblioPrix] = useState(false);
  const [prixBiblio, setPrixBiblio] = useState<any[]>([]);

  const fetchPrixBiblio = async (search: string) => {
    try {
      const response = await fetch(`/api/bibliotheque-prix?search=${encodeURIComponent(search)}`);
      const data = await response.json();
      setPrixBiblio(data.data || []);
    } catch (error) {
      console.error('Erreur recherche prix:', error);
      setPrixBiblio([]);
    }
  };

  const handleDescriptionChange = (description: string) => {
    setFormData({
      ...formData,
      description
    });

    // Recherche automatique dans biblio prix
    if (description && description.length > 2) {
      setShowBiblioPrix(true);
      fetchPrixBiblio(description);
    } else {
      setShowBiblioPrix(false);
    }
  };

  return (
    <div className="ligne-devis-form">
      <div className="form-group">
        <label>Description</label>
        <input
          type="text"
          value={formData.description || ''}
          onChange={(e) => handleDescriptionChange(e.target.value)}
          className="form-input"
          placeholder="Description de la prestation"
        />
      </div>

      {showBiblioPrix && (
        <div className="biblio-prix-suggestions">
          <h4>Suggestions bibliothèque prix:</h4>
          {prixBiblio.length === 0 ? (
            <p className="no-results">
              Aucun prix trouvé pour "{formData.description}"
            </p>
          ) : (
            <div className="prix-list">
              {prixBiblio.map((prix: any, index: number) => (
                <div
                  key={index}
                  className="prix-item"
                  onClick={() => {
                    setFormData({
                      ...formData,
                      description: prix.designation,
                      prixUnit: prix.prixHT,
                      unite: prix.unite
                    });
                    setShowBiblioPrix(false);
                  }}
                >
                  <div className="prix-designation">{prix.designation}</div>
                  <div className="prix-details">
                    {prix.prixHT}€ HT / {prix.unite} - {prix.corpsEtat}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="form-row">
        <div className="form-group">
          <label>Quantité</label>
          <input
            type="number"
            value={formData.quantite || ''}
            onChange={(e) => setFormData({
              ...formData,
              quantite: parseFloat(e.target.value) || 0
            })}
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label>Prix unitaire HT</label>
          <input
            type="number"
            step="0.01"
            value={formData.prixUnit || ''}
            onChange={(e) => setFormData({
              ...formData,
              prixUnit: parseFloat(e.target.value) || 0
            })}
            className="form-input"
          />
        </div>
      </div>

      <div className="form-group">
        <label>Total HT</label>
        <input
          type="number"
          value={(formData.quantite || 0) * (formData.prixUnit || 0)}
          readOnly
          className="form-input readonly"
        />
      </div>
    </div>
  );
}
