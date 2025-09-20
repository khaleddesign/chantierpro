import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { withRateLimit } from "@/lib/rate-limiter";
import { logLoginSuccess, logLoginFailed } from "@/lib/audit-logger";

async function loginHandler(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';
  
  let email = 'unknown';
  
  try {
    const body = await request.json();
    email = body.email || 'unknown';
    const { password } = body;

    if (!email || !password) {
      // Log tentative de connexion avec données manquantes
      await logLoginFailed(email, ip, userAgent, 'missing_credentials');
      
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
      // Log tentative de connexion avec utilisateur inexistant
      await logLoginFailed(email, ip, userAgent, 'user_not_found');
      
      return NextResponse.json(
        { error: "Identifiants invalides" },
        { status: 401 }
      );
    }

    // Vérifier le mot de passe
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      // Log tentative de connexion avec mot de passe incorrect
      await logLoginFailed(email, ip, userAgent, 'invalid_password');
      
      return NextResponse.json(
        { error: "Identifiants invalides" },
        { status: 401 }
      );
    }

    // Log connexion réussie
    await logLoginSuccess(user.id, ip, userAgent);

    // Retourner les infos utilisateur (sans le mot de passe)
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json({
      message: "Connexion réussie",
      user: userWithoutPassword
    });

  } catch (error) {
    console.error("Erreur lors de la connexion:", error);
    
    // Log erreur serveur
    await logLoginFailed(email, ip, userAgent, 'server_error');
    
    return NextResponse.json(
      { error: "Erreur serveur interne" },
      { status: 500 }
    );
  }
}

export const POST = withRateLimit(loginHandler, 'AUTH');