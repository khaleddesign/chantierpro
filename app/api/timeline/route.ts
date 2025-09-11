import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { chantierId, titre, description, type, date } = await request.json();
    
    if (!chantierId || !titre) {
      return NextResponse.json({ error: 'chantierId et titre requis' }, { status: 400 });
    }

    // Vérifier que le chantier existe et que l'utilisateur a accès
    const chantier = await prisma.chantier.findFirst({
      where: {
        id: chantierId,
        OR: [
          { clientId: session.user.id },
          { assignees: { some: { id: session.user.id } } }
        ]
      }
    });

    if (!chantier && !['ADMIN', 'COMMERCIAL'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Chantier introuvable ou accès refusé' }, { status: 404 });
    }

    const timelineEvent = await prisma.timelineEvent.create({
      data: {
        chantierId,
        titre,
        description: description || '',
        date: date ? new Date(date) : new Date(),
        type: type || 'ETAPE',
        createdById: session.user.id,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    });

    return NextResponse.json(timelineEvent, { status: 201 });

  } catch (error) {
    console.error('Erreur création timeline event:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}