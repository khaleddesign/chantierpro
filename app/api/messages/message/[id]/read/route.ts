import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const message = await db.message.update({
      where: { id },
      data: { lu: true },
      include: {
        expediteur: {
          select: { id: true, name: true, role: true }
        }
      }
    });

    return NextResponse.json(message);

  } catch (error) {
    console.error('Erreur marquer message lu:', error);
    return NextResponse.json({ error: 'Message introuvable' }, { status: 404 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { chantierId, userId } = data;

    if (!chantierId || !userId) {
      return NextResponse.json({ error: 'chantierId et userId requis' }, { status: 400 });
    }

    const result = await db.message.updateMany({
      where: {
        chantierId,
        expediteurId: { not: userId },
        lu: false
      },
      data: { lu: true }
    });

    return NextResponse.json({ 
      message: 'Messages marqués comme lus',
      updated: result.count 
    });

  } catch (error) {
    console.error('Erreur marquer messages lus:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
