import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Prisma, PlanningType } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const dateDebut = searchParams.get('dateDebut');
    const dateFin = searchParams.get('dateFin');
    const chantierId = searchParams.get('chantierId');
    const userId = searchParams.get('userId');
    const type = searchParams.get('type');

    const where: Prisma.PlanningWhereInput = {};
    
    if (dateDebut && dateFin) {
      where.OR = [
        {
          dateDebut: {
            gte: new Date(dateDebut),
            lte: new Date(dateFin)
          }
        },
        {
          dateFin: {
            gte: new Date(dateDebut),
            lte: new Date(dateFin)
          }
        }
      ];
    }

    if (chantierId) {
      where.chantierId = chantierId;
    }

    if (userId) {
      if (where.OR) {
        where.AND = [
          { OR: where.OR },
          {
            OR: [
              { organisateurId: userId },
              { participants: { some: { id: userId } } }
            ]
          }
        ];
        delete where.OR;
      } else {
        where.OR = [
          { organisateurId: userId },
          { participants: { some: { id: userId } } }
        ];
      }
    }

    if (type && type !== 'TOUS') {
      where.type = type as PlanningType;
    }

    const plannings = await prisma.planning.findMany({
      where,
      include: {
        organisateur: {
          select: { id: true, name: true, role: true }
        },
        participants: {
          select: { id: true, name: true, role: true }
        },
        chantier: {
          select: { id: true, nom: true }
        }
      },
      orderBy: { dateDebut: 'asc' }
    });

    return NextResponse.json({
      plannings,
      success: true
    });

  } catch (error) {
    console.error('Erreur API planning:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const data = await request.json();
    
    const required = ['titre', 'dateDebut', 'dateFin', 'organisateurId', 'type'];
    for (const field of required) {
      if (!data[field]) {
        return NextResponse.json({ error: `Le champ ${field} est requis` }, { status: 400 });
      }
    }

    console.log('=== POST /api/planning - Données reçues ===');
    console.log('Data:', JSON.stringify(data, null, 2));
    console.log('Session user:', session.user);

    const planning = await prisma.planning.create({
      data: {
        titre: data.titre,
        description: data.description || null,
        type: data.type,
        dateDebut: new Date(data.dateDebut),
        dateFin: new Date(data.dateFin),
        chantierId: data.chantierId || null,
        organisateurId: data.organisateurId,
        lieu: data.lieu || null,
        notes: data.notes || null,
        recurrence: data.recurrence ? JSON.stringify(data.recurrence) : null,
        participants: data.participantIds ? {
          connect: data.participantIds.map((id: string) => ({ id }))
        } : undefined
      },
      include: {
        organisateur: {
          select: { id: true, name: true, role: true }
        },
        participants: {
          select: { id: true, name: true, role: true }
        },
        chantier: {
          select: { id: true, nom: true }
        }
      }
    });

    console.log('Planning créé avec succès:', planning);
    return NextResponse.json(planning, { status: 201 });

  } catch (error) {
    console.error('Erreur création planning:', error);
    return NextResponse.json({ error: 'Erreur lors de la création' }, { status: 500 });
  }
}
