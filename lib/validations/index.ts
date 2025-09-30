// lib/validations/index.ts
export * from './crm';

// Schémas spécifiques pour chantiers si manquants
import { z } from 'zod';

export const ChantiersQuerySchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  search: z.string().optional(),
  status: z.string().optional(),
  clientId: z.string().optional(),
  includeDeleted: z.boolean().optional()
});

export const ChantierCreateSchema = z.object({
  nom: z.string().min(1),
  description: z.string().min(1),
  adresse: z.string().min(1),
  clientId: z.string().min(1),
  dateDebut: z.string(),
  dateFin: z.string(),
  budget: z.number().positive(),
  superficie: z.string().optional(),
  photo: z.string().optional(),
  photos: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional()
});
