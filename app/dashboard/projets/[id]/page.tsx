'use client';

import { use, useState, useEffect } from 'react';

export default function ProjetDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [projet, setProjet] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulation projet
    setProjet({
      id,
      nom: 'Rénovation Appartement Duplex',
      description: 'Rénovation complète d\'un appartement de 120m² avec redistribution des espaces',
      statut: 'EN_COURS',
      dateDebut: new Date(),
      dateFin: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      avancement: 35,
      budget: 85000,
      client: {
        name: 'Sophie Durand',
        email: 'sophie.durand@email.com'
      }
    });
    setLoading(false);
  }, [id]);

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '2rem' }}>Chargement...</div>;
  }

  if (!projet) {
    return <div style={{ textAlign: 'center', padding: '2rem' }}>Projet non trouvé</div>;
  }

  return (
    <div>
      <div style={{
        background: 'white',
        border: '1px solid #e2e8f0',
        borderRadius: '0.75rem',
        padding: '2rem',
        marginBottom: '2rem'
      }}>
        <h1 style={{ margin: '0 0 1rem 0', color: '#1e293b' }}>
          {projet.nom}
        </h1>
        
        <p style={{ color: '#64748b', marginBottom: '2rem' }}>
          {projet.description}
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1.5rem'
        }}>
          <div style={{
            background: '#f0f9ff',
            padding: '1.5rem',
            borderRadius: '0.5rem',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2rem', color: '#3b82f6' }}>{projet.avancement}%</div>
            <div style={{ color: '#3b82f6', fontSize: '0.875rem' }}>Avancement</div>
          </div>
          
          <div style={{
            background: '#ecfdf5',
            padding: '1.5rem',
            borderRadius: '0.5rem',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#10b981' }}>
              {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(projet.budget)}
            </div>
            <div style={{ color: '#10b981', fontSize: '0.875rem' }}>Budget</div>
          </div>
          
          <div style={{
            background: '#fef3c7',
            padding: '1.5rem',
            borderRadius: '0.5rem',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '1rem', fontWeight: 'bold', color: '#d97706' }}>
              {Math.ceil((new Date(projet.dateFin).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} jours
            </div>
            <div style={{ color: '#d97706', fontSize: '0.875rem' }}>Restants</div>
          </div>
        </div>
      </div>

      <div style={{
        background: 'white',
        border: '1px solid #e2e8f0',
        borderRadius: '0.75rem',
        padding: '2rem'
      }}>
        <h3 style={{ margin: '0 0 1rem 0', color: '#1e293b' }}>
          👤 Informations Client
        </h3>
        
        <div style={{ color: '#64748b' }}>
          <p><strong>Nom:</strong> {projet.client.name}</p>
          <p><strong>Email:</strong> {projet.client.email}</p>
        </div>
      </div>
    </div>
  );
}
