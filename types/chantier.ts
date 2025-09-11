import { ChantierStatus } from '@prisma/client';

export interface Chantier {
  id: string;
  nom: string;
  description: string;
  adresse: string;
  statut: ChantierStatus;
  progression: number;
  dateDebut: string;
  dateFin: string;
  budget: number;
  superficie: string;
  photo?: string;
  photos?: string[];
  client: {
    id: string;
    name: string;
    email?: string;
    company?: string;
    phone?: string;
  };
  _count?: {
    messages: number;
    comments: number;
  };
}

export interface ChantierCardProps {
  chantier: Chantier;
  className?: string;
}

export interface ChantierHeroProps {
  chantier: Chantier & {
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
}

export const STATUS_LABELS: Record<ChantierStatus, string> = {
  PLANIFIE: 'Planifié',
  EN_COURS: 'En cours',
  EN_ATTENTE: 'En attente',
  TERMINE: 'Terminé',
  ANNULE: 'Annulé'
};

export const STATUS_COLORS: Record<ChantierStatus, { bg: string; text: string; icon: string }> = {
  PLANIFIE: { bg: 'bg-slate-100', text: 'text-slate-800', icon: '📋' },
  EN_COURS: { bg: 'bg-blue-100', text: 'text-blue-800', icon: '🚧' },
  EN_ATTENTE: { bg: 'bg-amber-100', text: 'text-amber-800', icon: '⏳' },
  TERMINE: { bg: 'bg-green-100', text: 'text-green-800', icon: '✅' },
  ANNULE: { bg: 'bg-red-100', text: 'text-red-800', icon: '❌' }
};
