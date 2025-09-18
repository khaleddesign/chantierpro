import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Seuls les admins et commerciaux peuvent voir les clients CRM
    if (!["ADMIN", "COMMERCIAL"].includes(session.user.role)) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";
    const typeClient = searchParams.get("typeClient") || "";
    const ville = searchParams.get("ville") || "";
    const commercial = searchParams.get("commercial") || "";

    const skip = (page - 1) * limit;

    // Construction de la condition WHERE
    const where: any = {
      role: "CLIENT"
    };

    // Filtrage par rôle de l'utilisateur connecté
    if (session.user.role === "COMMERCIAL") {
      // Un commercial ne voit que ses clients
      where.commercialId = session.user.id;
    }
    // Les admins voient tous les clients

    // Filtres additionnels
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { company: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } }
      ];
    }

    if (typeClient && typeClient !== "TOUS") {
      where.typeClient = typeClient;
    }

    if (ville) {
      where.ville = { contains: ville, mode: "insensitive" };
    }

    if (commercial) {
      where.commercialId = commercial;
    }

    // Récupération des clients avec leurs relations
    const [clients, totalCount] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          commercial: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          _count: {
            select: {
              chantiers: true,
              devis: true,
              interactions: true,
              opportunites: true
            }
          }
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit
      }),
      prisma.user.count({ where })
    ]);

    // Calcul des statistiques CRM (pour les admins seulement)
    let stats = null;
    if (session.user.role === "ADMIN") {
      const [totalClients, nouveauxClients] = await Promise.all([
        prisma.user.count({ where: { role: "CLIENT" } }),
        prisma.user.count({
          where: {
            role: "CLIENT",
            createdAt: {
              gte: new Date(new Date().setDate(new Date().getDate() - 30))
            }
          }
        })
      ]);

      stats = {
        totalClients,
        nouveauxClients,
        leadsActifs: Math.floor(totalClients * 0.3),
        pipelineTotal: 0,
        tauxConversion: 24,
        chiffreAffairesPrevisionnel: 0
      };
    }

    return NextResponse.json({
      success: true,
      data: {
        clients,
        stats,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit),
          hasNext: page < Math.ceil(totalCount / limit),
          hasPrev: page > 1
        }
      },
      message: `${totalCount} client(s) trouvé(s)`
    });

  } catch (error) {
    console.error("Erreur lors de la récupération des clients CRM:", error);
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

    // Seuls les admins et commerciaux peuvent créer des clients
    if (!["ADMIN", "COMMERCIAL"].includes(session.user.role)) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const body = await request.json();
    const {
      name,
      email,
      password,
      phone,
      company,
      address,
      ville,
      codePostal,
      pays = "France",
      typeClient = "PARTICULIER",
      secteurActivite,
      effectif,
      chiffreAffaires
    } = body;

    // Validation des champs obligatoires
    if (!name || !email) {
      return NextResponse.json(
        { error: "Nom et email obligatoires" },
        { status: 400 }
      );
    }

    // Vérifier que l'email n'existe pas déjà
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Un utilisateur avec cet email existe déjà" },
        { status: 400 }
      );
    }

    // Si un commercial crée un client, c'est forcément pour lui-même
    const finalCommercialId = session.user.role === "COMMERCIAL" ? session.user.id : null;

    // Hacher le mot de passe si fourni
    let hashedPassword = null;
    if (password) {
      const bcrypt = require('bcryptjs');
      hashedPassword = await bcrypt.hash(password, 10);
    }

    // Créer le client
    const client = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "CLIENT",
        phone,
        company,
        address,
        ville,
        codePostal,
        pays,
        typeClient,
        secteurActivite,
        effectif,
        chiffreAffaires: chiffreAffaires ? parseFloat(chiffreAffaires) : null,
        commercialId: finalCommercialId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        company: true,
        address: true,
        ville: true,
        codePostal: true,
        pays: true,
        typeClient: true,
        secteurActivite: true,
        effectif: true,
        chiffreAffaires: true,
        commercialId: true,
        createdAt: true,
        commercial: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: client,
      message: "Client créé avec succès"
    }, { status: 201 });

  } catch (error) {
    console.error("Erreur lors de la création du client:", error);
    return NextResponse.json(
      { error: "Erreur serveur interne" },
      { status: 500 }
    );
  }
}
