import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DevisStatus } from "@prisma/client";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const devis = await prisma.devis.findUnique({
      where: { id: id },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            company: true,
            phone: true,
            address: true,
            ville: true,
            codePostal: true,
          }
        },
        chantier: {
          select: {
            id: true,
            nom: true,
            adresse: true,
            description: true,
          }
        },
        ligneDevis: {
          orderBy: { ordre: "asc" },
          include: {
            details: true
          }
        },
        paiements: {
          orderBy: { datePaiement: "desc" }
        },
        relances: {
          orderBy: { dateRelance: "desc" }
        }
      }
    });

    if (!devis) {
      return NextResponse.json(
        { error: "Devis non trouvé" },
        { status: 404 }
      );
    }

    // Vérifier les permissions
    const hasAccess = 
      session.user.role === "ADMIN" ||
      (session.user.role === "CLIENT" && devis.clientId === session.user.id) ||
      (session.user.role === "COMMERCIAL" && (devis.client as any).commercialId === session.user.id);

    if (!hasAccess) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    // Marquer comme consulté si c'est le client
    if (session.user.role === "CLIENT" && !devis.consulteLe) {
      await prisma.devis.update({
        where: { id: id },
        data: { consulteLe: new Date() }
      });
    }

    return NextResponse.json(devis);

  } catch (error) {
    console.error("Erreur lors de la récupération du devis:", error);
    return NextResponse.json(
      { error: "Erreur serveur interne" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Vérifier que le devis existe et les permissions
    const existingDevis = await prisma.devis.findUnique({
      where: { id: id },
      include: { client: true }
    });

    if (!existingDevis) {
      return NextResponse.json(
        { error: "Devis non trouvé" },
        { status: 404 }
      );
    }

    // Vérifier les permissions
    const canEdit = 
      session.user.role === "ADMIN" ||
      (session.user.role === "COMMERCIAL" && existingDevis.client.commercialId === session.user.id);

    if (!canEdit) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const body = await request.json();
    const {
      objet,
      dateEcheance,
      statut,
      lignes,
      notes,
      conditionsVente,
      modalitesPaiement,
      tva,
      retenueGarantie,
      autoliquidation,
      dateSignature
    } = body;

    let updateData: any = {};

    // Champs simples
    if (objet !== undefined) updateData.objet = objet;
    if (dateEcheance !== undefined) updateData.dateEcheance = new Date(dateEcheance);
    if (notes !== undefined) updateData.notes = notes;
    if (conditionsVente !== undefined) updateData.conditionsVente = conditionsVente;
    if (modalitesPaiement !== undefined) updateData.modalitesPaiement = modalitesPaiement;
    if (tva !== undefined) updateData.tva = parseFloat(tva);
    if (retenueGarantie !== undefined) updateData.retenueGarantie = retenueGarantie ? parseFloat(retenueGarantie) : null;
    if (autoliquidation !== undefined) updateData.autoliquidation = autoliquidation;
    if (dateSignature !== undefined) updateData.dateSignature = dateSignature ? new Date(dateSignature) : null;

    // Changement de statut
    if (statut && Object.values(DevisStatus).includes(statut)) {
      updateData.statut = statut;
      
      // Si accepté et pas encore signé, marquer comme signé
      if (statut === "ACCEPTE" && !existingDevis.dateSignature) {
        updateData.dateSignature = new Date();
      }
    }

    // Si des lignes sont fournies, recalculer les totaux
    if (lignes && Array.isArray(lignes)) {
      const totalHT = lignes.reduce((sum: number, ligne: any) => 
        sum + (parseFloat(ligne.quantite) * parseFloat(ligne.prixUnit)), 0
      );
      
      const tvaRate = tva !== undefined ? parseFloat(tva) : existingDevis.tva;
      const isAutoLiq = autoliquidation !== undefined ? autoliquidation : existingDevis.autoliquidation;
      
      const totalTVA = isAutoLiq ? 0 : (totalHT * tvaRate) / 100;
      const totalTTC = totalHT + totalTVA;
      
      const retenueRate = retenueGarantie !== undefined ? parseFloat(retenueGarantie || "0") : (existingDevis.retenueGarantie || 0);
      const montantRetenue = (totalTTC * retenueRate) / 100;
      const montantFinal = totalTTC - montantRetenue;

      updateData.totalHT = totalHT;
      updateData.totalTVA = totalTVA;
      updateData.totalTTC = totalTTC;
      updateData.montant = montantFinal;
    }

    // Mettre à jour dans une transaction
    const updatedDevis = await prisma.$transaction(async (tx) => {
      // Mettre à jour le devis
      const devis = await tx.devis.update({
        where: { id: id },
        data: updateData
      });

      // Si des nouvelles lignes sont fournies, remplacer les anciennes
      if (lignes && Array.isArray(lignes)) {
        // Supprimer les anciennes lignes
        await tx.ligneDevis.deleteMany({
          where: { devisId: id }
        });

        // Créer les nouvelles lignes
        for (let i = 0; i < lignes.length; i++) {
          const ligne = lignes[i];
          await tx.ligneDevis.create({
            data: {
              devisId: id,
              description: ligne.description,
              quantite: parseFloat(ligne.quantite),
              prixUnit: parseFloat(ligne.prixUnit),
              total: parseFloat(ligne.quantite) * parseFloat(ligne.prixUnit),
              ordre: i + 1,
            }
          });
        }
      }

      return devis;
    });

    // Récupérer le devis complet
    const fullDevis = await prisma.devis.findUnique({
      where: { id: id },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            company: true,
            phone: true,
          }
        },
        chantier: {
          select: {
            id: true,
            nom: true,
          }
        },
        ligneDevis: {
          orderBy: { ordre: "asc" }
        }
      }
    });

    return NextResponse.json(fullDevis);

  } catch (error) {
    console.error("Erreur lors de la mise à jour du devis:", error);
    return NextResponse.json(
      { error: "Erreur serveur interne" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Seuls les admins peuvent supprimer des devis
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    // Vérifier que le devis existe
    const devis = await prisma.devis.findUnique({
      where: { id: id }
    });

    if (!devis) {
      return NextResponse.json(
        { error: "Devis non trouvé" },
        { status: 404 }
      );
    }

    // Supprimer le devis (cascade automatique pour les relations)
    await prisma.devis.delete({
      where: { id: id }
    });

    return NextResponse.json({ message: "Devis supprimé avec succès" });

  } catch (error) {
    console.error("Erreur lors de la suppression du devis:", error);
    return NextResponse.json(
      { error: "Erreur serveur interne" },
      { status: 500 }
    );
  }
}