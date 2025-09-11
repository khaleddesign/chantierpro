import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Générer un secret pour l'utilisateur
    const secret = speakeasy.generateSecret({
      name: `ChantierPro (${session.user.email})`,
      issuer: 'ChantierPro',
      length: 32
    });

    // Générer le QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);

    // Sauvegarder le secret temporairement (sera confirmé lors de la vérification)
    await prisma.user.update({
      where: { id: session.user.id },
      data: { 
        twoFactorSecret: secret.base32,
        // Ne pas activer la 2FA tant qu'elle n'est pas vérifiée
        twoFactorEnabled: false
      }
    });

    return NextResponse.json({
      secret: secret.base32,
      qrCode: qrCodeUrl,
      manualEntryKey: secret.base32,
      instructions: {
        step1: "Scannez le QR code avec votre application d'authentification (Google Authenticator, Authy, etc.)",
        step2: "Ou entrez manuellement cette clé : " + secret.base32,
        step3: "Entrez le code à 6 chiffres généré par votre application pour confirmer"
      }
    });

  } catch (error) {
    console.error('Erreur setup 2FA:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la configuration 2FA' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Vérifier le statut 2FA de l'utilisateur
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { 
        twoFactorEnabled: true,
        twoFactorSecret: true
      }
    });

    return NextResponse.json({
      enabled: user?.twoFactorEnabled || false,
      configured: !!user?.twoFactorSecret
    });

  } catch (error) {
    console.error('Erreur get 2FA status:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération du statut 2FA' },
      { status: 500 }
    );
  }
}