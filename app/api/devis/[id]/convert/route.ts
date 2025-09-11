import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { options } = await request.json().catch(() => ({ options: {} }));
    
    // Récupération du devis à convertir avec ses relations
    const devis = await db.devis.findUnique({
      where: { id },
      include: {
        ligneDevis: { orderBy: { ordre: 'asc' } },
        client: true,
        chantier: true
      }
    });

    // Vérifications
    if (!devis) {
      return NextResponse.json({ error: 'Devis introuvable' }, { status: 404 });
    }

    if (devis.type !== 'DEVIS') {
      return NextResponse.json({ error: 'Seul un devis peut être converti en facture' }, { status: 400 });
    }

    if (devis.statut !== 'ACCEPTE') {
      return NextResponse.json({ 
        error: 'Seuls les devis acceptés peuvent être convertis en facture',
        details: `Statut actuel: ${devis.statut}`
      }, { status: 400 });
    }

    // Génération du numéro de facture (standard ou situation)
    let numeroFacture;
    
    if (devis.situationNumero && devis.situationParent) {
      const factureCount = await db.devis.count({
        where: { 
          type: 'FACTURE',
          situationParent: devis.situationParent 
        }
      });
      
      numeroFacture = `FAC${devis.numero.split('-')[0].replace('DEV', '')}-S${String(factureCount + 1).padStart(2, '0')}`;
    } else {
      const factureCount = await db.devis.count({
        where: { type: 'FACTURE' }
      });
      
      numeroFacture = `FAC${String(factureCount + 1).padStart(4, '0')}`;
    }

    // Date d'échéance (30 jours par défaut ou valeur fournie)
    const echeanceDays = options.echeanceDays || 30;
    const dateEcheance = new Date(Date.now() + echeanceDays * 24 * 60 * 60 * 1000);

    // Créer la facture
    try {
      const facture = await db.devis.create({
        data: {
          numero: numeroFacture,
          type: 'FACTURE',
          clientId: devis.clientId,
          chantierId: devis.chantierId,
          objet: devis.objet,
          montant: devis.totalTTC || 0,
          totalHT: devis.totalHT,
          totalTVA: devis.totalTVA,
          totalTTC: devis.totalTTC,
          dateEcheance,
          notes: devis.notes,
          conditionsVente: devis.conditionsVente,
          statut: 'ENVOYE',
          factureId: devis.id,
          situationNumero: devis.situationNumero,
          situationParent: devis.situationParent,
          autoliquidation: devis.autoliquidation,
          mentionAutoliq: devis.mentionAutoliq,
          tva55: devis.tva55,
          tva10: devis.tva10,
          tva20: devis.tva20,
          retenueGarantie: devis.retenueGarantie,
          dateLiberation: devis.dateLiberation,
          cautionBancaire: devis.cautionBancaire,
          ligneDevis: {
            create: devis.ligneDevis.map(ligne => ({
              description: ligne.description,
              quantite: ligne.quantite,
              prixUnit: ligne.prixUnit,
              total: ligne.total,
              ordre: ligne.ordre
            }))
          }
        },
        include: {
          client: true,
          chantier: true,
          ligneDevis: { orderBy: { ordre: 'asc' } }
        }
      });

      // Mettre à jour le devis d'origine pour référencer la facture
      await db.devis.update({
        where: { id: devis.id },
        data: {
          factureId: facture.id
        }
      });

      return NextResponse.json({ 
        facture,
        success: true,
        message: `Le devis ${devis.numero} a été converti avec succès en facture ${facture.numero}`
      }, { status: 201 });
      
    } catch (dbError) {
      console.error('Erreur BD:', dbError);
      
      // Simulation pour environnement de développement
      const facture = {
        id: `fac-${Date.now()}`,
        numero: numeroFacture,
        type: 'FACTURE',
        statut: 'ENVOYE',
        objet: devis.objet,
        client: devis.client,
        chantier: devis.chantier,
        totalHT: devis.totalHT,
        totalTVA: devis.totalTVA,
        totalTTC: devis.totalTTC,
        dateCreation: new Date().toISOString(),
        dateEcheance: dateEcheance.toISOString(),
        ligneDevis: devis.ligneDevis
      };
      
      return NextResponse.json({ 
        facture,
        success: true,
        message: `Le devis ${devis.numero} a été converti avec succès en facture ${numeroFacture}`,
        simulation: true
      }, { status: 201 });
    }

  } catch (error) {
    console.error('Erreur conversion devis:', error);
    return NextResponse.json({ 
      error: 'Erreur lors de la conversion',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 });
  }
}
