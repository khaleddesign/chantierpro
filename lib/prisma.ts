import { PrismaClient } from '@prisma/client'

declare global {
  var __prisma: PrismaClient | undefined
}

// PrismaClient configuration optimized for serverless
export const prisma = globalThis.__prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: process.env.POSTGRES_PRISMA_URL,
    },
  },
})

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma
}

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect()
})

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