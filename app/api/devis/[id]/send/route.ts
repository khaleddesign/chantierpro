import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { email, message } = await request.json();

    const devis = await db.devis.findUnique({
      where: { id },
      include: {
        client: true,
        chantier: true
      }
    });

    if (!devis) {
      return NextResponse.json({ error: 'Devis introuvable' }, { status: 404 });
    }

    if (devis.statut === 'PAYE') {
      return NextResponse.json({ error: 'Ce document est déjà payé' }, { status: 400 });
    }

    const updatedDevis = await db.devis.update({
      where: { id },
      data: {
        statut: 'ENVOYE'
      },
      include: {
        client: true,
        chantier: true,
        ligneDevis: true
      }
    });

    return NextResponse.json({
      success: true,
      message: `${devis.type === 'DEVIS' ? 'Devis' : 'Facture'} envoyé avec succès`,
      devis: updatedDevis,
      simulation: {
        to: email || devis.client.email,
        subject: `${devis.type === 'DEVIS' ? 'Devis' : 'Facture'} ${devis.numero} - ${devis.objet}`,
        body: message || `Veuillez trouver ci-joint votre ${devis.type.toLowerCase()} ${devis.numero}.`
      }
    });

  } catch (error) {
    console.error('Erreur envoi devis:', error);
    return NextResponse.json({ error: 'Erreur lors de l\'envoi' }, { status: 500 });
  }
}
