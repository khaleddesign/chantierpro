export interface EtapeChantier {
  id: string;
  titre: string;
  description?: string;
  dateDebut: string;
  dateFin: string;
  statut: 'A_FAIRE' | 'EN_COURS' | 'TERMINE';
  ordre: number;
  chantierId: string;
  createdById: string;
  createdBy: {
    id: string;
    name: string;
    role: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface EtapeFormData {
  titre: string;
  description?: string;
  dateDebut: string;
  dateFin: string;
  statut: 'A_FAIRE' | 'EN_COURS' | 'TERMINE';
  ordre?: number;
}

export const ETAPE_STATUS_LABELS = {
  A_FAIRE: 'À faire',
  EN_COURS: 'En cours',
  TERMINE: 'Terminé'
} as const;

export const ETAPE_STATUS_COLORS = {
  A_FAIRE: 'bg-gray-100 text-gray-800',
  EN_COURS: 'bg-blue-100 text-blue-800',
  TERMINE: 'bg-green-100 text-green-800'
} as const;
