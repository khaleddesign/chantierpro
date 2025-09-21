import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Récupérer toutes les conversations de l'utilisateur
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';

    const skip = (page - 1) * limit;

    // Récupérer les messages de l'utilisateur avec pagination
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { expediteurId: session.user.id },
          { destinataireId: session.user.id }
        ],
        AND: search ? {
          message: {
            contains: search
          }
        } : {}
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
        createdAt: 'desc'
      },
      skip,
      take: limit
    });

    // Grouper les messages par conversation
    const conversations = new Map();
    
    messages.forEach(message => {
      const otherUserId = message.expediteurId === session.user.id 
        ? message.destinataireId 
        : message.expediteurId;
      
      const conversationId = [session.user.id, otherUserId].sort().join('-');
      
      if (!conversations.has(conversationId)) {
        conversations.set(conversationId, {
          id: conversationId,
          participants: [
            {
              id: session.user.id,
              name: session.user.name,
              image: session.user.image
            }
          ],
          lastMessage: {
            content: message.message,
            createdAt: message.createdAt.toISOString(),
            sender: message.expediteurId
          },
          unreadCount: 0,
          chantier: message.chantier
        });
      }
    });

    // Compter les messages non lus pour chaque conversation
    for (let [conversationId, conversation] of conversations) {
      const otherUserId = conversationId.split('-').find((id: string) => id !== session.user.id);
      if (!otherUserId) continue;
      const unreadCount = await prisma.message.count({
        where: {
          expediteurId: otherUserId,
          destinataireId: session.user.id,
          lu: false
        }
      });
      conversation.unreadCount = unreadCount;
    }

    const totalCount = await prisma.message.count({
      where: {
        OR: [
          { expediteurId: session.user.id },
          { destinataireId: session.user.id }
        ]
      }
    });

    return NextResponse.json({
      conversations: Array.from(conversations.values()),
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des messages:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// POST - Envoyer un nouveau message de chantier
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { chantierId, message, photos, destinataireId } = await request.json();
    
    // Pour les messages directs, destinataireId est requis au lieu de chantierId
    if (!chantierId && !destinataireId) {
      return NextResponse.json({ error: 'chantierId ou destinataireId requis' }, { status: 400 });
    }

    if (!message?.trim() && (!photos || photos.length === 0)) {
      return NextResponse.json({ error: 'Message ou photos requis' }, { status: 400 });
    }

    // Logique différente selon le type de message
    let messageData;
    
    if (chantierId) {
      // Message de chantier
      const chantier = await prisma.chantier.findFirst({
        where: {
          id: chantierId,
          OR: [
            { clientId: session.user.id },
            { assignees: { some: { id: session.user.id } } }
          ]
        }
      });

      if (!chantier && !['ADMIN', 'COMMERCIAL'].includes(session.user.role)) {
        return NextResponse.json({ error: 'Chantier introuvable ou accès refusé' }, { status: 404 });
      }

      messageData = await prisma.message.create({
        data: {
          chantierId,
          message: message?.trim() || '',
          photos: photos ? JSON.stringify(photos) : null,
          expediteurId: session.user.id,
          typeMessage: 'CHANTIER',
        },
        include: {
          expediteur: {
            select: {
              id: true,
              name: true,
              role: true,
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
    } else {
      // Message direct
      if (!destinataireId) {
        return NextResponse.json({ error: 'destinataireId requis pour les messages directs' }, { status: 400 });
      }

      // Vérifier que le destinataire existe
      const destinataire = await prisma.user.findUnique({
        where: { id: destinataireId }
      });

      if (!destinataire) {
        return NextResponse.json({ error: 'Destinataire introuvable' }, { status: 404 });
      }

      messageData = await prisma.message.create({
        data: {
          destinataireId,
          message: message?.trim() || '',
          photos: photos ? JSON.stringify(photos) : null,
          expediteurId: session.user.id,
          typeMessage: 'DIRECT',
          lu: false
        },
        include: {
          expediteur: {
            select: {
              id: true,
              name: true,
              role: true,
            }
          },
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
    }

    return NextResponse.json({
      ...messageData,
      photos: messageData.photos ? JSON.parse(messageData.photos) : []
    }, { status: 201 });

  } catch (error) {
    console.error('Erreur création message:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}