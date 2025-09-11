import { SignJWT, jwtVerify } from 'jose'
import { authOptions } from '@/lib/auth'
import { getServerSession } from 'next-auth'

interface MobileSession {
  userId: string
  email: string
  role: string
  deviceId: string
  deviceInfo: {
    platform: string
    version: string
    userAgent: string
  }
  permissions: string[]
  lastSync?: Date
}

interface MobileTokenPayload extends MobileSession {
  iat: number
  exp: number
  iss: string
  sub: string
}

class MobileJWTManager {
  private secret = new TextEncoder().encode(
    process.env.NEXTAUTH_SECRET || 'fallback-secret-for-mobile'
  )
  
  private readonly MOBILE_TOKEN_EXPIRY = '30d' // 30 jours pour mobile
  private readonly REFRESH_TOKEN_EXPIRY = '90d' // 90 jours pour refresh
  
  async createMobileSession(
    userId: string,
    email: string,
    role: string,
    deviceId: string,
    deviceInfo: MobileSession['deviceInfo']
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const now = Math.floor(Date.now() / 1000)
    
    const permissions = await this.getUserPermissions(role)
    
    const sessionData: MobileSession = {
      userId,
      email,
      role,
      deviceId,
      deviceInfo,
      permissions,
      lastSync: new Date()
    }

    const accessToken = await new SignJWT(sessionData)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt(now)
      .setExpirationTime(now + 30 * 24 * 60 * 60) // 30 jours
      .setIssuer('chantierpro-mobile')
      .setSubject(userId)
      .sign(this.secret)

    const refreshToken = await new SignJWT({ 
      userId, 
      deviceId, 
      type: 'refresh' 
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt(now)
      .setExpirationTime(now + 90 * 24 * 60 * 60) // 90 jours
      .setIssuer('chantierpro-mobile-refresh')
      .setSubject(userId)
      .sign(this.secret)

    return { accessToken, refreshToken }
  }

  async verifyMobileToken(token: string): Promise<MobileTokenPayload | null> {
    try {
      const { payload } = await jwtVerify(token, this.secret, {
        issuer: 'chantierpro-mobile'
      })

      return payload as MobileTokenPayload
    } catch (error) {
      console.error('Token verification failed:', error)
      return null
    }
  }

  async refreshMobileToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string } | null> {
    try {
      const { payload } = await jwtVerify(refreshToken, this.secret, {
        issuer: 'chantierpro-mobile-refresh'
      })

      if (payload.type !== 'refresh') {
        throw new Error('Invalid refresh token type')
      }

      // Récupérer les données utilisateur actuelles
      const userData = await this.getUserData(payload.userId as string)
      if (!userData) {
        throw new Error('User not found')
      }

      // Créer une nouvelle session
      return this.createMobileSession(
        userData.id,
        userData.email,
        userData.role,
        payload.deviceId as string,
        userData.deviceInfo
      )
    } catch (error) {
      console.error('Token refresh failed:', error)
      return null
    }
  }

  async invalidateDeviceTokens(userId: string, deviceId: string): Promise<void> {
    // Ajouter à une blacklist côté serveur (Redis/Database)
    // Pour l'instant, on peut utiliser une approche simple avec timestamp
    const invalidationKey = `mobile_token_invalidated:${userId}:${deviceId}`
    
    // Stockage temporaire - à remplacer par Redis en production
    if (typeof global !== 'undefined') {
      (global as any).invalidatedTokens = (global as any).invalidatedTokens || new Set()
      ;(global as any).invalidatedTokens.add(invalidationKey)
    }
  }

  async isTokenInvalidated(userId: string, deviceId: string): Promise<boolean> {
    const invalidationKey = `mobile_token_invalidated:${userId}:${deviceId}`
    
    if (typeof global !== 'undefined' && (global as any).invalidatedTokens) {
      return (global as any).invalidatedTokens.has(invalidationKey)
    }
    
    return false
  }

  private async getUserPermissions(role: string): Promise<string[]> {
    const permissions: Record<string, string[]> = {
      'ADMIN': ['*'],
      'CHEF_CHANTIER': [
        'chantiers:read',
        'chantiers:write',
        'equipes:read',
        'equipes:write',
        'materiaux:read',
        'materiaux:write',
        'planning:read',
        'planning:write',
        'messages:read',
        'messages:write',
        'documents:read',
        'documents:write'
      ],
      'OUVRIER': [
        'chantiers:read',
        'equipes:read',
        'materiaux:read',
        'planning:read',
        'messages:read',
        'messages:write',
        'documents:read'
      ],
      'CLIENT': [
        'chantiers:read',
        'devis:read',
        'factures:read',
        'planning:read',
        'messages:read',
        'messages:write'
      ]
    }

    return permissions[role] || ['chantiers:read']
  }

  private async getUserData(userId: string): Promise<any> {
    // Simuler la récupération des données utilisateur
    // À remplacer par un appel à la base de données
    try {
      // Import dynamique pour éviter les erreurs de circular dependency
      const { PrismaClient } = await import('@prisma/client')
      const prisma = new PrismaClient()
      
      const user = await prisma.user.findUnique({
        where: { id: userId }
      })
      
      await prisma.$disconnect()
      
      return user ? {
        id: user.id,
        email: user.email,
        role: user.role,
        deviceInfo: {
          platform: 'unknown',
          version: '1.0.0',
          userAgent: 'ChantierPro Mobile'
        }
      } : null
    } catch (error) {
      console.error('Error fetching user data:', error)
      return null
    }
  }

  // Utilitaire pour extraire le token des headers
  extractTokenFromHeaders(request: Request): string | null {
    const authHeader = request.headers.get('authorization')
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7)
    }
    return null
  }

  // Middleware pour valider les requêtes mobile
  async validateMobileRequest(request: Request): Promise<MobileTokenPayload | null> {
    const token = this.extractTokenFromHeaders(request)
    if (!token) {
      return null
    }

    const payload = await this.verifyMobileToken(token)
    if (!payload) {
      return null
    }

    // Vérifier si le token n'est pas invalidé
    const isInvalidated = await this.isTokenInvalidated(payload.userId, payload.deviceId)
    if (isInvalidated) {
      return null
    }

    return payload
  }
}

export const mobileJWT = new MobileJWTManager()
export type { MobileSession, MobileTokenPayload }