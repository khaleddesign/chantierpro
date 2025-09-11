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
    const lastMessageId = searchParams.get('lastMessageId')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)

    const whereCondition: any = {}

    if (chantierId) {
      whereCondition.chantierId = chantierId
    }

    if (lastMessageId) {
      whereCondition.id = { gt: lastMessageId }
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

    const messages = await prisma.message.findMany({
      where: whereCondition,
      include: {
        expediteur: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        chantier: {
          select: {
            id: true,
            nom: true,
            client: {
              select: { id: true, name: true }
            }
          }
        },
        fichiers: {
          select: {
            id: true,
            nom: true,
            type: true,
            url: true,
            taille: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    })

    // Marquer les messages comme lus
    if (messages.length > 0) {
      const messageIds = messages
        .filter(m => m.expediteurId !== userSession.userId)
        .map(m => m.id)
      
      if (messageIds.length > 0) {
        await prisma.message.updateMany({
          where: { 
            id: { in: messageIds },
            expediteurId: { not: userSession.userId }
          },
          data: { isRead: true }
        })
      }
    }

    return NextResponse.json({
      success: true,
      data: messages,
      hasMore: messages.length === limit
    })

  } catch (error) {
    console.error('Erreur récupération messages mobile:', error)
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
        !userSession.permissions.includes('messages:write')) {
      return NextResponse.json(
        { error: 'Permissions insuffisantes' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { contenu, chantierId, tempId, fichiers = [] } = body

    // Vérifier l'accès au chantier
    const chantier = await prisma.chantier.findFirst({
      where: {
        id: chantierId,
        OR: userSession.role === 'ADMIN' || userSession.permissions.includes('*') ? undefined : [
          { clientId: userSession.userId },
          { assigneeId: userSession.userId },
          { equipes: { some: { membresIds: { contains: userSession.userId } } } }
        ]
      }
    })

    if (!chantier) {
      return NextResponse.json(
        { error: 'Accès au chantier non autorisé' },
        { status: 403 }
      )
    }

    const newMessage = await prisma.message.create({
      data: {
        contenu,
        chantierId,
        expediteurId: userSession.userId,
        isRead: false,
        fichiers: {
          createMany: {
            data: fichiers.map((fichier: any) => ({
              nom: fichier.nom,
              type: fichier.type,
              url: fichier.url,
              taille: fichier.taille,
              uploaderId: userSession.userId
            }))
          }
        }
      },
      include: {
        expediteur: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        chantier: {
          select: {
            id: true,
            nom: true
          }
        },
        fichiers: {
          select: {
            id: true,
            nom: true,
            type: true,
            url: true,
            taille: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: newMessage,
      tempId
    })

  } catch (error) {
    console.error('Erreur création message mobile:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const userSession = await mobileJWT.validateMobileRequest(request)
    if (!userSession) {
      return NextResponse.json(
        { error: 'Token non valide' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { action, messageIds } = body

    switch (action) {
      case 'MARK_READ':
        await prisma.message.updateMany({
          where: {
            id: { in: messageIds },
            expediteurId: { not: userSession.userId }
          },
          data: { isRead: true }
        })
        break

      case 'MARK_UNREAD':
        await prisma.message.updateMany({
          where: {
            id: { in: messageIds },
            expediteurId: { not: userSession.userId }
          },
          data: { isRead: false }
        })
        break

      default:
        return NextResponse.json(
          { error: 'Action non supportée' },
          { status: 400 }
        )
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Erreur mise à jour messages mobile:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}