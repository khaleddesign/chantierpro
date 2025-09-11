import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST - Assigner un utilisateur au chantier
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Seuls les admins et commerciaux peuvent assigner
    if (!["ADMIN", "COMMERCIAL"].includes(session.user.role)) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const { userId } = await request.json();
    const { id: chantierId } = await params;

    // Vérifier que le chantier existe
    const chantier = await prisma.chantier.findUnique({
      where: { id: chantierId },
      select: { id: true, nom: true }
    });

    if (!chantier) {
      return NextResponse.json(
        { error: "Chantier non trouvé" },
        { status: 404 }
      );
    }

    // Vérifier que l'utilisateur existe et est un ouvrier
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, role: true, email: true }
    });

    if (!user || user.role !== "OUVRIER") {
      return NextResponse.json(
        { error: "Utilisateur invalide ou n'est pas un ouvrier" },
        { status: 400 }
      );
    }

    // Vérifier si l'assignation existe déjà
    const existingAssignment = await prisma.chantier.findFirst({
      where: {
        id: chantierId,
        assignees: {
          some: { id: userId }
        }
      }
    });

    if (existingAssignment) {
      return NextResponse.json(
        { error: "L'ouvrier est déjà assigné à ce chantier" },
        { status: 400 }
      );
    }

    // Assigner l'utilisateur au chantier
    await prisma.chantier.update({
      where: { id: chantierId },
      data: {
        assignees: {
          connect: { id: userId }
        }
      }
    });

    // Créer un événement de timeline
    await prisma.timelineEvent.create({
      data: {
        chantierId: chantierId,
        titre: "Ouvrier assigné",
        description: `${user.name} a été assigné au chantier.`,
        date: new Date(),
        type: "ETAPE",
        createdById: session.user.id,
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: `${user.name} assigné avec succès` 
    });

  } catch (error) {
    console.error("Erreur lors de l'assignation:", error);
    return NextResponse.json(
      { error: "Erreur serveur interne" },
      { status: 500 }
    );
  }
}

// DELETE - Retirer un utilisateur du chantier
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Seuls les admins et commerciaux peuvent retirer des assignations
    if (!["ADMIN", "COMMERCIAL"].includes(session.user.role)) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const { userId } = await request.json();
    const { id: chantierId } = await params;

    // Vérifier que le chantier existe
    const chantier = await prisma.chantier.findUnique({
      where: { id: chantierId },
      select: { id: true, nom: true }
    });

    if (!chantier) {
      return NextResponse.json(
        { error: "Chantier non trouvé" },
        { status: 404 }
      );
    }

    // Récupérer les infos de l'utilisateur pour le timeline
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true }
    });

    // Retirer l'assignation
    await prisma.chantier.update({
      where: { id: chantierId },
      data: {
        assignees: {
          disconnect: { id: userId }
        }
      }
    });

    // Créer un événement de timeline
    if (user) {
      await prisma.timelineEvent.create({
        data: {
          chantierId: chantierId,
          titre: "Ouvrier retiré",
          description: `${user.name} a été retiré du chantier.`,
          date: new Date(),
          type: "ETAPE",
          createdById: session.user.id,
        }
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: "Assignation supprimée avec succès" 
    });

  } catch (error) {
    console.error("Erreur lors de la suppression de l'assignation:", error);
    return NextResponse.json(
      { error: "Erreur serveur interne" },
      { status: 500 }
    );
  }
}