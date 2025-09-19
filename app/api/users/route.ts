// app/api/users/route.ts - Correction de l'erreur 500

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 API /api/users - Début');
    
    // Vérification de la session AVANT toute chose
    let session;
    try {
      session = await getServerSession(authOptions);
      console.log('Session récupérée:', !!session);
    } catch (sessionError) {
      console.error('❌ Erreur session dans /api/users:', sessionError);
      return NextResponse.json({ 
        error: "Erreur d'authentification. Veuillez vous reconnecter." 
      }, { status: 401 });
    }
    
    if (!session?.user?.id) {
      console.log('❌ Aucune session valide');
      return NextResponse.json({ 
        error: "Non authentifié" 
      }, { status: 401 });
    }

    console.log('✅ Session valide pour utilisateur:', session.user.id);

    // Vérification des permissions
    if (!["ADMIN", "COMMERCIAL"].includes(session.user.role)) {
      console.log('❌ Permissions insuffisantes:', session.user.role);
      return NextResponse.json({ 
        error: "Accès refusé" 
      }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 1000); // Limite maximale
    const search = searchParams.get("search") || "";
    const role = searchParams.get("role") as Role;

    const skip = (page - 1) * limit;

    // Construction de la clause WHERE avec gestion d'erreur
    const where: any = {};

    // Filtrage par rôle avec validation
    if (role && Object.values(Role).includes(role)) {
      where.role = role;
    }

    // Filtrage par recherche
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { company: { contains: search, mode: "insensitive" } }
      ];
    }

    console.log('🔍 Clause WHERE:', JSON.stringify(where, null, 2));

    // Requête à la base de données avec gestion d'erreur
    let users, total;
    try {
      [users, total] = await Promise.all([
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
            createdAt: true,
            // Exclure les champs sensibles
          }
        }),
        prisma.user.count({ where })
      ]);

      console.log('✅ Utilisateurs trouvés:', users.length, 'Total:', total);
    } catch (dbError) {
      console.error('❌ Erreur base de données:', dbError);
      return NextResponse.json({ 
        error: "Erreur lors de l'accès à la base de données" 
      }, { status: 500 });
    }

    const totalPages = Math.ceil(total / limit);

    const response = {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      }
    };

    console.log('✅ Réponse API /api/users envoyée avec succès');
    return NextResponse.json(response);

  } catch (error) {
    console.error("❌ Erreur critique dans /api/users:", error);
    console.error("❌ Stack trace:", error.stack);
    
    return NextResponse.json(
      { 
        error: "Erreur serveur interne",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 API POST /api/users - Début');
    
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Seuls les admins peuvent créer des utilisateurs
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const body = await request.json();
    const { name, email, password, role, phone, company, address } = body;

    // Validation des champs obligatoires
    if (!name || !email || !password || !role) {
      return NextResponse.json({ 
        error: "Champs obligatoires manquants: name, email, password, role" 
      }, { status: 400 });
    }

    // Vérification email unique
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json({ 
        error: "Un utilisateur avec cet email existe déjà" 
      }, { status: 400 });
    }

    // Hashage du mot de passe
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(password, 12);

    // Création de l'utilisateur
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        phone,
        company,
        address,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        company: true,
        address: true,
        createdAt: true,
      }
    });

    console.log('✅ Utilisateur créé avec succès:', newUser.id);
    return NextResponse.json(newUser, { status: 201 });

  } catch (error) {
    console.error("❌ Erreur création utilisateur:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création de l'utilisateur" },
      { status: 500 }
    );
  }
}