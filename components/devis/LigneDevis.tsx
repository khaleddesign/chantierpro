interface LigneDevisProps {
  ligne: {
    designation: string;
    quantite: string;
    prixUnitaire: string;
    total: number;
  };
  index: number;
  canDelete: boolean;
  onUpdate: (index: number, field: string, value: string) => void;
  onDelete: (index: number) => void;
}

export default function LigneDevis({ 
  ligne, 
  index, 
  canDelete, 
  onUpdate, 
  onDelete 
}: LigneDevisProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'auto 2fr 80px 100px 80px 100px 40px',
      gap: '0.5rem',
      alignItems: 'center',
      padding: '0.75rem 0',
      borderBottom: '1px solid #e5e7eb'
    }}>
      <div style={{ 
        fontWeight: '500',
        color: '#64748b',
        fontSize: '0.875rem'
      }}>
        {index + 1}
      </div>
      
      <input
        type="text"
        value={ligne.designation}
        onChange={(e) => onUpdate(index, 'designation', e.target.value)}
        placeholder="Description du service/produit"
        style={{
          padding: '0.5rem',
          border: '1px solid #d1d5db',
          borderRadius: '0.25rem',
          fontSize: '0.875rem'
        }}
      />
      
      <input
        type="number"
        value={ligne.quantite}
        onChange={(e) => onUpdate(index, 'quantite', e.target.value)}
        min="0"
        step="0.01"
        style={{
          padding: '0.5rem',
          border: '1px solid #d1d5db',
          borderRadius: '0.25rem',
          fontSize: '0.875rem',
          textAlign: 'center'
        }}
      />
      
      <input
        type="number"
        value={ligne.prixUnitaire}
        onChange={(e) => onUpdate(index, 'prixUnitaire', e.target.value)}
        min="0"
        step="0.01"
        style={{
          padding: '0.5rem',
          border: '1px solid #d1d5db',
          borderRadius: '0.25rem',
          fontSize: '0.875rem',
          textAlign: 'right'
        }}
      />
      
      <div style={{ 
        textAlign: 'center',
        fontSize: '0.875rem',
        color: '#64748b'
      }}>
        20%
      </div>
      
      <div style={{
        padding: '0.5rem',
        textAlign: 'right',
        fontWeight: '500',
        fontSize: '0.875rem'
      }}>
        {formatCurrency(ligne.total)}
      </div>
      
      <button
        onClick={() => onDelete(index)}
        disabled={!canDelete}
        style={{
          padding: '0.25rem',
          border: 'none',
          background: !canDelete ? '#f3f4f6' : '#fee2e2',
          color: !canDelete ? '#9ca3af' : '#dc2626',
          borderRadius: '0.25rem',
          cursor: !canDelete ? 'not-allowed' : 'pointer',
          fontSize: '0.75rem'
        }}
      >
        🗑️
      </button>
    </div>
  );
}
