import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    try {
      const planning = await db.planning.findUnique({
        where: { id },
        include: {
          organisateur: {
            select: { id: true, name: true, role: true, email: true }
          },
          participants: {
            select: { id: true, name: true, role: true, email: true }
          },
          chantier: {
            select: { id: true, nom: true, adresse: true }
          }
        }
      });

      if (!planning) {
        return NextResponse.json({ error: 'Planning introuvable' }, { status: 404 });
      }

      return NextResponse.json(planning);
    } catch (dbError) {
      console.warn('Base de données non disponible, simulation des données');
      
      const mockPlanning = {
        id,
        titre: 'RDV Client - Validation finale',
        description: 'Rencontre pour valider les derniers détails du projet',
        type: 'RDV_CLIENT',
        dateDebut: new Date().toISOString(),
        dateFin: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        lieu: 'Showroom ChantierPro',
        statut: 'PLANIFIE',
        notes: 'Prévoir les échantillons de matériaux',
        organisateur: {
          id: 'org-1',
          name: 'Pierre Commercial',
          role: 'COMMERCIAL',
          email: 'pierre@chantierpro.fr'
        },
        participants: [
          {
            id: 'client-1',
            name: 'Sophie Durand',
            role: 'CLIENT',
            email: 'sophie.durand@email.com'
          }
        ],
        chantier: {
          id: 'chantier-1',
          nom: 'Rénovation Villa Moderne',
          adresse: '123 Avenue des Oliviers, Marseille'
        }
      };

      return NextResponse.json(mockPlanning);
    }

  } catch (error) {
    console.error('Erreur API planning détail:', error);
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

    try {
      const planning = await db.planning.update({
        where: { id },
        data: {
          titre: data.titre,
          description: data.description,
          dateDebut: data.dateDebut ? new Date(data.dateDebut) : undefined,
          dateFin: data.dateFin ? new Date(data.dateFin) : undefined,
          lieu: data.lieu,
          notes: data.notes,
          statut: data.statut,
          participants: data.participantIds ? {
            set: data.participantIds.map((id: string) => ({ id }))
          } : undefined
        },
        include: {
          organisateur: { select: { id: true, name: true, role: true } },
          participants: { select: { id: true, name: true, role: true } },
          chantier: { select: { id: true, nom: true } }
        }
      });

      return NextResponse.json(planning);
    } catch (dbError) {
      console.warn('Base de données non disponible, simulation de la mise à jour');
      
      return NextResponse.json({
        ...data,
        id,
        updatedAt: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error('Erreur modification planning:', error);
    return NextResponse.json({ error: 'Erreur lors de la modification' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    try {
      await db.planning.delete({
        where: { id }
      });
    } catch (dbError) {
      console.warn('Base de données non disponible, simulation de la suppression');
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Erreur suppression planning:', error);
    return NextResponse.json({ error: 'Erreur lors de la suppression' }, { status: 500 });
  }
}
