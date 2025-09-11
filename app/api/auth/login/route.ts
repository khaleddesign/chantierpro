import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email et mot de passe requis" },
        { status: 400 }
      );
    }

    // Rechercher l'utilisateur
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
        role: true,
        company: true,
        image: true,
      }
    });

    if (!user || !user.password) {
      return NextResponse.json(
        { error: "Identifiants invalides" },
        { status: 401 }
      );
    }

    // Vérifier le mot de passe
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return NextResponse.json(
        { error: "Identifiants invalides" },
        { status: 401 }
      );
    }

    // Retourner les infos utilisateur (sans le mot de passe)
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json({
      message: "Connexion réussie",
      user: userWithoutPassword
    });

  } catch (error) {
    console.error("Erreur lors de la connexion:", error);
    return NextResponse.json(
      { error: "Erreur serveur interne" },
      { status: 500 }
    );
  }
}