import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const tache = await db.tacheProjet.findUnique({
      where: { id },
      include: {
        projet: true,
        assignations: {
          include: { user: true }
        }
      }
    });

    if (!tache) {
      return NextResponse.json({ error: 'Tâche non trouvée' }, { status: 404 });
    }

    return NextResponse.json(tache);
  } catch (error) {
    console.error('Erreur tâche:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const updates = await request.json();
    
    const tache = await db.tacheProjet.update({
      where: { id },
      data: updates,
      include: {
        projet: true,
        assignations: {
          include: { user: true }
        }
      }
    });

    return NextResponse.json(tache);
  } catch (error) {
    console.error('Erreur mise à jour tâche:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await db.tacheProjet.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur suppression tâche:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
