import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !["ADMIN", "COMMERCIAL"].includes(session.user.role)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Récupérer un client existant
    const client = await prisma.user.findFirst({
      where: { role: "CLIENT" }
    });

    if (!client) {
      return NextResponse.json({ error: "Aucun client trouvé" }, { status: 404 });
    }

    // Données de test pour le devis
    const testDevisData = {
      clientId: client.id,
      type: "DEVIS",
      objet: "Rénovation salle de bain - Devis test",
      dateEcheance: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 jours
      lignes: [
        {
          description: "Démolition existant",
          quantite: 1,
          prixUnit: 800
        },
        {
          description: "Carrelage sol 20m²",
          quantite: 20,
          prixUnit: 45
        },
        {
          description: "Faïence mur 30m²",
          quantite: 30,
          prixUnit: 35
        },
        {
          description: "Pose lavabo avec robinetterie",
          quantite: 1,
          prixUnit: 350
        },
        {
          description: "Pose douche italienne",
          quantite: 1,
          prixUnit: 1200
        }
      ],
      notes: "Devis valable 30 jours. Matériaux et main d'œuvre inclus.",
      conditionsVente: "Conditions générales de vente applicables. Acompte de 30% à la commande.",
      modalitesPaiement: "30% à la commande, 40% à mi-parcours, 30% à la réception des travaux.",
      tva: 20.0,
      retenueGarantie: 0,
      autoliquidation: false
    };

    // Créer le devis via l'API existante
    const response = await fetch(`${request.nextUrl.origin}/api/devis`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('cookie') || ''
      },
      body: JSON.stringify(testDevisData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erreur lors de la création du devis test');
    }

    const devis = await response.json();

    return NextResponse.json({
      message: "Devis de test créé avec succès",
      devis,
      summary: {
        numero: devis.numero,
        client: client.name,
        montant: devis.montant,
        totalHT: devis.totalHT,
        totalTVA: devis.totalTVA,
        totalTTC: devis.totalTTC,
        lignes: devis.ligneDevis?.length || 0
      }
    });

  } catch (error: any) {
    console.error("Erreur lors de la création du devis test:", error);
    return NextResponse.json(
      { error: error.message || "Erreur serveur interne" },
      { status: 500 }
    );
  }
}