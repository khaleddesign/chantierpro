import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Récupérer toutes les situations d'un devis
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const situations = await db.devis.findMany({
      where: {
        OR: [
          { id }, // Situation initiale
          { situationParent: id } // Situations filles
        ]
      },
      include: {
        client: {
          select: { id: true, name: true, email: true, company: true }
        },
        chantier: {
          select: { id: true, nom: true }
        },
        ligneDevis: { orderBy: { ordre: 'asc' } }
      },
      orderBy: { situationNumero: 'asc' }
    });

    return NextResponse.json({ situations, success: true });

  } catch (error) {
    console.error('Erreur API situations:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST - Créer une nouvelle situation
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { avancement, lignesModifiees, notes } = await request.json();

    // Récupérer le devis parent
    const devisParent = await db.devis.findUnique({
      where: { id },
      include: {
        ligneDevis: { orderBy: { ordre: 'asc' } },
        client: true,
        chantier: true
      }
    });

    if (!devisParent) {
      return NextResponse.json({ error: 'Devis introuvable' }, { status: 404 });
    }

    // Compter les situations existantes
    const situationsCount = await db.devis.count({
      where: {
        OR: [
          { situationParent: id },
          { id: id }
        ]
      }
    });

    const nouveauNumero = situationsCount + 1;
    const numeroSituation = `${devisParent.numero}-S${String(nouveauNumero).padStart(2, '0')}`;

    // Calculer les totaux
    const lignesCalculees = lignesModifiees || devisParent.ligneDevis.map((ligne: any) => ({
      description: ligne.description,
      quantite: ligne.quantite,
      prixUnit: ligne.prixUnit,
      total: ligne.quantite * ligne.prixUnit * (avancement / 100)
    }));

    const totalHT = lignesCalculees.reduce((sum: number, ligne: any) => sum + ligne.total, 0);
    const totalTVA = totalHT * 0.20;
    const totalTTC = totalHT + totalTVA;

    // Créer la situation
    const nouvelleSituation = await db.devis.create({
      data: {
        numero: numeroSituation,
        type: 'DEVIS',
        clientId: devisParent.clientId,
        chantierId: devisParent.chantierId,
        objet: `${devisParent.objet} - Situation ${nouveauNumero}`,
        montant: totalTTC,
        totalHT,
        totalTVA,
        totalTTC,
        dateEcheance: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        statut: 'BROUILLON',
        
        // Champs BTP
        situationNumero: nouveauNumero,
        situationParent: id,
        avancement: avancement,
        
        notes: notes || `Situation de travaux ${nouveauNumero} - Avancement ${avancement}%`,
        
        ligneDevis: {
          create: lignesCalculees.map((ligne: any, index: number) => ({
            description: ligne.description,
            quantite: ligne.quantite,
            prixUnit: ligne.prixUnit,
            total: ligne.total,
            ordre: index + 1
          }))
        }
      },
      include: {
        client: true,
        chantier: true,
        ligneDevis: { orderBy: { ordre: 'asc' } }
      }
    });

    return NextResponse.json({ situation: nouvelleSituation, success: true }, { status: 201 });

  } catch (error) {
    console.error('Erreur création situation:', error);
    return NextResponse.json({ error: 'Erreur lors de la création' }, { status: 500 });
  }
}
