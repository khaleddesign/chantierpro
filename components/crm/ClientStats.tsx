'use client';

import { useState, useEffect } from 'react';

interface EvolutionMensuelle {
  mois: string;
  montant: number;
}

interface ClientStatsData {
  devisEnvoyes: number;
  tauxConversion: number;
  montantMoyen: number;
  chiffreAffaireTotal: number;
  dernierContact: string;
  projetsEnCours: number;
  evolutionMensuelle: EvolutionMensuelle[];
}

interface ClientStatsProps {
  clientId: string;
}

export default function ClientStats({ clientId }: ClientStatsProps) {
  const [stats, setStats] = useState<ClientStatsData>({
    devisEnvoyes: 0,
    tauxConversion: 0,
    montantMoyen: 0,
    chiffreAffaireTotal: 0,
    dernierContact: '',
    projetsEnCours: 0,
    evolutionMensuelle: []
  });
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [clientId]);

  const fetchStats = async () => {
    try {
      // Simulation des statistiques
      const mockStats: ClientStatsData = {
        devisEnvoyes: 12,
        tauxConversion: 75,
        montantMoyen: 15000,
        chiffreAffaireTotal: 180000,
        dernierContact: '2024-01-15',
        projetsEnCours: 3,
        evolutionMensuelle: [
          { mois: 'Jan', montant: 25000 },
          { mois: 'Fév', montant: 32000 },
          { mois: 'Mar', montant: 28000 },
          { mois: 'Avr', montant: 35000 },
          { mois: 'Mai', montant: 40000 },
          { mois: 'Jun', montant: 20000 }
        ]
      };

      setStats(mockStats);
    } catch (error) {
      console.error('Erreur chargement stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  if (loading) {
    return <div className="loading">Chargement des statistiques...</div>;
  }

  return (
    <div className="client-stats">
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Devis envoyés</div>
          <div className="stat-value">{stats.devisEnvoyes}</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Taux de conversion</div>
          <div className="stat-value">{stats.tauxConversion}%</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Montant moyen</div>
          <div className="stat-value">{formatCurrency(stats.montantMoyen)}</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">CA Total</div>
          <div className="stat-value">{formatCurrency(stats.chiffreAffaireTotal)}</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Projets en cours</div>
          <div className="stat-value">{stats.projetsEnCours}</div>
        </div>
      </div>

      <div className="evolution-chart">
        <h3>Évolution mensuelle</h3>
        <div className="chart-container">
          {stats.evolutionMensuelle.map((mois: EvolutionMensuelle, index: number) => {
            const maxMontant = Math.max(...stats.evolutionMensuelle.map(m => m.montant));
            const hauteur = (mois.montant / maxMontant) * 100;

            return (
              <div key={index} className="chart-bar">
                <div 
                  className="bar"
                  style={{ height: `${hauteur}%` }}
                  title={`${mois.mois}: ${formatCurrency(mois.montant)}`}
                >
                  <span className="bar-value">
                    {formatCurrency(mois.montant)}
                  </span>
                </div>
                <div className="bar-label">
                  {mois.mois}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
