import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { Role, TypeClient } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const role = searchParams.get("role") as Role | null;
    const typeClient = searchParams.get("typeClient") as TypeClient | null;
    const commercialId = searchParams.get("commercialId") || "";

    const skip = (page - 1) * limit;

    // Construction de la condition WHERE
    const where: any = {};

    // Filtrage par rôle de l'utilisateur connecté
    if (session.user.role === "COMMERCIAL") {
      // Un commercial ne voit que ses clients et lui-même
      where.OR = [
        { commercialId: session.user.id },
        { id: session.user.id }
      ];
    } else if (session.user.role === "CLIENT") {
      // Un client ne voit que lui-même
      where.id = session.user.id;
    }
    // Les admins voient tout

    // Filtres additionnels
    if (search) {
      where.AND = where.AND || [];
      where.AND.push({
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
          { company: { contains: search, mode: "insensitive" } },
          { phone: { contains: search, mode: "insensitive" } }
        ]
      });
    }

    if (role) {
      where.role = role;
    }

    if (typeClient) {
      where.typeClient = typeClient;
    }

    if (commercialId) {
      where.commercialId = commercialId;
    }

    // Récupération des utilisateurs avec pagination
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
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
          image: true,
          createdAt: true,
          updatedAt: true,
          commercial: {
            select: {
              id: true,
              name: true,
              email: true,
            }
          },
          _count: {
            select: {
              chantiers: true,
              devis: true,
              commerciaux: true,
            }
          }
        }
      }),
      prisma.user.count({ where })
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      users,
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
    console.error("Erreur lors de la récupération des utilisateurs:", error);
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

    // Seuls les admins et commerciaux peuvent créer des utilisateurs
    if (!["ADMIN", "COMMERCIAL"].includes(session.user.role)) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const body = await request.json();
    const {
      name,
      email,
      password,
      role = "CLIENT",
      phone,
      company,
      address,
      ville,
      codePostal,
      pays = "France",
      typeClient = "PARTICULIER",
      secteurActivite,
      effectif,
      chiffreAffaires,
      commercialId
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

    // Si un commercial crée un utilisateur, c'est forcément un client qui lui est assigné
    const finalRole = session.user.role === "COMMERCIAL" ? "CLIENT" : role;
    const finalCommercialId = session.user.role === "COMMERCIAL" ? session.user.id : commercialId;

    // Hacher le mot de passe si fourni
    let hashedPassword = null;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    // Créer l'utilisateur
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: finalRole as Role,
        phone,
        company,
        address,
        ville,
        codePostal,
        pays,
        typeClient: typeClient as TypeClient,
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
        createdAt: true,
        commercial: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    });

    return NextResponse.json(user, { status: 201 });

  } catch (error) {
    console.error("Erreur lors de la création de l'utilisateur:", error);
    return NextResponse.json(
      { error: "Erreur serveur interne" },
      { status: 500 }
    );
  }
}