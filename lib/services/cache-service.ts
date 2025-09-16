import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { cache } from '@/lib/cache';
import { checkPermission, logSecurityEvent } from '@/lib/security';
import { getClientIp } from '@/lib/utils';

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
      ipAddress: getClientIp(request),
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
