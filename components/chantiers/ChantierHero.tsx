"use client";

import StatusBadge from "./StatusBadge";
import ProgressBar from "./ProgressBar";

interface ChantierHeroProps {
  chantier: {
    id: string;
    nom: string;
    description: string;
    adresse: string;
    statut: string;
    progression: number;
    dateDebut: string;
    dateFin: string;
    budget: number;
    superficie: string;
    photo?: string;
    client: {
      name: string;
      company?: string;
      email: string;
      phone?: string;
    };
  };
  onEdit?: () => void;
  onShare?: () => void;
  onArchive?: () => void;
  onDelete?: () => void;
}

function ChantierHero({ chantier, onEdit, onShare, onArchive, onDelete }: ChantierHeroProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatBudget = (budget: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0
    }).format(budget);
  };

  const getDaysRemaining = () => {
    const today = new Date();
    const endDate = new Date(chantier.dateFin);
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return `Terminé depuis ${Math.abs(diffDays)} jours`;
    if (diffDays === 0) return 'Se termine aujourd\'hui';
    if (diffDays === 1) return 'Se termine demain';
    return `${diffDays} jours restants`;
  };

  return (
    <div
      style={{
        position: 'relative',
        height: '400px',
        borderRadius: '1rem',
        overflow: 'hidden',
        marginBottom: '2rem',
        backgroundImage: chantier.photo 
          ? `url(${chantier.photo})`
          : 'url(https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=1200&h=400&fit=crop)',
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.7))',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '2rem'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <StatusBadge statut={chantier.statut} size="lg" />
          
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            {onEdit && (
              <button
                onClick={onEdit}
                className="btn-ghost"
                style={{ padding: '0.5rem' }}
                title="Modifier"
              >
                ✏️
              </button>
            )}
            {onShare && (
              <button
                onClick={onShare}
                className="btn-ghost"
                style={{ padding: '0.5rem' }}
                title="Partager"
              >
                📤
              </button>
            )}
            {onArchive && (
              <button
                onClick={onArchive}
                className="btn-ghost"
                style={{ padding: '0.5rem' }}
                title="Archiver"
              >
                📦
              </button>
            )}
            {onDelete && (
              <button
                onClick={onDelete}
                className="btn-ghost"
                style={{ padding: '0.5rem' }}
                title="Supprimer"
              >
                🗑️
              </button>
            )}
          </div>
        </div>

        <div>
          <h1
            style={{
              fontSize: '2.5rem',
              fontWeight: 'bold',
              color: 'white',
              marginBottom: '1rem',
              textShadow: '0 2px 4px rgba(0,0,0,0.5)',
              lineHeight: 1.2
            }}
          >
            {chantier.nom}
          </h1>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', alignItems: 'end' }}>
            <div>
              <p
                style={{
                  color: 'rgba(255,255,255,0.9)',
                  fontSize: '1.125rem',
                  marginBottom: '1rem',
                  lineHeight: 1.5,
                  textShadow: '0 1px 2px rgba(0,0,0,0.3)'
                }}
              >
                📍 {chantier.adresse}
              </p>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', marginBottom: '1.5rem' }}>
                <div>
                  <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem', margin: 0 }}>
                    Client
                  </p>
                  <p style={{ color: 'white', fontSize: '1rem', fontWeight: '600', margin: 0 }}>
                    {chantier.client.name}
                  </p>
                  {chantier.client.company && (
                    <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.875rem', margin: 0 }}>
                      {chantier.client.company}
                    </p>
                  )}
                </div>

                <div>
                  <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem', margin: 0 }}>
                    Période
                  </p>
                  <p style={{ color: 'white', fontSize: '1rem', fontWeight: '600', margin: 0 }}>
                    {formatDate(chantier.dateDebut)}
                  </p>
                  <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.875rem', margin: 0 }}>
                    au {formatDate(chantier.dateFin)}
                  </p>
                </div>

                <div>
                  <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem', margin: 0 }}>
                    Budget
                  </p>
                  <p style={{ color: '#10b981', fontSize: '1.25rem', fontWeight: 'bold', margin: 0 }}>
                    {formatBudget(chantier.budget)}
                  </p>
                </div>

                {chantier.superficie && (
                  <div>
                    <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem', margin: 0 }}>
                      Superficie
                    </p>
                    <p style={{ color: 'white', fontSize: '1rem', fontWeight: '600', margin: 0 }}>
                      {chantier.superficie}
                    </p>
                  </div>
                )}
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                  {getDaysRemaining()}
                </p>
              </div>
            </div>

            <div style={{ minWidth: '200px' }}>
              <ProgressBar 
                progression={chantier.progression} 
                showPercentage={true}
                height="12px"
                animated={true}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChantierHero;
