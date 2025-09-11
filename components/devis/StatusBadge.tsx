'use client';

interface StatusBadgeProps {
  statut: 'BROUILLON' | 'ENVOYE' | 'ACCEPTE' | 'REFUSE' | 'PAYE' | 'ANNULE';
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export default function StatusBadge({ statut, size = 'md', showIcon = true }: StatusBadgeProps) {
  const getStatusConfig = (statut: string) => {
    const configs = {
      BROUILLON: {
        color: '#64748b',
        backgroundColor: '#f1f5f9',
        text: 'Brouillon',
        icon: '📝'
      },
      ENVOYE: {
        color: '#3b82f6',
        backgroundColor: '#dbeafe',
        text: 'Envoyé',
        icon: '📤'
      },
      ACCEPTE: {
        color: '#10b981',
        backgroundColor: '#d1fae5',
        text: 'Accepté',
        icon: '✅'
      },
      REFUSE: {
        color: '#ef4444',
        backgroundColor: '#fee2e2',
        text: 'Refusé',
        icon: '❌'
      },
      PAYE: {
        color: '#059669',
        backgroundColor: '#ecfdf5',
        text: 'Payé',
        icon: '💰'
      },
      ANNULE: {
        color: '#6b7280',
        backgroundColor: '#f3f4f6',
        text: 'Annulé',
        icon: '🚫'
      }
    };
    return configs[statut as keyof typeof configs] || configs.BROUILLON;
  };

  const getSizeConfig = (size: string) => {
    const sizes = {
      sm: {
        padding: '0.125rem 0.5rem',
        fontSize: '0.75rem',
        borderRadius: '0.375rem'
      },
      md: {
        padding: '0.25rem 0.75rem',
        fontSize: '0.875rem',
        borderRadius: '0.5rem'
      },
      lg: {
        padding: '0.5rem 1rem',
        fontSize: '1rem',
        borderRadius: '0.75rem'
      }
    };
    return sizes[size as keyof typeof sizes] || sizes.md;
  };

  const statusConfig = getStatusConfig(statut);
  const sizeConfig = getSizeConfig(size);

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: showIcon ? '0.25rem' : '0',
      color: statusConfig.color,
      backgroundColor: statusConfig.backgroundColor,
      fontWeight: '500',
      whiteSpace: 'nowrap',
      border: `1px solid ${statusConfig.color}20`,
      ...sizeConfig
    }}>
      {showIcon && <span>{statusConfig.icon}</span>}
      {statusConfig.text}
    </span>
  );
}
