import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  },
  // Configuration pour éviter les problèmes de prepared statements avec le pooling
  __internal: {
    engine: {
      binaryTargets: ['native']
    }
  }
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma