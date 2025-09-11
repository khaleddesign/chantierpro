// Types stricts pour le module CRM

export type TypeClient = 'PARTICULIER' | 'PROFESSIONNEL' | 'SYNDIC' | 'PROMOTEUR';
export type UserRole = 'ADMIN' | 'COMMERCIAL' | 'CLIENT' | 'OUVRIER';
export type InteractionType = 'APPEL' | 'EMAIL' | 'VISITE' | 'REUNION' | 'AUTRE';
export type OpportuniteEtape = 'PROSPECT' | 'QUALIFIE' | 'PROPOSITION' | 'NEGOCIATION' | 'GAGNE' | 'PERDU';

// Interface stricte pour un client CRM
export interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  typeClient: TypeClient;
  secteurActivite?: string;
  effectif?: string;
  chiffreAffaires?: number;
  address?: string;
  ville?: string;
  codePostal?: string;
  commercialId?: string;
  createdAt: string;
  updatedAt: string;
  
  // Données enrichies côté client
  dernierContact?: string;
  nbOpportunites?: number;
  valeurPipeline?: number;
}

// Interface pour les données d'un client étendu avec relations
export interface ClientDetailed extends Client {
  interactions: InteractionClient[];
  opportunites: Opportunite[];
  commercial?: User;
  chantiers?: Chantier[];
}

// Interface pour les interactions avec un client
export interface InteractionClient {
  id: string;
  clientId: string;
  createdBy: string;
  type: InteractionType;
  objet: string;
  description: string;
  dateContact: string;
  prochaineSuite?: string;
  createdAt: string;
  updatedAt: string;
  
  // Relations
  client?: Client;
}

// Interface pour les opportunités commerciales
export interface Opportunite {
  id: string;
  clientId: string;
  nom: string;
  description: string;
  valeurEstimee: number;
  probabilite: number;
  statut: OpportuniteEtape;
  dateCloture?: string;
  createdAt: string;
  updatedAt: string;
  
  // Relations
  client?: Client;
}

// Interface utilisateur simplifiée pour CRM
export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  role: UserRole;
  typeClient?: TypeClient;
  createdAt: string;
  updatedAt: string;
}

// Interface pour les statistiques CRM
export interface CRMStats {
  totalClients: number;
  nouveauxClients: number;
  leadsActifs: number;
  pipelineTotal: number;
  tauxConversion: number;
  chiffreAffairesPrevisionnel: number;
  objectifMensuel?: number;
  performanceMensuelle?: number;
}

// Interface pour les filtres de recherche
export interface ClientFilters {
  search?: string;
  typeClient?: TypeClient | 'TOUS';
  ville?: string;
  pipelineMin?: number;
  pipelineMax?: number;
  commercial?: string;
  dateContact?: string;
}

// Interface pour la pagination
export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Interface pour les réponses paginées
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Interface pour les réponses API
export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Interface pour les erreurs de validation
export interface ValidationError {
  field: string;
  message: string;
}

// Interface pour les actions rapides CRM
export interface QuickAction {
  id: string;
  title: string;
  icon: string;
  href: string;
  color: string;
  description?: string;
}

// Interface pour les métriques de performance
export interface PerformanceMetric {
  label: string;
  value: number;
  target: number;
  progress: number;
  color: string;
  trend?: 'up' | 'down' | 'stable';
  change?: string;
}

// Interface pour les activités récentes
export interface RecentActivity {
  id: string;
  action: string;
  details: string;
  time: string;
  icon: string;
  link: string;
  clientId?: string;
  userId?: string;
}

// Interface pour les rendez-vous
export interface RendezVous {
  id: string;
  clientId: string;
  userId: string;
  titre: string;
  description?: string;
  dateDebut: string;
  dateFin: string;
  lieu?: string;
  statut: 'PLANIFIE' | 'EN_COURS' | 'TERMINE' | 'ANNULE';
  priorite: 'BASSE' | 'NORMALE' | 'HAUTE' | 'URGENTE';
  rappel?: number; // minutes avant
  
  // Relations
  client?: Client;
  user?: User;
}

// Interface pour la configuration des colonnes de tableau
export interface TableColumn<T = unknown> {
  key: keyof T | string;
  label: string;
  width?: string;
  sortable?: boolean;
  render?: (value: unknown, item: T) => React.ReactNode;
}

// Interface pour les paramètres de tri
export interface SortConfig {
  column: string;
  direction: 'asc' | 'desc';
}

// Types pour les hooks personnalisés
export interface UseClientsReturn {
  clients: Client[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  total: number;
}

export interface UseClientReturn {
  client: ClientDetailed | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  update: (data: Partial<Client>) => Promise<void>;
}

// Types pour les composants
export interface ClientCardProps {
  client: Client;
  onSelect?: (clientId: string) => void;
  onAction?: (action: string, clientId: string) => void;
}

export interface ClientFormProps {
  client?: Partial<Client>;
  onSubmit: (data: Client) => Promise<void>;
  onCancel?: () => void;
  loading?: boolean;
}

// Chantier interface simplifiée pour CRM
export interface Chantier {
  id: string;
  nom: string;
  clientId: string;
  statut: string;
  dateDebut?: string;
  dateFin?: string;
  montant?: number;
}