import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const page = parseInt(searchParams.get('page') || '1');
    const offset = (page - 1) * limit;

    const [messages, total] = await Promise.all([
      db.message.findMany({
        where: { chantierId: id },
        include: {
          expediteur: {
            select: { id: true, name: true, role: true }
          }
        },
        orderBy: { createdAt: 'asc' },
        take: limit,
        skip: offset
      }),
      db.message.count({
        where: { chantierId: id }
      })
    ]);

    // Format attendu par le hook useMessages
    const formattedMessages = messages.map(message => ({
      id: message.id,
      expediteur: message.expediteur,
      message: message.message,
      photos: message.photos,
      createdAt: message.createdAt.toISOString(),
      lu: message.lu,
      chantierId: message.chantierId,
      parentId: message.threadId,
      reactions: Array.isArray(message.reactions) ? message.reactions : []
    }));

    return NextResponse.json({
      messages: formattedMessages, // ← IMPORTANT: wrapper dans "messages"
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      success: true,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erreur API messages chantier:', error);
    return NextResponse.json({ 
      error: 'Erreur serveur',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 });
  }
}