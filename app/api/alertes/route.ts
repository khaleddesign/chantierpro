import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TypeAlerte, RecurrenceAlerte } from "@prisma/client";

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
    const type = searchParams.get("type") as TypeAlerte | null;
    const traite = searchParams.get("traite");

    const skip = (page - 1) * limit;

    // Construction de la condition WHERE
    const where: any = {};

    // Filtrage par utilisateur - chaque utilisateur ne voit que ses alertes
    if (session.user.role === "COMMERCIAL") {
      where.OR = [
        { userId: session.user.id },
        { 
          client: {
            commercialId: session.user.id
          }
        }
      ];
    } else if (session.user.role === "CLIENT") {
      where.clientId = session.user.id;
    } else {
      // Admin voit tout
    }

    // Filtres additionnels
    if (search) {
      where.AND = where.AND || [];
      where.AND.push({
        OR: [
          { titre: { contains: search, mode: "insensitive" } },
          { message: { contains: search, mode: "insensitive" } }
        ]
      });
    }

    if (type) {
      where.type = type;
    }

    if (traite !== null && traite !== undefined) {
      where.traite = traite === 'true';
    }

    // Configuration du include basé sur les conditions
    const includeConfig: any = {};
    
    // Inclure client seulement s'il y a une relation client
    if (session.user.role !== 'CLIENT') {
      includeConfig.client = {
        select: {
          id: true,
          name: true,
          email: true,
          company: true,
          typeClient: true,
        }
      };
    }

    // Récupération des alertes avec pagination
    const findManyQuery: any = {
      where,
      skip,
      take: limit,
      orderBy: { dateAlerte: "desc" }
    };

    if (Object.keys(includeConfig).length > 0) {
      findManyQuery.include = includeConfig;
    }

    const [alertes, total] = await Promise.all([
      prisma.alerteCRM.findMany(findManyQuery),
      prisma.alerteCRM.count({ where })
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      alertes,
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
    console.error("Erreur lors de la récupération des alertes:", error);
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

    const body = await request.json();
    const {
      titre,
      message,
      type,
      clientId,
      opportuniteId,
      dateAlerte,
      recurrence,
      prochaine
    } = body;

    // Validation des champs obligatoires
    if (!titre || !message || !type || !dateAlerte) {
      return NextResponse.json(
        { error: "Titre, message, type et date d'alerte obligatoires" },
        { status: 400 }
      );
    }

    // Si un client est spécifié, vérifier qu'il existe
    if (clientId) {
      const client = await prisma.user.findUnique({
        where: { id: clientId }
      });

      if (!client) {
        return NextResponse.json(
          { error: "Client introuvable" },
          { status: 404 }
        );
      }

      // Si un commercial crée une alerte, vérifier que c'est pour un de ses clients
      if (session.user.role === "COMMERCIAL" && client.commercialId !== session.user.id) {
        return NextResponse.json(
          { error: "Vous ne pouvez créer des alertes que pour vos clients" },
          { status: 403 }
        );
      }
    }

    // Créer l'alerte
    const createData: any = {
      titre,
      message,
      type: type as TypeAlerte,
      clientId,
      opportuniteId,
      userId: session.user.id,
      dateAlerte: new Date(dateAlerte),
      recurrence: recurrence as RecurrenceAlerte,
      prochaine: prochaine ? new Date(prochaine) : null,
    };

    const createQuery: any = { data: createData };
    
    if (clientId) {
      createQuery.include = {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            company: true,
            typeClient: true,
          }
        }
      };
    }

    const alerte = await prisma.alerteCRM.create(createQuery);

    return NextResponse.json(alerte, { status: 201 });

  } catch (error) {
    console.error("Erreur lors de la création de l'alerte:", error);
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
        { error: "ID de l'alerte requis" },
        { status: 400 }
      );
    }

    // Vérifier que l'alerte existe et que l'utilisateur a les droits
    const findQuery: any = { where: { id } };
    
    if (session.user.role === "COMMERCIAL") {
      findQuery.include = {
        client: {
          select: {
            id: true,
            commercialId: true,
          }
        }
      };
    }

    const alerte = await prisma.alerteCRM.findUnique(findQuery);

    if (!alerte) {
      return NextResponse.json(
        { error: "Alerte introuvable" },
        { status: 404 }
      );
    }

    // Vérifications des droits
    if (session.user.role === "COMMERCIAL") {
      const canEdit = alerte.userId === session.user.id || 
                     ((alerte as any).client && (alerte as any).client.commercialId === session.user.id);
      if (!canEdit) {
        return NextResponse.json(
          { error: "Accès refusé" },
          { status: 403 }
        );
      }
    } else if (session.user.role === "CLIENT" && alerte.clientId !== session.user.id) {
      return NextResponse.json(
        { error: "Accès refusé" },
        { status: 403 }
      );
    }

    // Mettre à jour l'alerte
    const updateQuery: any = {
      where: { id },
      data: {
        ...updateData,
        dateAlerte: updateData.dateAlerte ? new Date(updateData.dateAlerte) : undefined,
        prochaine: updateData.prochaine ? new Date(updateData.prochaine) : undefined,
      }
    };

    if (alerte.clientId) {
      updateQuery.include = {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            company: true,
            typeClient: true,
          }
        }
      };
    }

    const updatedAlerte = await prisma.alerteCRM.update(updateQuery);

    return NextResponse.json(updatedAlerte);

  } catch (error) {
    console.error("Erreur lors de la mise à jour de l'alerte:", error);
    return NextResponse.json(
      { error: "Erreur serveur interne" },
      { status: 500 }
    );
  }
}