import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { cache } from '@/lib/cache';
import { checkPermission, logSecurityEvent } from '@/lib/security';
import { z } from 'zod';

const cacheQuerySchema = z.object({
  pattern: z.string().optional(),
  expired: z.coerce.boolean().default(false),
  limit: z.coerce.number().min(1).max(1000).default(100)
});

const cacheActionSchema = z.object({
  action: z.enum(['flush', 'clear_expired', 'invalidate_pattern']),
  pattern: z.string().optional(),
  keys: z.array(z.string()).optional()
});

// GET /api/admin/cache - Récupérer les informations du cache
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Vérification des permissions
    const hasPermission = await checkPermission(session.user.id, 'MANAGE_CACHE', 'admin');
    if (!hasPermission) {
      return NextResponse.json({ error: 'Permissions insuffisantes' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const params = cacheQuerySchema.parse({
      pattern: searchParams.get('pattern'),
      expired: searchParams.get('expired'),
      limit: searchParams.get('limit')
    });

    // Construction des filtres pour la base de données
    const where: any = {};
    
    if (params.pattern) {
      where.key = { contains: params.pattern };
    }

    if (params.expired) {
      where.expiresAt = { lt: new Date() };
    } else {
      where.OR = [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } }
      ];
    }

    // Récupération des entrées de cache
    const [cacheEntries, totalCount, expiredCount] = await Promise.all([
      prisma.cacheEntry.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        take: params.limit
      }),

      prisma.cacheEntry.count({ where }),

      prisma.cacheEntry.count({
        where: { expiresAt: { lt: new Date() } }
      })
    ]);

    // Calcul des statistiques
    const totalSize = cacheEntries.reduce((size, entry) => {
      return size + JSON.stringify(entry.value).length;
    }, 0);

    const tagStats = cacheEntries.reduce((stats, entry) => {
      const tags = Array.isArray(entry.tags) ? entry.tags : [];
      tags.forEach(tag => {
        stats[tag] = (stats[tag] || 0) + 1;
      });
      return stats;
    }, {} as Record<string, number>);

    // Métriques du cache mémoire (si disponible)
    const memoryCache = (cache as any).memoryCache;
    const memoryCacheSize = memoryCache ? memoryCache.size : 0;

    const stats = {
      total: totalCount,
      active: totalCount - expiredCount,
      expired: expiredCount,
      memoryEntries: memoryCacheSize,
      totalSizeBytes: totalSize,
      averageSizeBytes: totalCount > 0 ? Math.round(totalSize / totalCount) : 0,
      tagDistribution: Object.entries(tagStats)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([tag, count]) => ({ tag, count }))
    };

    // Transformation des données pour l'affichage
    const entries = cacheEntries.map(entry => ({
      id: entry.id,
      key: entry.key,
      tags: Array.isArray(entry.tags) ? entry.tags : [],
      expiresAt: entry.expiresAt?.toISOString(),
      isExpired: entry.expiresAt ? entry.expiresAt < new Date() : false,
      sizeBytes: JSON.stringify(entry.value).length,
      createdAt: entry.createdAt.toISOString(),
      updatedAt: entry.updatedAt.toISOString()
    }));

    // Log de l'accès au cache
    await logSecurityEvent({
      userId: session.user.id,
      action: 'VIEW_CACHE_STATS',
      resource: 'cache',
      ipAddress: request.ip || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      success: true,
      riskLevel: 'LOW',
      details: { 
        pattern: params.pattern,
        totalEntries: totalCount,
        expiredEntries: expiredCount
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        entries,
        stats,
        query: params
      }
    });

  } catch (error) {
    console.error('Erreur récupération cache:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Paramètres invalides',
        details: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      error: 'Erreur interne du serveur'
    }, { status: 500 });
  }
}

// POST /api/admin/cache - Actions sur le cache
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Vérification des permissions
    const hasPermission = await checkPermission(session.user.id, 'MANAGE_CACHE', 'admin');
    if (!hasPermission) {
      return NextResponse.json({ error: 'Permissions insuffisantes' }, { status: 403 });
    }

    const body = await request.json();
    const { action, pattern, keys } = cacheActionSchema.parse(body);

    let result: any = {};

    switch (action) {
      case 'flush':
        // Vider complètement le cache
        const deleteAllResult = await prisma.cacheEntry.deleteMany({});
        
        // Vider aussi le cache mémoire
        const memoryCache = (cache as any).memoryCache;
        if (memoryCache) {
          memoryCache.clear();
        }

        result = {
          deletedEntries: deleteAllResult.count,
          memoryCacheCleared: true
        };

        await logSecurityEvent({
          userId: session.user.id,
          action: 'CACHE_FLUSH_ALL',
          resource: 'cache',
          ipAddress: request.ip || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown',
          success: true,
          riskLevel: 'MEDIUM',
          details: { deletedEntries: deleteAllResult.count }
        });
        break;

      case 'clear_expired':
        // Supprimer uniquement les entrées expirées
        const deleteExpiredResult = await prisma.cacheEntry.deleteMany({
          where: { expiresAt: { lt: new Date() } }
        });

        result = {
          deletedEntries: deleteExpiredResult.count
        };

        await logSecurityEvent({
          userId: session.user.id,
          action: 'CACHE_CLEAR_EXPIRED',
          resource: 'cache',
          ipAddress: request.ip || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown',
          success: true,
          riskLevel: 'LOW',
          details: { deletedEntries: deleteExpiredResult.count }
        });
        break;

      case 'invalidate_pattern':
        if (!pattern && !keys) {
          return NextResponse.json({
            error: 'Pattern ou clés requis pour cette action'
          }, { status: 400 });
        }

        let where: any = {};
        
        if (pattern) {
          where.key = { contains: pattern };
        }
        
        if (keys && keys.length > 0) {
          where = {
            ...where,
            OR: keys.map(key => ({ key }))
          };
        }

        const deletePatternResult = await prisma.cacheEntry.deleteMany({ where });

        // Invalider aussi dans le cache mémoire
        const memoryCacheInstance = (cache as any).memoryCache;
        if (memoryCacheInstance && keys) {
          keys.forEach(key => memoryCacheInstance.delete(key));
        }

        result = {
          deletedEntries: deletePatternResult.count,
          pattern,
          keys
        };

        await logSecurityEvent({
          userId: session.user.id,
          action: 'CACHE_INVALIDATE_PATTERN',
          resource: 'cache',
          ipAddress: request.ip || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown',
          success: true,
          riskLevel: 'LOW',
          details: { 
            deletedEntries: deletePatternResult.count,
            pattern,
            keysCount: keys?.length || 0
          }
        });
        break;

      default:
        return NextResponse.json({
          error: 'Action non supportée'
        }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      action,
      result
    });

  } catch (error) {
    console.error('Erreur action cache:', error);

    const session = await getServerSession(authOptions);
    if (session?.user?.id) {
      await logSecurityEvent({
        userId: session.user.id,
        action: 'CACHE_ACTION_ERROR',
        resource: 'cache',
        ipAddress: request.ip || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        success: false,
        riskLevel: 'MEDIUM',
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      });
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Paramètres invalides',
        details: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      error: 'Erreur interne du serveur'
    }, { status: 500 });
  }
}

// GET /api/admin/cache/[key] - Récupérer une entrée spécifique
export async function getEntryByKey(key: string, request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const hasPermission = await checkPermission(session.user.id, 'MANAGE_CACHE', 'admin');
    if (!hasPermission) {
      return NextResponse.json({ error: 'Permissions insuffisantes' }, { status: 403 });
    }

    const entry = await prisma.cacheEntry.findUnique({
      where: { key }
    });

    if (!entry) {
      return NextResponse.json({ error: 'Entrée non trouvée' }, { status: 404 });
    }

    // Vérifier aussi dans le cache mémoire
    const memoryValue = await cache.get(key);
    const inMemory = memoryValue !== null;

    const response = {
      success: true,
      data: {
        ...entry,
        tags: Array.isArray(entry.tags) ? entry.tags : [],
        isExpired: entry.expiresAt ? entry.expiresAt < new Date() : false,
        inMemory,
        sizeBytes: JSON.stringify(entry.value).length
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Erreur récupération entrée cache:', error);
    return NextResponse.json({
      error: 'Erreur interne du serveur'
    }, { status: 500 });
  }
}

// DELETE /api/admin/cache/[key] - Supprimer une entrée spécifique
export async function deleteEntryByKey(key: string, request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const hasPermission = await checkPermission(session.user.id, 'MANAGE_CACHE', 'admin');
    if (!hasPermission) {
      return NextResponse.json({ error: 'Permissions insuffisantes' }, { status: 403 });
    }

    // Supprimer de la base de données
    const deleteResult = await prisma.cacheEntry.delete({
      where: { key }
    });

    // Supprimer du cache mémoire
    const memoryCache = (cache as any).memoryCache;
    const wasInMemory = memoryCache ? memoryCache.delete(key) : false;

    await logSecurityEvent({
      userId: session.user.id,
      action: 'CACHE_DELETE_ENTRY',
      resource: 'cache',
      ipAddress: request.ip || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      success: true,
      riskLevel: 'LOW',
      details: { key, wasInMemory }
    });

    return NextResponse.json({
      success: true,
      key,
      wasInMemory
    });

  } catch (error) {
    console.error('Erreur suppression entrée cache:', error);
    return NextResponse.json({
      error: 'Erreur interne du serveur'
    }, { status: 500 });
  }
}