import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// PUT - Activer/Désactiver l'autoliquidation
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { autoliquidation, mentionAutoliq } = await request.json();

    const devis = await db.devis.findUnique({
      where: { id }
    });

    if (!devis) {
      return NextResponse.json({ error: 'Devis introuvable' }, { status: 404 });
    }

    // Mention légale par défaut si autoliquidation activée
    let mention = mentionAutoliq;
    if (autoliquidation && !mention) {
      mention = "TVA non applicable, art. 293 B du CGI - Autoliquidation";
    }

    const devisMisAJour = await db.devis.update({
      where: { id },
      data: {
        autoliquidation: autoliquidation || false,
        mentionAutoliq: autoliquidation ? mention : null,
        // Si autoliquidation, TVA à 0
        totalTVA: autoliquidation ? 0 : devis.totalTVA,
        totalTTC: autoliquidation ? devis.totalHT : (devis.totalHT || 0) + (devis.totalTVA || 0)
      }
    });

    return NextResponse.json({ devis: devisMisAJour, success: true });

  } catch (error) {
    console.error('Erreur autoliquidation:', error);
    return NextResponse.json({ error: 'Erreur lors de la mise à jour' }, { status: 500 });
  }
}
