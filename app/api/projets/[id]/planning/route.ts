import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const projet = await prisma.projet.findUnique({
      where: { id },
      include: {
        taches: {
          include: {
            assignations: {
              include: { user: true }
            }
          }
        }
      }
    });

    if (!projet) {
      return NextResponse.json({ error: 'Projet non trouvé' }, { status: 404 });
    }

    const stats = {
      totalTaches: projet.taches.length,
      tachesTerminees: projet.taches.filter(t => t.statut === 'TERMINE').length,
      tachesEnCours: projet.taches.filter(t => t.statut === 'EN_COURS').length,
      tachesEnRetard: projet.taches.filter(t => 
        t.statut !== 'TERMINE' && new Date(t.dateFin) < new Date()
      ).length,
      avancement: projet.taches.length > 0 
        ? Math.round((projet.taches.filter(t => t.statut === 'TERMINE').length / projet.taches.length) * 100)
        : 0
    };

    return NextResponse.json({ projet, stats });
  } catch (error) {
    console.error('Erreur planning:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
