import { z } from 'zod';

export const messageSchema = z.object({
  expediteurId: z.string().min(1, 'ID expéditeur requis'),
  message: z.string()
    .min(1, 'Message requis')
    .max(2000, 'Message trop long (max 2000 caractères)')
    .refine(msg => msg.trim().length > 0, 'Message ne peut être vide'),
  chantierId: z.string().optional(),
  destinataireId: z.string().optional(),
  photos: z.array(z.string().url('URL photo invalide'))
    .max(5, 'Maximum 5 photos')
    .optional()
    .default([]),
  threadId: z.string().optional()
});

export const conversationQuerySchema = z.object({
  userId: z.string().min(1, 'User ID requis'),
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
  search: z.string().optional(),
  type: z.enum(['all', 'chantier', 'direct']).default('all')
});

export const markReadSchema = z.object({
  chantierId: z.string().min(1, 'Chantier ID requis'),
  userId: z.string().min(1, 'User ID requis')
});

// Sanitisation des messages (XSS prevention)
export function sanitizeMessage(message: string): string {
  return message
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim();
}

// Rate limiting simple en mémoire
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(userId: string, maxRequests: number = 30, windowMs: number = 60000): boolean {
  const now = Date.now();
  const userLimit = rateLimitStore.get(userId);

  if (!userLimit || now > userLimit.resetTime) {
    rateLimitStore.set(userId, {
      count: 1,
      resetTime: now + windowMs
    });
    return true;
  }

  if (userLimit.count >= maxRequests) {
    return false;
  }

  userLimit.count++;
  return true;
}
