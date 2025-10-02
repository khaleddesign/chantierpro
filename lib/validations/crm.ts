import { z } from 'zod';

// Types enum pour validation
export const TypeClientEnum = z.enum(['PARTICULIER', 'PROFESSIONNEL', 'SYNDIC', 'PROMOTEUR']);
export const UserRoleEnum = z.enum(['ADMIN', 'COMMERCIAL', 'CLIENT', 'OUVRIER']);

// Validation pour la création/modification d'un client
export const ClientCreateSchema = z.object({
  name: z.string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(100, 'Le nom ne peut pas dépasser 100 caractères')
    .trim(),
  email: z.string()
    .email('Format email invalide')
    .toLowerCase(),
  phone: z.string()
    .regex(/^(\+33|0)[1-9](\d{8})$/, 'Numéro de téléphone français invalide')
    .optional()
    .or(z.literal('')),
  company: z.string()
    .max(200, 'Le nom de l\'entreprise ne peut pas dépasser 200 caractères')
    .trim()
    .optional()
    .or(z.literal('')),
  typeClient: TypeClientEnum.default('PARTICULIER'),
  secteurActivite: z.string()
    .max(100, 'Le secteur d\'activité ne peut pas dépasser 100 caractères')
    .trim()
    .optional()
    .or(z.literal('')),
  effectif: z.string()
    .max(20, 'L\'effectif ne peut pas dépasser 20 caractères')
    .optional()
    .or(z.literal('')),
  chiffreAffaires: z.number()
    .min(0, 'Le chiffre d\'affaires ne peut pas être négatif')
    .max(999999999, 'Le chiffre d\'affaires est trop élevé')
    .optional(),
  address: z.string()
    .max(500, 'L\'adresse ne peut pas dépasser 500 caractères')
    .trim()
    .optional()
    .or(z.literal('')),
  ville: z.string()
    .max(100, 'La ville ne peut pas dépasser 100 caractères')
    .trim()
    .optional()
    .or(z.literal('')),
  codePostal: z.string()
    .regex(/^[0-9]{5}$/, 'Code postal invalide (5 chiffres requis)')
    .optional()
    .or(z.literal('')),
  commercialId: z.string()
    .uuid('ID commercial invalide')
    .optional()
    .or(z.literal(''))
});

export const ClientUpdateSchema = ClientCreateSchema.partial().extend({
  id: z.string().uuid('ID client invalide')
});

// Validation pour les filtres de recherche
export const ClientFiltersSchema = z.object({
  search: z.string().optional(),
  typeClient: z.union([
    TypeClientEnum,
    z.literal('TOUS')
  ]).default('TOUS'),
  ville: z.string().optional(),
  pipelineMin: z.string()
    .transform((val) => val === '' ? undefined : parseFloat(val))
    .optional(),
  pipelineMax: z.string()
    .transform((val) => val === '' ? undefined : parseFloat(val))
    .optional(),
  commercial: z.string().optional(),
  dateContact: z.string().optional()
});

// Validation pour les interactions clients
export const InteractionCreateSchema = z.object({
  clientId: z.string().uuid('ID client invalide'),
  type: z.enum(['APPEL', 'EMAIL', 'VISITE', 'REUNION', 'AUTRE']),
  objet: z.string()
    .min(5, 'L\'objet doit contenir au moins 5 caractères')
    .max(200, 'L\'objet ne peut pas dépasser 200 caractères')
    .trim(),
  description: z.string()
    .min(10, 'La description doit contenir au moins 10 caractères')
    .max(2000, 'La description ne peut pas dépasser 2000 caractères')
    .trim(),
  dateContact: z.string()
    .datetime('Format de date invalide')
    .optional(),
  prochaineSuite: z.string()
    .datetime('Format de date invalide')
    .optional(),
  createdBy: z.string().uuid('ID créateur invalide')
});

// Validation pour les opportunités
export const OpportuniteCreateSchema = z.object({
  clientId: z.string().uuid('ID client invalide'),
  nom: z.string()
    .min(5, 'Le nom doit contenir au moins 5 caractères')
    .max(200, 'Le nom ne peut pas dépasser 200 caractères')
    .trim(),
  description: z.string()
    .max(2000, 'La description ne peut pas dépasser 2000 caractères')
    .trim(),
  valeurEstimee: z.number()
    .min(0, 'La valeur estimée ne peut pas être négative')
    .max(99999999, 'La valeur estimée est trop élevée'),
  probabilite: z.number()
    .min(0, 'La probabilité doit être entre 0 et 100')
    .max(100, 'La probabilité doit être entre 0 et 100')
    .default(50),
  statut: z.enum(['PROSPECT', 'QUALIFIE', 'PROPOSITION', 'NEGOCIATION', 'GAGNE', 'PERDU']).default('PROSPECT'),
  dateCloture: z.string()
    .datetime('Format de date invalide')
    .optional()
});

// Types TypeScript dérivés des schémas
export type ClientCreate = z.infer<typeof ClientCreateSchema>;
export type ClientUpdate = z.infer<typeof ClientUpdateSchema>;
export type ClientFilters = z.infer<typeof ClientFiltersSchema>;
export type InteractionCreate = z.infer<typeof InteractionCreateSchema>;
export type OpportuniteCreate = z.infer<typeof OpportuniteCreateSchema>;

// Fonction utilitaire pour valider et nettoyer les données
export function validateAndSanitize<T>(schema: z.ZodSchema<T>, data: unknown): {
  success: boolean;
  data?: T;
  errors?: string[]
} {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.issues.map((err: z.ZodIssue) => `${err.path.join('.')}: ${err.message}`);
      return { success: false, errors };
    }
    return { success: false, errors: ['Erreur de validation inconnue'] };
  }
}

// Fonction pour valider de manière asynchrone avec gestion d'erreurs
export async function validateAsync<T>(
  schema: z.ZodSchema<T>, 
  data: unknown
): Promise<T> {
  try {
    return await schema.parseAsync(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.issues.map((err: z.ZodIssue) => 
        `${err.path.join('.')}: ${err.message}`
      ).join(', ');
      throw new Error(`Validation failed: ${messages}`);
    }
    throw new Error('Unknown validation error');
  }
}