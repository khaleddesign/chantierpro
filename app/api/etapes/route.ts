import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { Prisma, EtapeStatus } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const chantierId = searchParams.get('chantierId');
    
    if (!chantierId) {
      return NextResponse.json({ error: 'chantierId requis' }, { status: 400 });
    }

    const etapes = await prisma.etapeChantier.findMany({
      where: { chantierId },
      include: {
        createdBy: {
          select: { id: true, name: true, role: true }
        }
      },
      orderBy: [
        { dateDebut: 'asc' },
        { ordre: 'asc' }
      ]
    });

    return NextResponse.json({ etapes });

  } catch (error) {
    console.error('Erreur API etapes GET:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const data = await request.json();
    
    const required = ['titre', 'dateDebut', 'dateFin', 'chantierId'];
    for (const field of required) {
      if (!data[field]) {
        return NextResponse.json({ error: `Le champ ${field} est requis` }, { status: 400 });
      }
    }

    const dateDebut = new Date(data.dateDebut);
    const dateFin = new Date(data.dateFin);
    
    if (isNaN(dateDebut.getTime()) || isNaN(dateFin.getTime())) {
      return NextResponse.json({ error: 'Dates invalides' }, { status: 400 });
    }

    if (dateFin <= dateDebut) {
      return NextResponse.json({ error: 'La date de fin doit être après la date de début' }, { status: 400 });
    }

    const chantier = await prisma.chantier.findUnique({
      where: { id: data.chantierId },
      select: { id: true }
    });

    if (!chantier) {
      return NextResponse.json({ error: 'Chantier introuvable' }, { status: 404 });
    }

    const etape = await prisma.etapeChantier.create({
      data: {
        titre: data.titre,
        description: data.description || null,
        dateDebut: dateDebut,
        dateFin: dateFin,
        statut: data.statut || 'A_FAIRE',
        ordre: data.ordre || 0,
        chantierId: data.chantierId,
        createdById: session.user.id
      },
      include: {
        createdBy: {
          select: { id: true, name: true, role: true }
        }
      }
    });

    return NextResponse.json(etape, { status: 201 });

  } catch (error) {
    console.error('Erreur création etape:', error);
    return NextResponse.json({ error: 'Erreur lors de la création de l\'étape' }, { status: 500 });
  }
}
