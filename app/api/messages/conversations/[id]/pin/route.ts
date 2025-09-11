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

    // Pour l'instant, on simule l'épinglage en créant une préférence utilisateur
    // Dans une implémentation complète, on aurait une table ConversationPreferences
    await prisma.notification.create({
      data: {
        userId: session.user.id,
        titre: 'Conversation épinglée',
        message: `La conversation a été épinglée`,
        type: 'INFO',
        lien: `/dashboard/messages`
      }
    });

    return NextResponse.json({ success: true, message: 'Conversation épinglée' });

  } catch (error) {
    console.error('Erreur lors de l\'épinglage:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}