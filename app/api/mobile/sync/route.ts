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
    const dataTypes = searchParams.get('types')?.split(',') || ['chantiers', 'messages', 'documents', 'planning']

    const syncData: any = {}
    const syncTimestamp = new Date().toISOString()

    // Synchronisation des chantiers
    if (dataTypes.includes('chantiers')) {
      const chantiersWhere: any = {}
      
      if (lastSync) {
        chantiersWhere.updatedAt = { gt: new Date(lastSync) }
      }

      if (userSession.role === 'CLIENT') {
        chantiersWhere.clientId = userSession.userId
      } else if (userSession.role === 'OUVRIER') {
        chantiersWhere.assigneeId = userSession.userId
      }

      syncData.chantiers = await prisma.chantier.findMany({
        where: chantiersWhere,
        include: {
          client: { select: { id: true, name: true, email: true } },
          assignees: { select: { id: true, name: true } },
          etapes: {
            select: {
              id: true,
              titre: true,
              statut: true,
              dateDebut: true,
              dateFin: true,
              ordre: true
            },
            orderBy: { ordre: 'asc' }
          }
        },
        take: 50,
        orderBy: { updatedAt: 'desc' }
      })
    }

    // Synchronisation des messages
    if (dataTypes.includes('messages')) {
      const messagesWhere: any = {}
      
      if (lastSync) {
        messagesWhere.updatedAt = { gt: new Date(lastSync) }
      }

      if (userSession.role === 'CLIENT') {
        messagesWhere.chantier = { clientId: userSession.userId }
      } else if (userSession.role === 'OUVRIER') {
        messagesWhere.chantier = {
          assigneeId: userSession.userId
        }
      }

      syncData.messages = await prisma.message.findMany({
        where: messagesWhere,
        include: {
          expediteur: { select: { id: true, name: true, role: true } },
          chantier: { select: { id: true, nom: true } }
        },
        take: 100,
        orderBy: { createdAt: 'desc' }
      })
    }

    // Synchronisation des documents
    if (dataTypes.includes('documents')) {
      const documentsWhere: any = {}
      
      if (lastSync) {
        documentsWhere.updatedAt = { gt: new Date(lastSync) }
      }

      if (userSession.role === 'CLIENT') {
        documentsWhere.chantier = { clientId: userSession.userId }
      } else if (userSession.role === 'OUVRIER') {
        documentsWhere.chantier = {
          assigneeId: userSession.userId
        }
      }

      syncData.documents = await prisma.document.findMany({
        where: documentsWhere,
        select: {
          id: true,
          nom: true,
          type: true,
          taille: true,
          url: true,
          chantierId: true,
          chantier: { select: { id: true, nom: true } },
          uploader: { select: { id: true, name: true } },
          createdAt: true,
          updatedAt: true
        },
        take: 30,
        orderBy: { createdAt: 'desc' }
      })
    }

    // Synchronisation du planning
    if (dataTypes.includes('planning')) {
      const planningWhere: any = {}
      
      if (lastSync) {
        planningWhere.updatedAt = { gt: new Date(lastSync) }
      }

      // Planning pour les 30 prochains jours
      const now = new Date()
      const futureDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
      
      planningWhere.dateDebut = { gte: now, lte: futureDate }

      if (userSession.role === 'CLIENT') {
        planningWhere.chantier = { clientId: userSession.userId }
      } else if (userSession.role === 'OUVRIER') {
        planningWhere.OR = [
          { organisateurId: userSession.userId },
          { participants: { some: { id: userSession.userId } } },
          {
            chantier: {
              assigneeId: userSession.userId
            }
          }
        ]
      }

      syncData.planning = await prisma.planning.findMany({
        where: planningWhere,
        include: {
          chantier: { select: { id: true, nom: true } },
          organisateur: { select: { id: true, name: true } },
          participants: { select: { id: true, name: true } }
        },
        orderBy: { dateDebut: 'asc' }
      })
    }

    // Données utilisateur et équipes
    if (dataTypes.includes('users')) {
      // Retourner les utilisateurs de l'entreprise
      syncData.users = await prisma.user.findMany({
        where: {
          company: userSession.permissions.includes('*') ? undefined : 
                  await getUserCompany(userSession.userId)
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          phone: true,
          company: true
        },
        take: 100
      })
    }

    // Mettre à jour la session mobile
    await prisma.mobileSession.updateMany({
      where: {
        userId: userSession.userId,
        deviceId: userSession.deviceId
      },
      data: {
        lastActivity: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      data: syncData,
      syncTimestamp,
      counts: {
        chantiers: syncData.chantiers?.length || 0,
        messages: syncData.messages?.length || 0,
        documents: syncData.documents?.length || 0,
        planning: syncData.planning?.length || 0,
        users: syncData.users?.length || 0
      }
    })

  } catch (error) {
    console.error('Erreur synchronisation mobile:', error)
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

    const body = await request.json()
    const { batchActions } = body

    const results: any = {
      chantiers: [],
      messages: [],
      documents: [],
      planning: [],
      errors: []
    }

    // Traiter toutes les actions par lot
    for (const batch of batchActions) {
      const { type, actions } = batch

      try {
        switch (type) {
          case 'chantiers':
            for (const action of actions) {
              const result = await processChantierAction(action, userSession)
              results.chantiers.push(result)
            }
            break

          case 'messages':
            for (const action of actions) {
              const result = await processMessageAction(action, userSession)
              results.messages.push(result)
            }
            break

          case 'documents':
            for (const action of actions) {
              const result = await processDocumentAction(action, userSession)
              results.documents.push(result)
            }
            break

          case 'planning':
            for (const action of actions) {
              const result = await processPlanningAction(action, userSession)
              results.planning.push(result)
            }
            break

          default:
            results.errors.push({
              type,
              error: 'Type d\'action non supporté'
            })
        }
      } catch (batchError) {
        console.error(`Erreur batch ${type}:`, batchError)
        results.errors.push({
          type,
          error: 'Erreur de traitement du lot'
        })
      }
    }

    return NextResponse.json({
      success: true,
      results,
      syncTimestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Erreur synchronisation mobile POST:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

// Fonctions utilitaires pour traiter les actions
async function processChantierAction(action: any, userSession: any) {
  // Logique similaire aux endpoints spécifiques
  // Simplifié pour l'exemple
  return { id: action.id, success: true, type: 'chantier' }
}

async function processMessageAction(action: any, userSession: any) {
  return { id: action.id, success: true, type: 'message' }
}

async function processDocumentAction(action: any, userSession: any) {
  return { id: action.id, success: true, type: 'document' }
}

async function processPlanningAction(action: any, userSession: any) {
  return { id: action.id, success: true, type: 'planning' }
}

async function getUserCompany(userId: string): Promise<string | undefined> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { company: true }
  })
  return user?.company || undefined
}