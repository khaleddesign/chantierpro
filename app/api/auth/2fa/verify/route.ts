import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import speakeasy from 'speakeasy';
import crypto from 'crypto';

// Générer des codes de backup
function generateBackupCodes(): string[] {
  const codes = [];
  for (let i = 0; i < 10; i++) {
    const code = crypto.randomBytes(4).toString('hex').toUpperCase();
    codes.push(code.slice(0, 4) + '-' + code.slice(4));
  }
  return codes;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const body = await request.json();
    const { code, action = 'enable' } = body;

    if (!code) {
      return NextResponse.json({ error: 'Code requis' }, { status: 400 });
    }

    // Récupérer l'utilisateur avec son secret 2FA
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { 
        twoFactorSecret: true,
        twoFactorEnabled: true,
        backupCodes: true
      }
    });

    if (!user?.twoFactorSecret) {
      return NextResponse.json(
        { error: 'Configuration 2FA requise. Appelez d\'abord /setup' },
        { status: 400 }
      );
    }

    let isValidCode = false;

    // Vérifier si c'est un code TOTP
    const totpResult = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: code,
      window: 2 // Permet une certaine tolérance temporelle
    });
    isValidCode = Boolean(totpResult);

    // Si le code TOTP n'est pas valide, vérifier les codes de backup
    if (!isValidCode && user.backupCodes) {
      try {
        const backupCodes = JSON.parse(user.backupCodes);
        const codeIndex = backupCodes.indexOf(code.toUpperCase());
        
        if (codeIndex !== -1) {
          isValidCode = true;
          // Retirer le code utilisé de la liste
          backupCodes.splice(codeIndex, 1);
          
          await prisma.user.update({
            where: { id: session.user.id },
            data: { backupCodes: JSON.stringify(backupCodes) }
          });
        }
      } catch (parseError) {
        console.error('Erreur parsing backup codes:', parseError);
      }
    }

    if (!isValidCode) {
      return NextResponse.json(
        { error: 'Code invalide' },
        { status: 400 }
      );
    }

    if (action === 'enable') {
      // Activer la 2FA et générer des codes de backup
      const backupCodes = generateBackupCodes();
      
      await prisma.user.update({
        where: { id: session.user.id },
        data: { 
          twoFactorEnabled: true,
          backupCodes: JSON.stringify(backupCodes)
        }
      });

      return NextResponse.json({
        success: true,
        message: '2FA activée avec succès',
        backupCodes,
        warning: 'Sauvegardez ces codes de backup dans un endroit sûr. Ils ne seront plus affichés.'
      });

    } else if (action === 'disable') {
      // Désactiver la 2FA
      await prisma.user.update({
        where: { id: session.user.id },
        data: { 
          twoFactorEnabled: false,
          twoFactorSecret: null,
          backupCodes: null
        }
      });

      return NextResponse.json({
        success: true,
        message: '2FA désactivée avec succès'
      });

    } else if (action === 'verify-login') {
      // Vérification lors de la connexion
      if (!user.twoFactorEnabled) {
        return NextResponse.json(
          { error: '2FA non activée pour cet utilisateur' },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Code 2FA vérifié'
      });
    }

    return NextResponse.json(
      { error: 'Action non reconnue' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Erreur vérification 2FA:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la vérification 2FA' },
      { status: 500 }
    );
  }
}