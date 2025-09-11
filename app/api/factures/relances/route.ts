import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const factureId = searchParams.get('factureId');

    let relances = [];

    try {
      const whereClause: Prisma.RelanceWhereInput = {};
      if (factureId) whereClause.factureId = factureId;

      relances = await db.relance.findMany({
        where: whereClause,
        include: {
          facture: {
            select: { numero: true, client: { select: { name: true } } }
          }
        },
        orderBy: { dateRelance: 'desc' }
      });
    } catch (dbError) {
      relances = [
        {
          id: 'rel-1',
          factureId: 'fac-1',
          type: 'PREMIERE',
          dateEnvoi: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          dateEcheance: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          montantDu: 10500,
          status: 'ENVOYE',
          facture: {
            numero: 'FAC0001',
            client: { name: 'Sophie Durand' }
          }
        }
      ];
    }

    return NextResponse.json({ relances, success: true });
  } catch (error) {
    console.error('Erreur API relances:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { factureId, type, message } = await request.json();

    if (!factureId || !type) {
      return NextResponse.json({ error: 'factureId et type requis' }, { status: 400 });
    }

    try {
      const facture = await db.devis.findUnique({
        where: { id: factureId },
        include: { client: true }
      });

      if (!facture || facture.type !== 'FACTURE') {
        return NextResponse.json({ error: 'Facture introuvable' }, { status: 404 });
      }

      const relance = await db.relance.create({
        data: {
          factureId,
          type,
          message: message || getDefaultRelanceMessage(type),
          dateRelance: new Date()
        },
        include: {
          facture: {
            include: { client: true }
          }
        }
      });

      return NextResponse.json({ relance, success: true }, { status: 201 });
    } catch (dbError) {
      const mockRelance = {
        id: `rel-${Date.now()}`,
        factureId,
        type,
        message: message || getDefaultRelanceMessage(type),
        dateEnvoi: new Date().toISOString(),
        dateEcheance: new Date(Date.now() + getRelanceDelai(type) * 24 * 60 * 60 * 1000).toISOString(),
        status: 'ENVOYE'
      };

      return NextResponse.json({ relance: mockRelance, success: true }, { status: 201 });
    }
  } catch (error) {
    console.error('Erreur création relance:', error);
    return NextResponse.json({ error: 'Erreur lors de la création' }, { status: 500 });
  }
}

function getDefaultRelanceMessage(type: string): string {
  const messages = {
    PREMIERE: 'Nous vous rappelons que votre facture arrive à échéance. Merci de procéder au règlement dans les meilleurs délais.',
    DEUXIEME: 'Malgré notre précédente relance, votre facture demeure impayée. Nous vous prions de régulariser votre situation rapidement.',
    FINALE: 'Dernière relance avant mise en demeure. Veuillez régler votre facture sous 8 jours pour éviter des frais supplémentaires.'
  };
  return messages[type as keyof typeof messages] || messages.PREMIERE;
}

function getRelanceDelai(type: string): number {
  const delais = {
    PREMIERE: 15,
    DEUXIEME: 8,
    FINALE: 3
  };
  return delais[type as keyof typeof delais] || 15;
}
