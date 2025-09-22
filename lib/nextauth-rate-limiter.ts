import { NextRequest, NextResponse } from 'next/server';
import { getRateLimit } from '@/lib/rate-limiter';
import { logLoginFailed } from '@/lib/audit-logger';

// Configuration spécifique pour NextAuth
const NEXTAUTH_RATE_LIMITS = {
  // Limite stricte pour les tentatives de connexion
  LOGIN_ATTEMPTS: { maxRequests: 5, windowMs: 15 * 60 * 1000 }, // 5 tentatives par 15 minutes
  // Limite pour les autres endpoints NextAuth
  GENERAL: { maxRequests: 20, windowMs: 5 * 60 * 1000 }, // 20 requêtes par 5 minutes
};

// Fonction pour obtenir l'IP réelle
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip'); // Cloudflare
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  if (realIP) {
    return realIP;
  }
  if (cfConnectingIP) {
    return cfConnectingIP;
  }
  
  return 'unknown';
}

// Fonction pour créer un identifiant unique
function createIdentifier(request: NextRequest): string {
  const ip = getClientIP(request);
  const userAgent = request.headers.get('user-agent') || 'unknown';
  
  // Utiliser IP + User-Agent pour plus de précision
  return `${ip}:${userAgent.slice(0, 50)}`;
}

// Middleware de rate limiting pour NextAuth
export async function nextAuthRateLimit(request: NextRequest): Promise<NextResponse | null> {
  const identifier = createIdentifier(request);
  const url = new URL(request.url);
  const pathname = url.pathname;
  
  // Déterminer le type de rate limiting selon l'endpoint
  let rateLimitType: 'LOGIN_ATTEMPTS' | 'GENERAL';
  
  if (pathname.includes('/callback/credentials') || 
      pathname.includes('/signin') || 
      pathname.includes('/login')) {
    rateLimitType = 'LOGIN_ATTEMPTS';
  } else {
    rateLimitType = 'GENERAL';
  }
  
  const config = NEXTAUTH_RATE_LIMITS[rateLimitType];
  
  // Utiliser le système de rate limiting existant
  const result = await getRateLimit(identifier, 'AUTH');
  
  // Adapter les limites selon le type
  const maxRequests = config.maxRequests;
  const windowMs = config.windowMs;
  
  // Vérifier si la limite est dépassée
  if (result.totalRequests >= maxRequests) {
    const resetTimeSeconds = Math.ceil((result.resetTime - Date.now()) / 1000);
    
    // Log de tentative de brute force
    if (rateLimitType === 'LOGIN_ATTEMPTS') {
      await logLoginFailed('rate_limited', getClientIP(request), 
        request.headers.get('user-agent') || 'unknown', 'rate_limit_exceeded');
    }
    
    return NextResponse.json(
      {
        error: 'Trop de tentatives de connexion. Veuillez réessayer plus tard.',
        retryAfter: resetTimeSeconds,
        type: 'RATE_LIMIT_EXCEEDED',
        message: 'Rate limiting activé pour protéger contre les attaques par force brute'
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': maxRequests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': Math.ceil(result.resetTime / 1000).toString(),
          'Retry-After': resetTimeSeconds.toString(),
          'X-RateLimit-Type': rateLimitType
        }
      }
    );
  }
  
  return null; // Continuer vers NextAuth
}

// Fonction pour appliquer le rate limiting à NextAuth
export function withNextAuthRateLimit(handler: any) {
  return async (request: NextRequest, context: any) => {
    // Appliquer le rate limiting avant NextAuth
    const rateLimitResponse = await nextAuthRateLimit(request);
    
    if (rateLimitResponse) {
      return rateLimitResponse;
    }
    
    // Continuer vers NextAuth
    return handler(request, context);
  };
}

// Configuration de rate limiting renforcée pour la production
export const PRODUCTION_RATE_LIMITS = {
  // Limites strictes pour la production
  LOGIN_ATTEMPTS: { maxRequests: 3, windowMs: 15 * 60 * 1000 }, // 3 tentatives par 15 minutes
  GENERAL: { maxRequests: 10, windowMs: 5 * 60 * 1000 }, // 10 requêtes par 5 minutes
  
  // Limites progressives (augmentation du délai après chaque échec)
  PROGRESSIVE: {
    firstAttempt: { maxRequests: 5, windowMs: 5 * 60 * 1000 }, // 5 tentatives par 5 minutes
    secondAttempt: { maxRequests: 3, windowMs: 15 * 60 * 1000 }, // 3 tentatives par 15 minutes
    thirdAttempt: { maxRequests: 1, windowMs: 60 * 60 * 1000 }, // 1 tentative par heure
  }
};

// Fonction pour obtenir les limites selon l'environnement
export function getRateLimitConfig() {
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (isProduction) {
    return PRODUCTION_RATE_LIMITS.LOGIN_ATTEMPTS;
  }
  
  return NEXTAUTH_RATE_LIMITS.LOGIN_ATTEMPTS;
}

// Fonction pour détecter les patterns d'attaque
export function detectAttackPattern(identifier: string, attempts: number[]): boolean {
  // Détecter les tentatives rapides (plus de 3 tentatives en moins de 30 secondes)
  const now = Date.now();
  const recentAttempts = attempts.filter(time => now - time < 30 * 1000);
  
  if (recentAttempts.length > 3) {
    return true;
  }
  
  // Détecter les patterns répétitifs
  if (attempts.length > 10) {
    return true;
  }
  
  return false;
}

// Fonction pour bloquer temporairement une IP suspecte
export async function blockSuspiciousIP(ip: string, duration: number = 60 * 60 * 1000): Promise<void> {
  // Implémenter un système de blocage temporaire
  // Peut utiliser Redis ou une base de données
  console.warn(`🚨 IP suspecte bloquée temporairement: ${ip} pour ${duration}ms`);
  
  // TODO: Implémenter le blocage dans Redis ou base de données
  // await redis.setex(`blocked:${ip}`, Math.ceil(duration / 1000), '1');
}
