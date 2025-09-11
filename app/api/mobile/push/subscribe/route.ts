import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { mobileJWT } from '@/lib/auth/mobile-jwt'

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
    const { subscription, userId } = body

    if (!subscription || !subscription.endpoint) {
      return NextResponse.json(
        { error: 'Abonnement push invalide' },
        { status: 400 }
      )
    }

    // Vérifier que l'utilisateur correspond
    if (userId !== userSession.userId) {
      return NextResponse.json(
        { error: 'Utilisateur non autorisé' },
        { status: 403 }
      )
    }

    // Sauvegarder l'abonnement push
    await prisma.pushSubscription.upsert({
      where: {
        userId_endpoint: {
          userId: userSession.userId,
          endpoint: subscription.endpoint
        }
      },
      update: {
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        updatedAt: new Date()
      },
      create: {
        userId: userSession.userId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        deviceId: userSession.deviceId,
        isActive: true
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Abonnement push enregistré'
    })

  } catch (error) {
    console.error('Erreur abonnement push:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userSession = await mobileJWT.validateMobileRequest(request)
    if (!userSession) {
      return NextResponse.json(
        { error: 'Token non valide' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const endpoint = searchParams.get('endpoint')

    if (!endpoint) {
      return NextResponse.json(
        { error: 'Endpoint requis' },
        { status: 400 }
      )
    }

    // Désactiver l'abonnement push
    await prisma.pushSubscription.updateMany({
      where: {
        userId: userSession.userId,
        endpoint: endpoint
      },
      data: {
        isActive: false
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Abonnement push désactivé'
    })

  } catch (error) {
    console.error('Erreur désabonnement push:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}