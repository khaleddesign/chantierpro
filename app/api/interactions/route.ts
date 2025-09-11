import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TypeInteraction, StatutInteraction } from "@prisma/client";

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
    const type = searchParams.get("type") as TypeInteraction | null;
    const statut = searchParams.get("statut") as StatutInteraction | null;
    const clientId = searchParams.get("clientId") || "";

    const skip = (page - 1) * limit;

    // Construction de la condition WHERE
    const where: any = {};

    // Filtrage par rôle de l'utilisateur connecté
    if (session.user.role === "COMMERCIAL") {
      // Un commercial ne voit que les interactions de ses clients
      where.client = {
        commercialId: session.user.id
      };
    } else if (session.user.role === "CLIENT") {
      // Un client ne voit que ses propres interactions
      where.clientId = session.user.id;
    }
    // Les admins voient tout

    // Filtres additionnels
    if (search) {
      where.OR = [
        { objet: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { client: { name: { contains: search, mode: "insensitive" } } },
        { client: { company: { contains: search, mode: "insensitive" } } }
      ];
    }

    if (type) {
      where.type = type;
    }

    if (statut) {
      where.statut = statut;
    }

    if (clientId) {
      where.clientId = clientId;
    }

    // Récupération des interactions avec pagination
    const [interactions, total] = await Promise.all([
      prisma.interactionClient.findMany({
        where,
        skip,
        take: limit,
        orderBy: { dateContact: "desc" },
        include: {
          client: {
            select: {
              id: true,
              name: true,
              email: true,
              company: true,
              typeClient: true,
            }
          }
        }
      }),
      prisma.interactionClient.count({ where })
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      interactions,
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
    console.error("Erreur lors de la récupération des interactions:", error);
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

    // Seuls les admins et commerciaux peuvent créer des interactions
    if (!["ADMIN", "COMMERCIAL"].includes(session.user.role)) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const body = await request.json();
    const {
      clientId,
      type,
      objet,
      description,
      dateContact,
      prochaineSuite,
      dureeMinutes,
      resultats,
      pieceJointe,
      localisation,
      rappelDate,
      statut = "A_TRAITER"
    } = body;

    // Validation des champs obligatoires
    if (!clientId || !type || !objet || !description) {
      return NextResponse.json(
        { error: "Client, type, objet et description obligatoires" },
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

    // Si un commercial crée une interaction, vérifier que c'est pour un de ses clients
    if (session.user.role === "COMMERCIAL" && client.commercialId !== session.user.id) {
      return NextResponse.json(
        { error: "Vous ne pouvez créer des interactions que pour vos clients" },
        { status: 403 }
      );
    }

    // Créer l'interaction
    const interaction = await prisma.interactionClient.create({
      data: {
        clientId,
        type: type as TypeInteraction,
        objet,
        description,
        dateContact: dateContact ? new Date(dateContact) : new Date(),
        prochaineSuite: prochaineSuite ? new Date(prochaineSuite) : null,
        createdBy: session.user.id,
        dureeMinutes: dureeMinutes ? parseInt(dureeMinutes) : null,
        resultats,
        pieceJointe,
        localisation,
        rappelDate: rappelDate ? new Date(rappelDate) : null,
        statut: statut as StatutInteraction,
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            company: true,
            typeClient: true,
          }
        }
      }
    });

    return NextResponse.json(interaction, { status: 201 });

  } catch (error) {
    console.error("Erreur lors de la création de l'interaction:", error);
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
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: "ID de l'interaction requis" },
        { status: 400 }
      );
    }

    // Vérifier que l'interaction existe et que l'utilisateur a les droits
    const interaction = await prisma.interactionClient.findUnique({
      where: { id },
      include: { client: true }
    });

    if (!interaction) {
      return NextResponse.json(
        { error: "Interaction introuvable" },
        { status: 404 }
      );
    }

    // Vérifications des droits
    if (session.user.role === "COMMERCIAL" && interaction.client.commercialId !== session.user.id) {
      return NextResponse.json(
        { error: "Accès refusé" },
        { status: 403 }
      );
    } else if (session.user.role === "CLIENT" && interaction.clientId !== session.user.id) {
      return NextResponse.json(
        { error: "Accès refusé" },
        { status: 403 }
      );
    }

    // Mettre à jour l'interaction
    const updatedInteraction = await prisma.interactionClient.update({
      where: { id },
      data: {
        ...updateData,
        prochaineSuite: updateData.prochaineSuite ? new Date(updateData.prochaineSuite) : undefined,
        rappelDate: updateData.rappelDate ? new Date(updateData.rappelDate) : undefined,
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            company: true,
            typeClient: true,
          }
        }
      }
    });

    return NextResponse.json(updatedInteraction);

  } catch (error) {
    console.error("Erreur lors de la mise à jour de l'interaction:", error);
    return NextResponse.json(
      { error: "Erreur serveur interne" },
      { status: 500 }
    );
  }
}