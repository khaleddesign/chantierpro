import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { Role, TypeClient } from "@prisma/client";
import { withRateLimit } from "@/lib/rate-limiter";

async function registerHandler(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      name, 
      email, 
      password, 
      phone, 
      company, 
      typeClient = "PARTICULIER",
      role = "CLIENT"
    } = body;

    // Validation des champs obligatoires
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Nom, email et mot de passe sont obligatoires" },
        { status: 400 }
      );
    }

    // Validation de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Format d'email invalide" },
        { status: 400 }
      );
    }

    // SÉCURITÉ CRITIQUE: Validation renforcée du mot de passe
    if (password.length < 12) {
      return NextResponse.json(
        { error: "Le mot de passe doit contenir au moins 12 caractères" },
        { status: 400 }
      );
    }

    // Vérifier la complexité du mot de passe
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
      return NextResponse.json(
        { 
          error: "Le mot de passe doit contenir au moins : une majuscule, une minuscule, un chiffre et un caractère spécial (!@#$%^&*(),.?\":{}|<>)" 
        },
        { status: 400 }
      );
    }

    // Vérifier les motifs de passe faibles courants
    const weakPatterns = [
      /^(.)\1+$/, // Répétition d'un seul caractère
      /123456|654321|qwerty|password|admin|azerty/i, // Motifs courants
      new RegExp(name?.replace(/\s/g, '') || '', 'i'), // Nom dans le mot de passe
      new RegExp(email?.split('@')[0] || '', 'i') // Email dans le mot de passe
    ];

    if (weakPatterns.some(pattern => pattern.test(password))) {
      return NextResponse.json(
        { error: "Le mot de passe est trop prévisible. Évitez d'utiliser votre nom, email ou des motifs courants." },
        { status: 400 }
      );
    }

    try {
      // Vérifier si l'utilisateur existe déjà
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });

      if (existingUser) {
        return NextResponse.json(
          { error: "Un utilisateur avec cet email existe déjà" },
          { status: 409 }
        );
      }

      // Hacher le mot de passe
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Créer l'utilisateur
      const user = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          phone: phone || null,
          company: company || null,
          role: role as Role,
          typeClient: typeClient as TypeClient,
          prefEmail: true,
          prefSMS: false,
          prefAppel: true,
          pays: "France"
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          company: true,
          typeClient: true,
          createdAt: true
        }
      });

      return NextResponse.json(
        { 
          message: "Inscription réussie",
          user 
        },
        { status: 201 }
      );

    } catch (dbError) {
      console.error("Erreur base de données lors de l'inscription:", dbError);
      
      // SÉCURITÉ: Plus de fallback - échec si base de données inaccessible
      return NextResponse.json(
        { error: "Service temporairement indisponible. Veuillez réessayer plus tard." },
        { status: 503 }
      );
    }

  } catch (error) {
    console.error("Erreur lors de l'inscription:", error);
    return NextResponse.json(
      { error: "Erreur serveur interne" },
      { status: 500 }
    );
  }
}

// Appliquer le rate limiting pour les tentatives d'inscription
export const POST = withRateLimit(registerHandler, 'AUTH');