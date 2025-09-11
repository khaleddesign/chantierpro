import { render, screen } from '@testing-library/react';
import StatusBadge from './StatusBadge';

describe('StatusBadge', () => {
  it('affiche le statut PLANIFIE correctement', () => {
    render(<StatusBadge statut="PLANIFIE" />);
    expect(screen.getByText('Planifié')).toBeInTheDocument();
  });

  it('affiche le statut EN_COURS correctement', () => {
    render(<StatusBadge statut="EN_COURS" />);
    expect(screen.getByText('En cours')).toBeInTheDocument();
  });

  it('affiche le statut EN_ATTENTE correctement', () => {
    render(<StatusBadge statut="EN_ATTENTE" />);
    expect(screen.getByText('En attente')).toBeInTheDocument();
  });

  it('affiche le statut TERMINE correctement', () => {
    render(<StatusBadge statut="TERMINE" />);
    expect(screen.getByText('Terminé')).toBeInTheDocument();
  });

  it('affiche le statut ANNULE correctement', () => {
    render(<StatusBadge statut="ANNULE" />);
    expect(screen.getByText('Annulé')).toBeInTheDocument();
  });

  it('utilise la taille sm correctement', () => {
    const { container } = render(<StatusBadge statut="PLANIFIE" size="sm" />);
    const badge = container.firstChild as HTMLElement;
    expect(badge).toHaveStyle({ padding: '0.25rem 0.5rem' });
  });

  it('utilise la taille md par défaut', () => {
    const { container } = render(<StatusBadge statut="PLANIFIE" />);
    const badge = container.firstChild as HTMLElement;
    expect(badge).toHaveStyle({ padding: '0.5rem 0.75rem' });
  });

  it('utilise la taille lg correctement', () => {
    const { container } = render(<StatusBadge statut="PLANIFIE" size="lg" />);
    const badge = container.firstChild as HTMLElement;
    expect(badge).toHaveStyle({ padding: '0.75rem 1rem' });
  });

  it('gère un statut invalide en utilisant PLANIFIE par défaut', () => {
    render(<StatusBadge statut="STATUT_INVALIDE" />);
    expect(screen.getByText('Planifié')).toBeInTheDocument();
  });

  it('contient une icône pour chaque statut', () => {
    const statuts = ['PLANIFIE', 'EN_COURS', 'EN_ATTENTE', 'TERMINE', 'ANNULE'];
    
    statuts.forEach(statut => {
      const { container } = render(<StatusBadge statut={statut} />);
      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });
  });
});

