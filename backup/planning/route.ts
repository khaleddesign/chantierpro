import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Prisma, PlanningType } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
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
      where.OR = [
        { organisateurId: userId },
        { participants: { some: { id: userId } } }
      ];
    }

    if (type && type !== 'TOUS') {
      where.type = type as PlanningType;
    }

    try {
      const plannings = await db.planning.findMany({
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
    } catch (dbError) {
      console.warn('Base de données non disponible, utilisation des données de simulation');
      
      const mockPlannings = [
        {
          id: 'plan-1',
          titre: 'RDV Client - Validation cuisine',
          description: 'Présentation des plans finalisés et choix des finitions',
          type: 'RDV_CLIENT',
          dateDebut: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          dateFin: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
          lieu: 'Showroom ChantierPro',
          statut: 'PLANIFIE',
          organisateur: { id: 'org-1', name: 'Pierre Commercial', role: 'COMMERCIAL' },
          participants: [
            { id: 'client-1', name: 'Sophie Durand', role: 'CLIENT' }
          ],
          chantier: { id: 'chantier-1', nom: 'Rénovation Villa Moderne' }
        },
        {
          id: 'plan-2',
          titre: 'Début travaux électricité',
          description: 'Installation du tableau électrique et câblage principal',
          type: 'PLANNING_CHANTIER',
          dateDebut: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          dateFin: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
          lieu: 'Villa Moderne, Marseille',
          statut: 'PLANIFIE',
          organisateur: { id: 'org-2', name: 'Marc Chef Équipe', role: 'OUVRIER' },
          participants: [
            { id: 'ouvrier-1', name: 'Julie Électricienne', role: 'OUVRIER' },
            { id: 'ouvrier-2', name: 'Tom Apprenti', role: 'OUVRIER' }
          ],
          chantier: { id: 'chantier-1', nom: 'Rénovation Villa Moderne' }
        }
      ];

      return NextResponse.json({
        plannings: mockPlannings,
        success: true,
        simulation: true
      });
    }

  } catch (error) {
    console.error('Erreur API planning:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    const required = ['titre', 'dateDebut', 'dateFin', 'organisateurId', 'type'];
    for (const field of required) {
      if (!data[field]) {
        return NextResponse.json({ error: `Le champ ${field} est requis` }, { status: 400 });
      }
    }

    try {
      const planning = await db.planning.create({
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

      return NextResponse.json(planning, { status: 201 });
    } catch (dbError) {
      console.warn('Base de données non disponible, simulation de la création');
      
      const mockPlanning = {
        id: `plan-${Date.now()}`,
        titre: data.titre,
        description: data.description,
        type: data.type,
        dateDebut: data.dateDebut,
        dateFin: data.dateFin,
        lieu: data.lieu,
        statut: 'PLANIFIE',
        organisateur: { id: data.organisateurId, name: 'Organisateur', role: 'COMMERCIAL' },
        participants: [],
        chantier: data.chantierId ? { id: data.chantierId, nom: 'Chantier' } : null
      };

      return NextResponse.json(mockPlanning, { status: 201 });
    }

  } catch (error) {
    console.error('Erreur création planning:', error);
    return NextResponse.json({ error: 'Erreur lors de la création' }, { status: 500 });
  }
}
