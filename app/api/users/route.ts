import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { Role, TypeClient } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 API /api/users appelée');
    const session = await getServerSession(authOptions);
    
    if (!session) {
      console.log('❌ Pas de session');
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    console.log('✅ Session trouvée:', session.user?.email, 'Role:', session.user?.role);

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const role = searchParams.get("role") as Role | null;
    const typeClient = searchParams.get("typeClient") as TypeClient | null;
    const commercialId = searchParams.get("commercialId") || "";

    console.log('📊 Paramètres:', { page, limit, search, role, typeClient, commercialId });
    
    // Debug spécifique pour role=CLIENT
    if (role === 'CLIENT') {
      console.log('🔍 DEBUG role=CLIENT - Session user:', {
        id: session.user.id,
        email: session.user.email,
        role: session.user.role
      });
    }

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

    // Filtres additionnels - gérer les conflits avec OR
    const additionalFilters: any = {};

    if (search) {
      additionalFilters.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { company: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } }
      ];
    }

    if (role) {
      additionalFilters.role = role;
    }

    if (typeClient) {
      additionalFilters.typeClient = typeClient;
    }

    if (commercialId) {
      additionalFilters.commercialId = commercialId;
    }

    // Combiner les filtres de manière cohérente
    if (Object.keys(additionalFilters).length > 0) {
      if (where.OR) {
        // Si on a déjà un OR (pour les commerciaux), utiliser AND pour combiner
        where.AND = [
          { OR: where.OR },
          additionalFilters
        ];
        delete where.OR; // Supprimer l'ancien OR
      } else {
        // Sinon, ajouter directement les filtres
        Object.assign(where, additionalFilters);
      }
    }

    console.log('🔍 Clause WHERE construite:', JSON.stringify(where, null, 2));

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

    console.log('✅ Utilisateurs trouvés:', users.length, 'Total:', total);

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
    console.error("❌ Erreur lors de la récupération des utilisateurs:", error);
    console.error("❌ Stack trace:", error.stack);
    console.error("❌ Database URL utilisée:", process.env.DATABASE_URL?.substring(0, 50) + '...');
    console.error("❌ Paramètres de la requête:", { page, limit, search, role, typeClient, commercialId });
    return NextResponse.json(
      { error: "Erreur serveur interne" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 API POST /api/users appelée');
    console.log('Database URL:', process.env.DATABASE_URL?.substring(0, 50) + '...');
    
    const session = await getServerSession(authOptions);
    
    console.log('🔍 Session récupérée:', {
      hasSession: !!session,
      userId: session?.user?.id,
      userEmail: session?.user?.email,
      userRole: session?.user?.role
    });
    
    if (!session) {
      console.log('❌ Aucune session trouvée');
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