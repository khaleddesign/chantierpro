
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Récupérer la répartition TVA
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const devis = await db.devis.findUnique({
      where: { id },
      include: {
        ligneDevis: { orderBy: { ordre: 'asc' } },
        ligneDevisDetails: true
      }
    });

    if (!devis) {
      return NextResponse.json({ error: 'Devis introuvable' }, { status: 404 });
    }

    // Calculer la répartition par taux de TVA
    const repartitionTVA = {
      tva55: 0,
      tva10: 0,
      tva20: 0,
      totalHT: 0,
      totalTVA: 0,
      totalTTC: 0
    };

    // Si détails disponibles, utiliser les taux par ligne
    if (devis.ligneDevisDetails.length > 0) {
      devis.ligneDevisDetails.forEach((detail: any) => {
        const ligneCorrespondante = devis.ligneDevis.find((l: any) => l.id === detail.ligneId);
        if (ligneCorrespondante) {
          const montantHT = ligneCorrespondante.total;
          const montantTVA = montantHT * (detail.tauxTVA / 100);
          
          repartitionTVA.totalHT += montantHT;
          repartitionTVA.totalTVA += montantTVA;
          
          if (detail.tauxTVA === 5.5) repartitionTVA.tva55 += montantTVA;
          else if (detail.tauxTVA === 10) repartitionTVA.tva10 += montantTVA;
          else if (detail.tauxTVA === 20) repartitionTVA.tva20 += montantTVA;
        }
      });
    } else {
      // Utilisation des champs globaux du devis
      repartitionTVA.tva55 = devis.tva55 || 0;
      repartitionTVA.tva10 = devis.tva10 || 0;
      repartitionTVA.tva20 = devis.tva20 || 0;
      repartitionTVA.totalHT = devis.totalHT || 0;
      repartitionTVA.totalTVA = devis.totalTVA || 0;
    }

    repartitionTVA.totalTTC = repartitionTVA.totalHT + repartitionTVA.totalTVA;

    return NextResponse.json({
      repartitionTVA,
      autoliquidation: devis.autoliquidation,
      mentionAutoliq: devis.mentionAutoliq,
      success: true
    });

  } catch (error) {
    console.error('Erreur API TVA multi-taux:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// PUT - Mettre à jour la répartition TVA
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { lignesDetailTVA, autoliquidation, mentionAutoliq } = await request.json();

    const devis = await db.devis.findUnique({
      where: { id },
      include: { ligneDevis: true }
    });

    if (!devis) {
      return NextResponse.json({ error: 'Devis introuvable' }, { status: 404 });
    }

    // Supprimer les anciens détails
    await db.ligneDevisDetail.deleteMany({
      where: { devisId: id }
    });

    // Créer les nouveaux détails
    if (lignesDetailTVA && lignesDetailTVA.length > 0) {
      await db.ligneDevisDetail.createMany({
        data: lignesDetailTVA.map((detail: any) => ({
          devisId: id,
          ligneId: detail.ligneId,
          tauxTVA: detail.tauxTVA,
          categorie: detail.categorie,
          unite: detail.unite
        }))
      });
    }

    // Recalculer les totaux TVA
    let tva55 = 0, tva10 = 0, tva20 = 0;
    
    lignesDetailTVA?.forEach((detail: any) => {
      const ligne = devis.ligneDevis.find((l: any) => l.id === detail.ligneId);
      if (ligne) {
        const montantTVA = ligne.total * (detail.tauxTVA / 100);
        if (detail.tauxTVA === 5.5) tva55 += montantTVA;
        else if (detail.tauxTVA === 10) tva10 += montantTVA;
        else if (detail.tauxTVA === 20) tva20 += montantTVA;
      }
    });

    const totalTVA = tva55 + tva10 + tva20;
    const totalTTC = (devis.totalHT || 0) + totalTVA;

    // Mettre à jour le devis
    const devisMisAJour = await db.devis.update({
      where: { id },
      data: {
        tva55,
        tva10,
        tva20,
        totalTVA,
        totalTTC,
        montant: totalTTC,
        autoliquidation: autoliquidation || false,
        mentionAutoliq: mentionAutoliq || null
      }
    });

    return NextResponse.json({ devis: devisMisAJour, success: true });

  } catch (error) {
    console.error('Erreur mise à jour TVA multi-taux:', error);
    return NextResponse.json({ error: 'Erreur lors de la mise à jour' }, { status: 500 });
  }
}
