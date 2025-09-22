import { z } from "zod";

export const MarkReadSchema = z.object({
  chantierId: z.string().min(1, "Chantier ID requis"),
  userId: z.string().min(1, "User ID requis")
});

export const UserCreateSchema = z.object({
  name: z.string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(100, 'Le nom ne peut pas dépasser 100 caractères')
    .trim(),
  email: z.string()
    .email('Format email invalide')
    .toLowerCase(),
  password: z.string()
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
    .max(100, 'Le mot de passe ne peut pas dépasser 100 caractères'),
  role: z.enum(['ADMIN', 'COMMERCIAL', 'CLIENT', 'OUVRIER']),
  phone: z.string()
    .regex(/^(\+33|0)[1-9](\d{8})$/, 'Numéro de téléphone français invalide')
    .optional()
    .or(z.literal('')),
  company: z.string()
    .max(200, 'Le nom de l\'entreprise ne peut pas dépasser 200 caractères')
    .trim()
    .optional()
    .or(z.literal('')),
  address: z.string()
    .max(500, 'L\'adresse ne peut pas dépasser 500 caractères')
    .trim()
    .optional()
    .or(z.literal(''))
});

// Schémas pour les routes critiques restantes
export const ChantiersQuerySchema = z.object({
  page: z.string().transform(val => Math.max(1, parseInt(val) || 1)),
  limit: z.string().transform(val => Math.min(100, Math.max(1, parseInt(val) || 20))),
  search: z.string().optional(),
  status: z.enum(['PLANIFIE', 'EN_COURS', 'EN_ATTENTE', 'TERMINE', 'ANNULE']).optional(),
  clientId: z.string().optional(),
  chantierId: z.string().optional(),
  includeDeleted: z.string().transform(val => val === 'true').optional()
});

export const ChantierCreateSchema = z.object({
  nom: z.string().min(1, "Nom requis").max(100),
  description: z.string().min(1, "Description requise"),
  adresse: z.string().min(1, "Adresse requise"),
  clientId: z.string().min(1, "Client requis"),
  dateDebut: z.string().datetime(),
  dateFin: z.string().datetime(),
  budget: z.number().min(0, "Budget doit être positif"),
  superficie: z.string().optional(),
  photo: z.string().url().optional(),
  photos: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional()
});

export const DocumentsQuerySchema = z.object({
  page: z.string().transform(val => Math.max(1, parseInt(val) || 1)),
  limit: z.string().transform(val => Math.min(100, Math.max(1, parseInt(val) || 20))),
  search: z.string().optional(),
  type: z.string().optional(),
  chantierId: z.string().optional()
});

export const DocumentCreateSchema = z.object({
  nom: z.string().min(1, "Nom requis").max(200),
  nomOriginal: z.string().min(1, "Nom original requis"),
  type: z.string().min(1, "Type requis"),
  taille: z.number().min(0, "Taille doit être positive"),
  chantierId: z.string().optional(),
  public: z.boolean().default(false),
  tags: z.string().optional()
});

export const DevisQuerySchema = z.object({
  page: z.string().transform(val => Math.max(1, parseInt(val) || 1)),
  limit: z.string().transform(val => Math.min(100, Math.max(1, parseInt(val) || 20))),
  search: z.string().optional(),
  status: z.enum(['BROUILLON', 'ENVOYE', 'ACCEPTE', 'REFUSE', 'ANNULE']).optional(),
  type: z.enum(['DEVIS', 'FACTURE', 'AVOIR']).optional(),
  clientId: z.string().optional(),
  chantierId: z.string().optional()
});

export const DevisCreateSchema = z.object({
  clientId: z.string().min(1, "Client requis"),
  type: z.enum(['DEVIS', 'FACTURE', 'AVOIR']),
  objet: z.string().min(1, "Objet requis"),
  dateEcheance: z.string().datetime(),
  lignes: z.array(z.object({
    description: z.string().min(1, "Description requise"),
    quantite: z.number().min(0, "Quantité doit être positive"),
    prixUnit: z.number().min(0, "Prix unitaire doit être positif")
  })).min(1, "Au moins une ligne requise"),
  notes: z.string().optional(),
  conditionsVente: z.string().optional(),
  modalitesPaiement: z.string().optional(),
  tva: z.number().min(0).max(100).default(20),
  retenueGarantie: z.number().min(0).max(100).default(0),
  autoliquidation: z.boolean().default(false)
});