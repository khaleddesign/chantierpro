import { z } from 'zod';

// Schéma pour la création d'un chantier
export const ChantierCreateSchema = z.object({
  nom: z.string()
    .min(1, "Le nom du chantier est requis")
    .max(100, "Le nom ne peut pas dépasser 100 caractères")
    .trim(),
  
  description: z.string()
    .min(10, "La description doit contenir au moins 10 caractères")
    .max(1000, "La description ne peut pas dépasser 1000 caractères")
    .trim(),
  
  adresse: z.string()
    .min(5, "L'adresse doit contenir au moins 5 caractères")
    .max(200, "L'adresse ne peut pas dépasser 200 caractères")
    .trim(),
  
  clientId: z.string()
    .cuid("ID client invalide"),
  
  dateDebut: z.string()
    .datetime("Date de début invalide")
    .refine((date) => new Date(date) >= new Date(), {
      message: "La date de début ne peut pas être dans le passé"
    }),
  
  dateFin: z.string()
    .datetime("Date de fin invalide"),
  
  budget: z.number()
    .positive("Le budget doit être positif")
    .max(10000000, "Le budget ne peut pas dépasser 10 millions")
    .multipleOf(0.01, "Le budget doit être un montant valide"),
  
  superficie: z.string()
    .optional()
    .refine((val) => !val || /^[\d.,]+\s*(m²|m2|ha|hectares?)?$/i.test(val), {
      message: "Format de superficie invalide (ex: 100 m², 1,5 ha)"
    }),
  
  photo: z.string()
    .url("URL de photo invalide")
    .optional(),
  
  lat: z.number()
    .min(-90, "Latitude invalide")
    .max(90, "Latitude invalide")
    .optional(),
  
  lng: z.number()
    .min(-180, "Longitude invalide")
    .max(180, "Longitude invalide")
    .optional()
}).refine((data) => {
  const debut = new Date(data.dateDebut);
  const fin = new Date(data.dateFin);
  return fin > debut;
}, {
  message: "La date de fin doit être postérieure à la date de début",
  path: ["dateFin"]
});

// Schéma pour la mise à jour d'un chantier
export const ChantierUpdateSchema = ChantierCreateSchema.partial().extend({
  id: z.string().cuid("ID chantier invalide")
});

// Schéma pour les filtres de recherche
export const ChantierFiltersSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
  search: z.string().optional(),
  status: z.enum(['PLANIFIE', 'EN_COURS', 'EN_PAUSE', 'TERMINE', 'ANNULE', 'TOUS']).optional(),
  clientId: z.string().cuid().optional(),
  dateDebut: z.string().datetime().optional(),
  dateFin: z.string().datetime().optional(),
  budgetMin: z.number().positive().optional(),
  budgetMax: z.number().positive().optional()
});

// Schéma pour l'assignation d'utilisateurs à un chantier
export const ChantierAssignSchema = z.object({
  chantierId: z.string().cuid("ID chantier invalide"),
  userIds: z.array(z.string().cuid("ID utilisateur invalide"))
    .min(1, "Au moins un utilisateur doit être assigné")
    .max(10, "Maximum 10 utilisateurs peuvent être assignés")
});

// Schéma pour la mise à jour du statut
export const ChantierStatusUpdateSchema = z.object({
  chantierId: z.string().cuid("ID chantier invalide"),
  statut: z.enum(['PLANIFIE', 'EN_COURS', 'EN_PAUSE', 'TERMINE', 'ANNULE']),
  progression: z.number()
    .min(0, "La progression ne peut pas être négative")
    .max(100, "La progression ne peut pas dépasser 100%")
    .optional(),
  commentaire: z.string()
    .max(500, "Le commentaire ne peut pas dépasser 500 caractères")
    .optional()
});

// Types TypeScript dérivés des schémas
export type ChantierCreateInput = z.infer<typeof ChantierCreateSchema>;
export type ChantierUpdateInput = z.infer<typeof ChantierUpdateSchema>;
export type ChantierFilters = z.infer<typeof ChantierFiltersSchema>;
export type ChantierAssignInput = z.infer<typeof ChantierAssignSchema>;
export type ChantierStatusUpdate = z.infer<typeof ChantierStatusUpdateSchema>;