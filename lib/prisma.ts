// lib/prisma.ts - Correction pour environnement serverless

import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ??
  new PrismaClient({
    log: ['query'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Export d'une fonction pour forcer la connexion
export async function connectPrisma() {
  try {
    await prisma.$connect()
    console.log('✅ Prisma connecté avec succès')
  } catch (error) {
    console.error('❌ Erreur connexion Prisma:', error)
    throw error
  }
}

// Fonction de nettoyage pour les fonctions serverless
export async function disconnectPrisma() {
  try {
    await prisma.$disconnect()
    console.log('✅ Prisma déconnecté')
  } catch (error) {
    console.error('❌ Erreur déconnexion Prisma:', error)
  }
}