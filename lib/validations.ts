import { z } from "zod";

export const CreateMessageSchema = z.object({
  expediteurId: z.string().min(1, "Expéditeur requis"),
  message: z.string().min(1, "Message requis").max(2000, "Message trop long"),
  chantierId: z.string().optional(),
  destinataireId: z.string().optional(),
  photos: z.array(z.string().url()).max(5, "Maximum 5 photos").default([]),
  typeMessage: z.enum(["DIRECT", "CHANTIER", "GROUPE"]).default("DIRECT")
});

export const SearchQuerySchema = z.object({
  q: z.string().min(2, "Minimum 2 caractères").max(100),
  filter: z.enum(["all", "messages", "contacts", "files"]).default("all"),
  chantierId: z.string().optional(),
  limit: z.number().min(1).max(50).default(20),
  page: z.number().min(1).default(1)
});

export const ContactsQuerySchema = z.object({
  role: z.enum(["ADMIN", "COMMERCIAL", "OUVRIER", "CLIENT"]).optional(),
  chantierId: z.string().optional(),
  search: z.string().max(50).optional(),
  status: z.enum(["online", "offline", "all"]).default("all")
});

export const ChantierCreateSchema = z.object({
  nom: z.string().min(1, "Nom requis").max(100),
  description: z.string().min(1, "Description requise"),
  adresse: z.string().min(1, "Adresse requise"),
  clientId: z.string().min(1, "Client requis"),
  dateDebut: z.string().min(1, "Date de début requise"),
  dateFin: z.string().min(1, "Date de fin requise"),
  budget: z.number().min(0, "Budget doit être positif"),
  superficie: z.string().optional(),
  photo: z.string().url().optional()
});

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
