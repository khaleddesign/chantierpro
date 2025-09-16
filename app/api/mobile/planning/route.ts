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
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const lastSync = searchParams.get('lastSync')

    const whereCondition: any = {}

    // Filtrage par dates
    if (startDate || endDate) {
      whereCondition.OR = [
        {
          dateDebut: {
            ...(startDate && { gte: new Date(startDate) }),
            ...(endDate && { lte: new Date(endDate) })
          }
        },
        {
          dateFin: {
            ...(startDate && { gte: new Date(startDate) }),
            ...(endDate && { lte: new Date(endDate) })
          }
        }
      ]
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
      whereCondition.OR = [
        ...(whereCondition.OR || []),
        {
          organisateurId: userSession.userId
        },
        {
          participants: {
            some: { id: userSession.userId }
          }
        },
        {
          chantier: {
            OR: [
              { assigneeId: userSession.userId },
              { equipes: { some: { membresIds: { contains: userSession.userId } } } }
            ]
          }
        }
      ]
    }

    const plannings = await prisma.planning.findMany({
      where: whereCondition,
      include: {
        chantier: {
          select: {
            id: true,
            nom: true,
            adresse: true,
            statut: true
          }
        },
        organisateur: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        participants: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: { dateDebut: 'asc' }
    })

    // Adapter pour mobile - format optimisé
    const mobilePlannings = plannings.map(planning => ({
      id: planning.id,
      titre: planning.titre,
      description: planning.description,
      dateDebut: planning.dateDebut,
      dateFin: planning.dateFin,
      statut: planning.statut,
      lieu: planning.lieu,
      chantier: planning.chantier,
      organisateur: planning.organisateur,
      participants: planning.participants,
      isAllDay: planning.dateDebut.getHours() === 0 && planning.dateFin.getHours() === 23,
      duration: Math.ceil((planning.dateFin.getTime() - planning.dateDebut.getTime()) / (1000 * 60 * 60)), // heures
      createdAt: planning.createdAt,
      updatedAt: planning.updatedAt
    }))

    return NextResponse.json({
      success: true,
      data: mobilePlannings,
      syncTimestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Erreur sync planning mobile:', error)
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
        !userSession.permissions.includes('planning:write')) {
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
          case 'CREATE_PLANNING':
            const newPlanning = await prisma.planning.create({
              data: {
                ...action.data,
                organisateurId: userSession.userId,
                participants: {
                  connect: action.data.participantIds?.map((id: string) => ({ id })) || []
                }
              },
              include: {
                chantier: { select: { id: true, nom: true } },
                organisateur: { select: { id: true, name: true } },
                participants: { select: { id: true, name: true } }
              }
            })

            results.push({
              tempId: action.tempId,
              id: newPlanning.id,
              success: true,
              data: newPlanning
            })
            break

          case 'UPDATE_PLANNING':
            const updatedPlanning = await prisma.planning.update({
              where: { id: action.id },
              data: {
                ...action.data,
                ...(action.data.participantIds && {
                  participants: {
                    set: action.data.participantIds.map((id: string) => ({ id }))
                  }
                })
              },
              include: {
                chantier: { select: { id: true, nom: true } },
                organisateur: { select: { id: true, name: true } },
                participants: { select: { id: true, name: true } }
              }
            })

            results.push({
              id: action.id,
              success: true,
              data: updatedPlanning
            })
            break

          case 'DELETE_PLANNING':
            await prisma.planning.delete({
              where: { id: action.id }
            })

            results.push({
              id: action.id,
              success: true,
              message: 'Planning supprimé'
            })
            break

          case 'UPDATE_PARTICIPATION':
            // Marquer sa participation/absence
            if (action.data.isParticipating) {
              await prisma.planning.update({
                where: { id: action.id },
                data: {
                  participants: {
                    connect: { id: userSession.userId }
                  }
                }
              })
            } else {
              await prisma.planning.update({
                where: { id: action.id },
                data: {
                  participants: {
                    disconnect: { id: userSession.userId }
                  }
                }
              })
            }

            results.push({
              id: action.id,
              success: true,
              message: action.data.isParticipating ? 'Participation confirmée' : 'Participation annulée'
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
        console.error(`Erreur action planning ${action.type}:`, actionError)
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
    console.error('Erreur sync planning mobile POST:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

// Endpoint spécifique pour les conflits de planning
export async function PUT(request: NextRequest) {
  try {
    const userSession = await mobileJWT.validateMobileRequest(request)
    if (!userSession) {
      return NextResponse.json(
        { error: 'Token non valide' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { dateDebut, dateFin, participantIds } = body

    // Vérifier les conflits de planning
    const conflicts = await prisma.planning.findMany({
      where: {
        OR: [
          {
            dateDebut: { lte: new Date(dateFin) },
            dateFin: { gte: new Date(dateDebut) }
          }
        ],
        participants: {
          some: {
            id: { in: participantIds }
          }
        }
      },
      include: {
        chantier: { select: { id: true, nom: true } },
        participants: { select: { id: true, name: true } }
      }
    })

    return NextResponse.json({
      success: true,
      conflicts: conflicts.map(conflict => ({
        id: conflict.id,
        titre: conflict.titre,
        dateDebut: conflict.dateDebut,
        dateFin: conflict.dateFin,
        chantier: conflict.chantier,
        participantsEnConflit: conflict.participants.filter(p => 
          participantIds.includes(p.id)
        )
      }))
    })

  } catch (error) {
    console.error('Erreur vérification conflits planning:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}