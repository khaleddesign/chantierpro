import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: chantierId } = await params;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Vérifier l'accès au chantier
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

    const messages = await prisma.message.findMany({
      where: {
        chantierId,
        typeMessage: 'CHANTIER'
      },
      include: {
        expediteur: {
          select: {
            id: true,
            name: true,
            role: true,
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    // Parser les photos JSON pour chaque message
    const messagesWithPhotos = messages.map(message => ({
      ...message,
      photos: message.photos ? JSON.parse(message.photos) : []
    }));

    return NextResponse.json({
      messages: messagesWithPhotos
    });

  } catch (error) {
    console.error('Erreur récupération messages chantier:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: chantierId } = await params;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const data = await request.json();
    console.log('=== POST /api/chantiers/[id]/messages ===');
    console.log('Données reçues:', JSON.stringify(data, null, 2));
    console.log('Chantier ID:', chantierId);
    console.log('User:', session.user);

    // Vérifier l'accès au chantier
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

    // Validation renforcée
    if (!data.message || typeof data.message !== 'string') {
      return NextResponse.json({ error: 'Message requis' }, { status: 400 });
    }
    
    const trimmedMessage = data.message.trim();
    if (trimmedMessage.length === 0) {
      return NextResponse.json({ error: 'Message vide non autorisé' }, { status: 400 });
    }
    
    if (trimmedMessage.length > 2000) {
      return NextResponse.json({ error: 'Message trop long (max 2000 caractères)' }, { status: 400 });
    }
    
    // Échapper le HTML pour éviter XSS
    const sanitizedMessage = trimmedMessage.replace(/<[^>]*>?/gm, '');

    // Créer le message
    const newMessage = await prisma.message.create({
      data: {
        message: sanitizedMessage,
        chantierId: chantierId,
        expediteurId: session.user.id,
        typeMessage: 'CHANTIER',
        photos: data.photos ? JSON.stringify(data.photos) : null
      },
      include: {
        expediteur: {
          select: {
            id: true,
            name: true,
            role: true
          }
        }
      }
    });

    console.log('Message créé avec succès:', newMessage);

    // Parser les photos pour la réponse
    const messageWithPhotos = {
      ...newMessage,
      photos: newMessage.photos ? JSON.parse(newMessage.photos) : []
    };

    return NextResponse.json({
      message: messageWithPhotos
    }, { status: 201 });

  } catch (error) {
    console.error('Erreur création message:', error);
    return NextResponse.json({ error: 'Erreur lors de la création du message' }, { status: 500 });
  }
}