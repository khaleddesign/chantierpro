import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const conversationId = searchParams.get('conversationId');
    
    if (!userId || !conversationId) {
      return NextResponse.json({ 
        error: 'userId et conversationId requis' 
      }, { status: 400 });
    }

    // Reste du code identique...
    let messages = [
      {
        id: '1',
        content: 'Message de test',
        senderId: 'test',
        senderName: 'Test User',
        timestamp: '14:20',
        type: 'text',
        photos: []
      }
    ];

    return NextResponse.json({
      messages,
      success: true,
      conversationId,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erreur API messages conversation:', error);
    return NextResponse.json({
      error: 'Erreur lors du chargement des messages'
    }, { status: 500 });
  }
}
