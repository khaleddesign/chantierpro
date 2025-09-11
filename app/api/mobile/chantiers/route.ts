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
    const lastSync = searchParams.get('lastSync')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const offset = parseInt(searchParams.get('offset') || '0')

    const whereCondition: any = {}

    // Filtrage selon le rôle
    if (userSession.role === 'CLIENT') {
      whereCondition.clientId = userSession.userId
    } else if (userSession.role === 'OUVRIER') {
      whereCondition.OR = [
        { assigneeId: userSession.userId },
        { equipes: { some: { membresIds: { contains: userSession.userId } } } }
      ]
    }

    // Synchronisation incrémentale
    if (lastSync) {
      whereCondition.updatedAt = {
        gt: new Date(lastSync)
      }
    }

    const chantiers = await prisma.chantier.findMany({
      where: whereCondition,
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            company: true
          }
        },
        assignee: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        equipes: {
          select: {
            id: true,
            nom: true,
            membresIds: true
          }
        },
        etapes: {
          select: {
            id: true,
            titre: true,
            description: true,
            statut: true,
            dateDebut: true,
            dateFin: true,
            ordre: true
          },
          orderBy: { ordre: 'asc' }
        },
        documents: {
          select: {
            id: true,
            nom: true,
            type: true,
            taille: true,
            url: true,
            createdAt: true
          },
          take: 10, // Limite pour mobile
          orderBy: { createdAt: 'desc' }
        },
        messages: {
          select: {
            id: true,
            contenu: true,
            expediteur: {
              select: { id: true, name: true }
            },
            createdAt: true,
            isRead: true
          },
          take: 20,
          orderBy: { createdAt: 'desc' }
        }
      },
      take: limit,
      skip: offset,
      orderBy: { updatedAt: 'desc' }
    })

    const total = await prisma.chantier.count({ where: whereCondition })

    return NextResponse.json({
      success: true,
      data: chantiers,
      pagination: {
        total,
        limit,
        offset,
        hasNext: offset + limit < total
      },
      syncTimestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Erreur sync chantiers mobile:', error)
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

    // Vérifier les permissions
    if (!userSession.permissions.includes('*') && 
        !userSession.permissions.includes('chantiers:write')) {
      return NextResponse.json(
        { error: 'Permissions insuffisantes' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { actions } = body // Array d'actions de synchronisation

    const results = []

    for (const action of actions) {
      try {
        switch (action.type) {
          case 'CREATE_CHANTIER':
            const newChantier = await prisma.chantier.create({
              data: {
                ...action.data,
                createdById: userSession.userId
              },
              include: {
                client: { select: { id: true, name: true, email: true } },
                assignee: { select: { id: true, name: true, email: true } }
              }
            })
            results.push({ 
              tempId: action.tempId, 
              id: newChantier.id, 
              success: true,
              data: newChantier 
            })
            break

          case 'UPDATE_CHANTIER':
            const updatedChantier = await prisma.chantier.update({
              where: { id: action.id },
              data: action.data,
              include: {
                client: { select: { id: true, name: true, email: true } },
                assignee: { select: { id: true, name: true, email: true } }
              }
            })
            results.push({ 
              id: action.id, 
              success: true,
              data: updatedChantier 
            })
            break

          case 'UPDATE_ETAPE':
            const updatedEtape = await prisma.etapeChantier.update({
              where: { id: action.id },
              data: action.data
            })
            results.push({ 
              id: action.id, 
              success: true,
              data: updatedEtape 
            })
            break

          case 'CREATE_MESSAGE':
            const newMessage = await prisma.message.create({
              data: {
                ...action.data,
                expediteurId: userSession.userId
              },
              include: {
                expediteur: { select: { id: true, name: true } }
              }
            })
            results.push({ 
              tempId: action.tempId, 
              id: newMessage.id, 
              success: true,
              data: newMessage 
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
        console.error(`Erreur action ${action.type}:`, actionError)
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
    console.error('Erreur sync mobile POST:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}