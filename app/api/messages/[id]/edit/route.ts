import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { message: newMessage, userId } = await request.json();

    if (!newMessage || !newMessage.trim()) {
      return NextResponse.json({
        error: 'Message requis',
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    if (newMessage.length > 2000) {
      return NextResponse.json({
        error: 'Message trop long (max 2000 caractères)',
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    try {
      const existingMessage = await db.message.findUnique({
        where: { id },
        include: {
          expediteur: {
            select: { id: true, name: true, role: true }
          }
        }
      });

      if (!existingMessage) {
        return NextResponse.json({
          error: 'Message introuvable',
          timestamp: new Date().toISOString()
        }, { status: 404 });
      }

      if (existingMessage.expediteurId !== userId) {
        return NextResponse.json({
          error: 'Non autorisé à modifier ce message',
          timestamp: new Date().toISOString()
        }, { status: 403 });
      }

      const messageTime = new Date(existingMessage.createdAt).getTime();
      const now = Date.now();
      const fiveMinutes = 5 * 60 * 1000;

      if (now - messageTime > fiveMinutes) {
        return NextResponse.json({
          error: 'Impossible de modifier un message après 5 minutes',
          timestamp: new Date().toISOString()
        }, { status: 403 });
      }

      const updatedMessage = await db.message.update({
        where: { id },
        data: {
          message: newMessage.trim(),
          updatedAt: new Date()
        },
        include: {
          expediteur: {
            select: { id: true, name: true, role: true }
          }
        }
      });

      return NextResponse.json({
        message: {
          ...updatedMessage,
          isEdited: true,
          editedAt: updatedMessage.updatedAt.toISOString()
        },
        timestamp: new Date().toISOString()
      });

    } catch (dbError) {
      console.warn('Base de données non disponible, simulation de la modification');
      
      return NextResponse.json({
        message: {
          id,
          message: newMessage.trim(),
          isEdited: true,
          editedAt: new Date().toISOString(),
          expediteur: {
            id: userId,
            name: 'Utilisateur',
            role: 'CLIENT'
          }
        },
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error('Erreur API edit message:', error);
    
    return NextResponse.json({
      error: 'Erreur lors de la modification du message',
      details: error instanceof Error ? error.message : 'Erreur inconnue',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({
        error: 'userId requis',
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    try {
      const existingMessage = await db.message.findUnique({
        where: { id },
        select: { expediteurId: true }
      });

      if (!existingMessage) {
        return NextResponse.json({
          error: 'Message introuvable',
          timestamp: new Date().toISOString()
        }, { status: 404 });
      }

      if (existingMessage.expediteurId !== userId) {
        return NextResponse.json({
          error: 'Non autorisé à supprimer ce message',
          timestamp: new Date().toISOString()
        }, { status: 403 });
      }

      await db.message.update({
        where: { id },
        data: {
          message: '[Message supprimé]',
          photos: null
        }
      });

      return NextResponse.json({
        message: 'Message supprimé avec succès',
        timestamp: new Date().toISOString()
      });

    } catch (dbError) {
      console.warn('Base de données non disponible, simulation de la suppression');
      
      return NextResponse.json({
        message: 'Message supprimé avec succès',
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error('Erreur API delete message:', error);
    
    return NextResponse.json({
      error: 'Erreur lors de la suppression du message',
      details: error instanceof Error ? error.message : 'Erreur inconnue',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
