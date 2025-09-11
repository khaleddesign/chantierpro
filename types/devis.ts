export interface LigneDevis {
  id?: string;
  designation: string;
  quantite: number;
  prixUnitaire: number;
  tauxTVA: number;
  total: number;
  ordre?: number;
}

export interface DevisData {
  id?: string;
  numero?: string;
  type: 'DEVIS' | 'FACTURE';
  clientId: string;
  chantierId?: string;
  objet: string;
  dateValidite?: string;
  notes?: string;
  conditionsVente?: string;
  lignes: LigneDevis[];
  totalHT?: number;
  totalTVA?: number;
  totalTTC?: number;
  statut?: 'BROUILLON' | 'ENVOYE' | 'ACCEPTE' | 'REFUSE' | 'PAYE';
}

export interface DevisDetail extends DevisData {
  dateCreation: string;
  client: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    company?: string;
    address?: string;
  };
  chantier?: {
    id: string;
    nom: string;
    adresse: string;
  };
  ligneDevis: Array<{
    id: string;
    description: string;
    quantite: number;
    prixUnit: number;
    total: number;
    ordre: number;
  }>;
}
