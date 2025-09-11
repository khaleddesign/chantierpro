import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { chantierId, userId } = await request.json();
    
    if (!chantierId || !userId) {
      return NextResponse.json({ 
        error: 'chantierId et userId requis' 
      }, { status: 400 });
    }

    // Marquer tous les messages du chantier comme lus pour cet utilisateur
    // (sauf ceux envoyés par l'utilisateur lui-même)
    const result = await prisma.message.updateMany({
      where: {
        chantierId: chantierId,
        NOT: {
          expediteurId: userId
        },
        lu: false
      },
      data: {
        lu: true
      }
    });

    return NextResponse.json({
      success: true,
      messagesMarked: result.count,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erreur API mark-read:', error);
    return NextResponse.json({
      error: 'Erreur lors du marquage des messages comme lus',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 });
  }
}