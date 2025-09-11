import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StatutOpportunite, PrioriteOpportunite } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const search = searchParams.get("search") || "";
    const statut = searchParams.get("statut") as StatutOpportunite | null;
    const clientId = searchParams.get("clientId") || "";

    const skip = (page - 1) * limit;

    // Construction de la condition WHERE
    const where: any = {};

    // Filtrage par rôle de l'utilisateur connecté
    if (session.user.role === "COMMERCIAL") {
      // Un commercial ne voit que les opportunités de ses clients
      where.client = {
        commercialId: session.user.id
      };
    } else if (session.user.role === "CLIENT") {
      // Un client ne voit que ses propres opportunités
      where.clientId = session.user.id;
    }
    // Les admins voient tout

    // Filtres additionnels
    if (search) {
      where.OR = [
        { nom: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { client: { name: { contains: search, mode: "insensitive" } } },
        { client: { company: { contains: search, mode: "insensitive" } } }
      ];
    }

    if (statut) {
      where.statut = statut;
    }

    if (clientId) {
      where.clientId = clientId;
    }

    // Récupération des opportunités avec pagination
    const [opportunites, total] = await Promise.all([
      prisma.opportunite.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: "desc" },
        include: {
          client: {
            select: {
              id: true,
              name: true,
              email: true,
              company: true,
              phone: true,
            }
          }
        }
      }),
      prisma.opportunite.count({ where })
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      opportunites,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      }
    });

  } catch (error) {
    console.error("Erreur lors de la récupération des opportunités:", error);
    return NextResponse.json(
      { error: "Erreur serveur interne" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Seuls les admins et commerciaux peuvent créer des opportunités
    if (!["ADMIN", "COMMERCIAL"].includes(session.user.role)) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const body = await request.json();
    const {
      clientId,
      nom,
      description,
      valeurEstimee,
      probabilite = 50,
      statut = "PROSPECT",
      dateCloture,
      sourceProspection,
      dateProchainSuivi,
      priorite = "MOYENNE",
      notes
    } = body;

    // Validation des champs obligatoires
    if (!clientId || !nom || !description || !valeurEstimee) {
      return NextResponse.json(
        { error: "Client, nom, description et valeur estimée obligatoires" },
        { status: 400 }
      );
    }

    // Vérifier que le client existe
    const client = await prisma.user.findUnique({
      where: { id: clientId }
    });

    if (!client) {
      return NextResponse.json(
        { error: "Client introuvable" },
        { status: 404 }
      );
    }

    // Si un commercial crée une opportunité, vérifier que c'est pour un de ses clients
    if (session.user.role === "COMMERCIAL" && client.commercialId !== session.user.id) {
      return NextResponse.json(
        { error: "Vous ne pouvez créer des opportunités que pour vos clients" },
        { status: 403 }
      );
    }

    // Créer l'opportunité
    const opportunite = await prisma.opportunite.create({
      data: {
        clientId,
        nom,
        description,
        valeurEstimee: parseFloat(valeurEstimee),
        probabilite: parseInt(probabilite),
        statut: statut as StatutOpportunite,
        dateCloture: dateCloture ? new Date(dateCloture) : null,
        sourceProspection,
        dateProchainSuivi: dateProchainSuivi ? new Date(dateProchainSuivi) : null,
        priorite: priorite as PrioriteOpportunite,
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            company: true,
            phone: true,
          }
        }
      }
    });

    return NextResponse.json(opportunite, { status: 201 });

  } catch (error) {
    console.error("Erreur lors de la création de l'opportunité:", error);
    return NextResponse.json(
      { error: "Erreur serveur interne" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json();
    const { id, statut, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: "ID de l'opportunité requis" },
        { status: 400 }
      );
    }

    // Vérifier que l'opportunité existe et que l'utilisateur a les droits
    const opportunite = await prisma.opportunite.findUnique({
      where: { id },
      include: { client: true }
    });

    if (!opportunite) {
      return NextResponse.json(
        { error: "Opportunité introuvable" },
        { status: 404 }
      );
    }

    // Vérifications des droits
    if (session.user.role === "COMMERCIAL" && opportunite.client.commercialId !== session.user.id) {
      return NextResponse.json(
        { error: "Accès refusé" },
        { status: 403 }
      );
    } else if (session.user.role === "CLIENT" && opportunite.clientId !== session.user.id) {
      return NextResponse.json(
        { error: "Accès refusé" },
        { status: 403 }
      );
    }

    // Mettre à jour l'opportunité
    const updatedOpportunite = await prisma.opportunite.update({
      where: { id },
      data: {
        ...updateData,
        statut: statut as StatutOpportunite,
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            company: true,
            phone: true,
          }
        }
      }
    });

    return NextResponse.json(updatedOpportunite);

  } catch (error) {
    console.error("Erreur lors de la mise à jour de l'opportunité:", error);
    return NextResponse.json(
      { error: "Erreur serveur interne" },
      { status: 500 }
    );
  }
}