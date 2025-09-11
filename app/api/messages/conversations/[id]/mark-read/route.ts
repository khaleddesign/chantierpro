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

    // Marquer tous les messages reçus dans cette conversation comme lus
    await prisma.message.updateMany({
      where: {
        expediteurId: otherUserId,
        destinataireId: session.user.id,
        lu: false
      },
      data: {
        lu: true
      }
    });

    return NextResponse.json({ success: true, message: 'Messages marqués comme lus' });

  } catch (error) {
    console.error('Erreur lors du marquage comme lu:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}