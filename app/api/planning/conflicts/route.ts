import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { dateDebut, dateFin, participantIds, excludeId } = await request.json();

    if (!dateDebut || !dateFin || !participantIds?.length) {
      return NextResponse.json({ conflicts: [] });
    }

    try {
      const conflicts = await db.planning.findMany({
        where: {
          AND: [
            excludeId ? { NOT: { id: excludeId } } : {},
            {
              OR: [
                { organisateurId: { in: participantIds } },
                { participants: { some: { id: { in: participantIds } } } }
              ]
            },
            {
              OR: [
                {
                  AND: [
                    { dateDebut: { lte: new Date(dateDebut) } },
                    { dateFin: { gte: new Date(dateDebut) } }
                  ]
                },
                {
                  AND: [
                    { dateDebut: { lte: new Date(dateFin) } },
                    { dateFin: { gte: new Date(dateFin) } }
                  ]
                },
                {
                  AND: [
                    { dateDebut: { gte: new Date(dateDebut) } },
                    { dateFin: { lte: new Date(dateFin) } }
                  ]
                }
              ]
            }
          ]
        },
        include: {
          organisateur: { select: { id: true, name: true } },
          participants: { select: { id: true, name: true } },
          chantier: { select: { nom: true } }
        }
      });

      return NextResponse.json({ conflicts });
    } catch (dbError) {
      console.warn('Base de données non disponible, pas de détection de conflits');
      return NextResponse.json({ conflicts: [] });
    }

  } catch (error) {
    console.error('Erreur détection conflits:', error);
    return NextResponse.json({ conflicts: [] });
  }
}
