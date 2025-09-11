import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { mobileJWT } from '@/lib/auth/mobile-jwt'
import bcrypt from 'bcrypt'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  deviceId: z.string().min(1),
  deviceInfo: z.object({
    platform: z.string(),
    version: z.string(), 
    userAgent: z.string()
  })
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = loginSchema.parse(body)

    const user = await prisma.user.findUnique({
      where: { email: validatedData.email }
    })

    if (!user || !user.password) {
      return NextResponse.json(
        { error: 'Identifiants invalides' },
        { status: 401 }
      )
    }

    const isPasswordValid = await bcrypt.compare(
      validatedData.password,
      user.password
    )

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Identifiants invalides' },
        { status: 401 }
      )
    }

    const tokens = await mobileJWT.createMobileSession(
      user.id,
      user.email,
      user.role,
      validatedData.deviceId,
      validatedData.deviceInfo
    )

    // Enregistrer la session mobile dans la DB
    await prisma.mobileSession.create({
      data: {
        userId: user.id,
        deviceId: validatedData.deviceId,
        devicePlatform: validatedData.deviceInfo.platform,
        deviceVersion: validatedData.deviceInfo.version,
        userAgent: validatedData.deviceInfo.userAgent,
        lastActivity: new Date(),
        isActive: true
      }
    })

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        company: user.company
      },
      tokens,
      message: 'Connexion mobile réussie'
    })

  } catch (error) {
    console.error('Erreur login mobile:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}