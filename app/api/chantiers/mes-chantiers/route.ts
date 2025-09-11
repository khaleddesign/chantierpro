import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Récupérer les chantiers assignés à l'utilisateur connecté
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Seuls les ouvriers peuvent accéder à cette route
    if (session.user.role !== "OUVRIER") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    // Récupérer les chantiers où l'utilisateur est assigné
    const chantiers = await prisma.chantier.findMany({
      where: {
        assignees: {
          some: {
            id: session.user.id
          }
        }
      },
      orderBy: { dateDebut: "desc" },
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
        _count: {
          select: {
            messages: true,
            comments: true,
            etapes: true,
            documents: true,
          }
        }
      }
    });

    return NextResponse.json({
      chantiers,
      total: chantiers.length,
      success: true
    });

  } catch (error) {
    console.error("Erreur lors de la récupération des chantiers:", error);
    return NextResponse.json(
      { error: "Erreur serveur interne" },
      { status: 500 }
    );
  }
}