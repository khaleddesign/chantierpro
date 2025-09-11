import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

    // Seuls les admins peuvent restaurer des chantiers
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    // Vérifier que le chantier existe et est supprimé
    const chantier = await prisma.chantier.findUnique({
      where: { id: id }
    });

    if (!chantier) {
      return NextResponse.json(
        { error: "Chantier non trouvé" },
        { status: 404 }
      );
    }

    if (!chantier.deletedAt) {
      return NextResponse.json(
        { error: "Chantier non supprimé" },
        { status: 400 }
      );
    }

    // Restaurer le chantier
    const restoredChantier = await prisma.chantier.update({
      where: { id: id },
      data: {
        deletedAt: null,
        deletedById: null,
      }
    });

    // Créer un événement de timeline
    await prisma.timelineEvent.create({
      data: {
        chantierId: id,
        titre: "Chantier restauré",
        description: `Le chantier a été restauré par ${session.user.name}`,
        date: new Date(),
        type: "ETAPE",
        createdById: session.user.id,
      }
    });

    return NextResponse.json({ 
      message: "Chantier restauré avec succès",
      chantier: restoredChantier
    });

  } catch (error) {
    console.error("Erreur lors de la restauration du chantier:", error);
    return NextResponse.json(
      { error: "Erreur serveur interne" },
      { status: 500 }
    );
  }
}