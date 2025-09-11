"use client";

import Link from "next/link";
import StatusBadge from "./StatusBadge";
import ProgressBar from "./ProgressBar";

interface ChantierCardProps {
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
    photo?: string;
    client: {
      name: string;
      company?: string | undefined;
    };
    _count?: {
      messages: number;
      comments: number;
    };
  };
}

export default function ChantierCard({ chantier }: ChantierCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
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

  return (
    <Link href={`/dashboard/chantiers/${chantier.id}`} style={{ textDecoration: 'none' }}>
      <div
        className="card"
        style={{
          position: 'relative',
          overflow: 'hidden',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          height: '100%',
          display: 'flex',
          flexDirection: 'column'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.05)';
        }}
      >
        <div
          style={{
            height: '200px',
            backgroundImage: chantier.photo 
              ? `url(${chantier.photo})`
              : 'url(https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=400&h=200&fit=crop)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            borderRadius: '0.75rem 0.75rem 0 0',
            position: 'relative'
          }}
        >
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.4))',
            borderRadius: '0.75rem 0.75rem 0 0'
          }} />
          
          <div style={{ position: 'absolute', top: '1rem', right: '1rem' }}>
            <StatusBadge statut={chantier.statut} />
          </div>

          <div style={{ position: 'absolute', bottom: '1rem', left: '1rem', right: '1rem' }}>
            <ProgressBar progression={chantier.progression} />
          </div>
        </div>

        <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ marginBottom: '1rem' }}>
            <h3 style={{
              fontSize: '1.25rem',
              fontWeight: '600',
              color: '#1e293b',
              marginBottom: '0.5rem',
              lineHeight: 1.3
            }}>
              {chantier.nom}
            </h3>
            <p style={{ color: '#64748b', fontSize: '0.875rem', margin: 0 }}>
              📍 {chantier.adresse}
            </p>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{
                width: '2rem',
                height: '2rem',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #3b82f6, #f97316)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '0.75rem',
                fontWeight: 'bold'
              }}>
                {chantier.client.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <p style={{ margin: 0, fontWeight: '500', color: '#1e293b', fontSize: '0.875rem' }}>
                  {chantier.client.name}
                </p>
                {chantier.client.company && (
                  <p style={{ margin: 0, color: '#64748b', fontSize: '0.75rem' }}>
                    {chantier.client.company}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '1rem', flex: 1 }}>
            <p style={{
              color: '#64748b',
              fontSize: '0.875rem',
              lineHeight: 1.5,
              margin: 0,
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical'
            }}>
              {chantier.description}
            </p>
          </div>

          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ color: '#64748b', fontSize: '0.75rem' }}>
                📅 {formatDate(chantier.dateDebut)} - {formatDate(chantier.dateFin)}
              </span>
              <span style={{ color: '#059669', fontSize: '0.875rem', fontWeight: '600' }}>
                {formatBudget(chantier.budget)}
              </span>
            </div>

            {chantier._count && (
              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <span style={{ color: '#64748b', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  💬 {chantier._count.messages} messages
                </span>
                <span style={{ color: '#64748b', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  💭 {chantier._count.comments} commentaires
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
