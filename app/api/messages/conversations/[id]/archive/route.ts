import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const conversationId = id;
    const participantIds = conversationId.split('-');
    
    if (!participantIds.includes(session.user.id)) {
      return NextResponse.json({ error: 'Accès interdit' }, { status: 403 });
    }

    const otherUserId = participantIds.find(id => id !== session.user.id);

    if (!otherUserId) {
      return NextResponse.json({ error: 'Conversation invalide' }, { status: 400 });
    }

    // Marquer tous les messages de cette conversation comme archivés pour cet utilisateur
    // Dans une implémentation complète, on aurait un champ 'archived' dans la table Message
    // Pour l'instant, on les marque comme lus
    await prisma.message.updateMany({
      where: {
        OR: [
          {
            expediteurId: session.user.id,
            destinataireId: otherUserId
          },
          {
            expediteurId: otherUserId,
            destinataireId: session.user.id
          }
        ]
      },
      data: {
        lu: true
      }
    });

    return NextResponse.json({ success: true, message: 'Conversation archivée' });

  } catch (error) {
    console.error('Erreur lors de l\'archivage:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}