import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const etape = await prisma.etapeChantier.findUnique({
      where: { id },
      include: {
        chantier: {
          select: { id: true, nom: true }
        },
        createdBy: {
          select: { id: true, name: true, role: true }
        }
      }
    });

    if (!etape) {
      return NextResponse.json({ error: 'Étape introuvable' }, { status: 404 });
    }

    return NextResponse.json(etape);

  } catch (error) {
    console.error('Erreur API etape GET:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const data = await request.json();
    
    const etape = await prisma.etapeChantier.findUnique({
      where: { id },
      select: { id: true, chantierId: true }
    });

    if (!etape) {
      return NextResponse.json({ error: 'Étape introuvable' }, { status: 404 });
    }

    const updateData: any = {};

    if (data.titre !== undefined) updateData.titre = data.titre;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.statut !== undefined) updateData.statut = data.statut;
    if (data.ordre !== undefined) updateData.ordre = data.ordre;

    if (data.dateDebut !== undefined) {
      const dateDebut = new Date(data.dateDebut);
      if (isNaN(dateDebut.getTime())) {
        return NextResponse.json({ error: 'Date de début invalide' }, { status: 400 });
      }
      updateData.dateDebut = dateDebut;
    }

    if (data.dateFin !== undefined) {
      const dateFin = new Date(data.dateFin);
      if (isNaN(dateFin.getTime())) {
        return NextResponse.json({ error: 'Date de fin invalide' }, { status: 400 });
      }
      updateData.dateFin = dateFin;
    }

    if (updateData.dateDebut && updateData.dateFin && updateData.dateFin <= updateData.dateDebut) {
      return NextResponse.json({ error: 'La date de fin doit être après la date de début' }, { status: 400 });
    }

    const updatedEtape = await prisma.etapeChantier.update({
      where: { id },
      data: updateData,
      include: {
        createdBy: {
          select: { id: true, name: true, role: true }
        }
      }
    });

    return NextResponse.json(updatedEtape);

  } catch (error) {
    console.error('Erreur modification etape:', error);
    return NextResponse.json({ error: 'Erreur lors de la modification' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const etape = await prisma.etapeChantier.findUnique({
      where: { id },
      select: { id: true }
    });

    if (!etape) {
      return NextResponse.json({ error: 'Étape introuvable' }, { status: 404 });
    }

    await prisma.etapeChantier.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Erreur suppression etape:', error);
    return NextResponse.json({ error: 'Erreur lors de la suppression' }, { status: 500 });
  }
}
