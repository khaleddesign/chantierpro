interface LigneCalcul {
  quantite: number;
  prixUnit: number;
  tva?: number;
}

interface TotauxCalculatorProps {
  lignes: LigneCalcul[];
}

export default function TotauxCalculator({ lignes }: TotauxCalculatorProps) {
  const totalHT = lignes.reduce((sum, ligne) => sum + (ligne.quantite * ligne.prixUnit), 0);
  const totalTVA = lignes.reduce((sum, ligne) => {
    const taux = ligne.tva || 20;
    const montantHT = ligne.quantite * ligne.prixUnit;
    return sum + (montantHT * taux / 100);
  }, 0);
  const totalTTC = totalHT + totalTVA;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  return (
    <div style={{
      background: '#f0f9ff',
      border: '1px solid #0ea5e9',
      borderRadius: '0.5rem',
      padding: '1.5rem'
    }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr auto',
        gap: '2rem',
        alignItems: 'center'
      }}>
        <div>
          <h4 style={{ margin: '0 0 0.5rem 0', color: '#0369a1' }}>
            Récapitulatif
          </h4>
          <p style={{ margin: 0, fontSize: '0.875rem', color: '#0369a1' }}>
            {lignes.length} ligne{lignes.length > 1 ? 's' : ''}
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ 
            marginBottom: '0.5rem',
            fontSize: '1rem',
            color: '#0369a1'
          }}>
            Total HT: {formatCurrency(totalHT)}
          </div>
          <div style={{ 
            marginBottom: '0.5rem',
            fontSize: '1rem',
            color: '#0369a1'
          }}>
            TVA: {formatCurrency(totalTVA)}
          </div>
          <div style={{ 
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: '#0369a1'
          }}>
            Total TTC: {formatCurrency(totalTTC)}
          </div>
        </div>
      </div>
    </div>
  );
}
