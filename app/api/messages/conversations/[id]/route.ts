import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Récupérer les messages d'une conversation spécifique
export async function GET(
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
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Extraire les IDs des participants de l'ID de conversation
    const participantIds = conversationId.split('-').filter(id => id.length > 0);
    
    // Si l'ID de conversation ne suit pas le format user1-user2, 
    // considérer que c'est une conversation directe avec tous les users connectés
    let otherUserId: string;
    
    if (participantIds.length >= 2 && participantIds.includes(session.user.id)) {
      otherUserId = participantIds.find(id => id !== session.user.id) || '';
    } else {
      // Fallback: utiliser le premier utilisateur différent trouvé dans les messages
      const firstMessage = await prisma.message.findFirst({
        where: {
          OR: [
            { expediteurId: session.user.id },
            { destinataireId: session.user.id }
          ]
        },
        include: {
          expediteur: { select: { id: true, name: true, image: true } }
        }
      });
      
      if (!firstMessage) {
        return NextResponse.json({ messages: [] }, { status: 200 });
      }
      
      otherUserId = firstMessage.expediteurId === session.user.id 
        ? firstMessage.destinataireId || ''
        : firstMessage.expediteurId;
    }

    if (!otherUserId) {
      return NextResponse.json({ error: 'Conversation invalide' }, { status: 400 });
    }

    const skip = (page - 1) * limit;

    // Récupérer les messages de la conversation
    const messages = await prisma.message.findMany({
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
      include: {
        expediteur: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        },
        chantier: {
          select: {
            id: true,
            nom: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      },
      skip,
      take: limit
    });

    // Marquer les messages comme lus
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

    const totalCount = await prisma.message.count({
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
      }
    });

    return NextResponse.json({
      messages,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération de la conversation:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// POST - Envoyer un message dans une conversation
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
    const body = await request.json();
    const { message, chantierId } = body;

    if (!message?.trim()) {
      return NextResponse.json(
        { error: 'Message requis' },
        { status: 400 }
      );
    }

    // Extraire les IDs des participants
    const participantIds = conversationId.split('-');
    
    if (!participantIds.includes(session.user.id)) {
      return NextResponse.json({ error: 'Accès interdit' }, { status: 403 });
    }

    const destinataireId = participantIds.find(id => id !== session.user.id);

    if (!destinataireId) {
      return NextResponse.json({ error: 'Destinataire invalide' }, { status: 400 });
    }

    // Créer le message
    const nouveauMessage = await prisma.message.create({
      data: {
        expediteurId: session.user.id,
        destinataireId,
        message: message.trim(),
        chantierId: chantierId || null,
        typeMessage: 'DIRECT',
        lu: false
      },
      include: {
        expediteur: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        },
        chantier: {
          select: {
            id: true,
            nom: true
          }
        }
      }
    });

    // Créer une notification pour le destinataire
    await prisma.notification.create({
      data: {
        userId: destinataireId,
        titre: 'Nouveau message',
        message: `${session.user.name} vous a envoyé un message`,
        type: 'INFO',
        lien: `/dashboard/messages`
      }
    });

    return NextResponse.json(nouveauMessage, { status: 201 });

  } catch (error) {
    console.error('Erreur lors de l\'envoi du message:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer une conversation (tous les messages)
export async function DELETE(
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

    // Supprimer tous les messages de cette conversation
    await prisma.message.deleteMany({
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
      }
    });

    return NextResponse.json({ success: true, message: 'Conversation supprimée' });

  } catch (error) {
    console.error('Erreur lors de la suppression de la conversation:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}