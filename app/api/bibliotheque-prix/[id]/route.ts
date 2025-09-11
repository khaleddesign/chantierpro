import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const prix = await db.bibliothequePrix.findUnique({
      where: { id }
    });

    if (!prix) {
      return NextResponse.json({ error: 'Prix introuvable' }, { status: 404 });
    }

    return NextResponse.json(prix);
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await request.json();
    
    const prixMisAJour = await db.bibliothequePrix.update({
      where: { id },
      data: {
        ...data,
        prixHT: data.prixHT ? parseFloat(data.prixHT) : undefined,
        dateMAJ: new Date()
      }
    });

    return NextResponse.json(prixMisAJour);
  } catch (error) {
    return NextResponse.json({ error: 'Erreur lors de la mise à jour' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    await db.bibliothequePrix.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Prix supprimé avec succès' });
  } catch (error) {
    return NextResponse.json({ error: 'Erreur lors de la suppression' }, { status: 500 });
  }
}
