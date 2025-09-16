import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { mobileJWT } from '@/lib/auth/mobile-jwt'

export async function GET(request: NextRequest) {
  try {
    const userSession = await mobileJWT.validateMobileRequest(request)
    if (!userSession) {
      return NextResponse.json(
        { error: 'Token non valide' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const chantierId = searchParams.get('chantierId')
    const lastSync = searchParams.get('lastSync')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)
    const offset = parseInt(searchParams.get('offset') || '0')

    const whereCondition: any = {}

    // Filtrer par chantier si spécifié
    if (chantierId) {
      whereCondition.chantierId = chantierId
    }

    // Synchronisation incrémentale
    if (lastSync) {
      whereCondition.updatedAt = {
        gt: new Date(lastSync)
      }
    }

    // Filtrer selon les permissions utilisateur
    if (userSession.role === 'CLIENT') {
      whereCondition.chantier = {
        clientId: userSession.userId
      }
    } else if (userSession.role === 'OUVRIER') {
      whereCondition.chantier = {
        OR: [
          { assigneeId: userSession.userId },
          { equipes: { some: { membresIds: { contains: userSession.userId } } } }
        ]
      }
    }

    const documents = await prisma.document.findMany({
      where: whereCondition,
      include: {
        chantier: {
          select: {
            id: true,
            nom: true,
            client: {
              select: { id: true, name: true }
            }
          }
        },
        uploader: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    })

    const total = await prisma.document.count({ where: whereCondition })

    // Pour mobile, on ne retourne que les métadonnées, pas le contenu complet
    const mobileDocuments = documents.map(doc => ({
      id: doc.id,
      nom: doc.nom,
      type: doc.type,
      taille: doc.taille,
      url: doc.url,
      chantierId: doc.chantierId,
      chantier: doc.chantier,
      uploader: doc.uploader,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      // Indicateur si le document est disponible offline
      isOfflineAvailable: false, // TODO: implémenter le cache local
      thumbnailUrl: doc.type?.includes('image') ? `${doc.url}?thumbnail=true` : null
    }))

    return NextResponse.json({
      success: true,
      data: mobileDocuments,
      pagination: {
        total,
        limit,
        offset,
        hasNext: offset + limit < total
      },
      syncTimestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Erreur sync documents mobile:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const userSession = await mobileJWT.validateMobileRequest(request)
    if (!userSession) {
      return NextResponse.json(
        { error: 'Token non valide' },
        { status: 401 }
      )
    }

    if (!userSession.permissions.includes('*') && 
        !userSession.permissions.includes('documents:write')) {
      return NextResponse.json(
        { error: 'Permissions insuffisantes' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { actions } = body

    const results = []

    for (const action of actions) {
      try {
        switch (action.type) {
          case 'UPLOAD_DOCUMENT':
            // Pour mobile, on traite l'upload en base64 ou URL
            const newDocument = await prisma.document.create({
              data: {
                nom: action.data.nom,
                nomOriginal: action.data.nom,
                type: action.data.type,
                taille: action.data.taille,
                url: action.data.url, // URL temporaire ou base64
                uploader: {
                  connect: { id: userSession.userId }
                }
              },
              include: {
                chantier: { select: { id: true, nom: true } },
                uploader: { select: { id: true, name: true } }
              }
            })

            results.push({
              tempId: action.tempId,
              id: newDocument.id,
              success: true,
              data: newDocument
            })
            break

          case 'DELETE_DOCUMENT':
            await prisma.document.delete({
              where: { id: action.id }
            })

            results.push({
              id: action.id,
              success: true,
              message: 'Document supprimé'
            })
            break

          case 'UPDATE_DOCUMENT':
            const updatedDocument = await prisma.document.update({
              where: { id: action.id },
              data: action.data,
              include: {
                chantier: { select: { id: true, nom: true } },
                uploader: { select: { id: true, name: true } }
              }
            })

            results.push({
              id: action.id,
              success: true,
              data: updatedDocument
            })
            break

          default:
            results.push({
              id: action.id || action.tempId,
              success: false,
              error: 'Action non supportée'
            })
        }
      } catch (actionError) {
        console.error(`Erreur action document ${action.type}:`, actionError)
        results.push({
          id: action.id || action.tempId,
          success: false,
          error: 'Erreur lors de l\'exécution'
        })
      }
    }

    return NextResponse.json({
      success: true,
      results,
      syncTimestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Erreur sync documents mobile POST:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}