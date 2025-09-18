import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { Role } from "@prisma/client";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        console.log('🔐 NextAuth authorize called with:', {
          email: credentials?.email,
          hasPassword: !!credentials?.password,
          databaseUrl: process.env.DATABASE_URL?.substring(0, 50) + '...'
        });

        if (!credentials?.email || !credentials?.password) {
          console.log('❌ Credentials manquants');
          return null;
        }

        try {
          console.log('🔍 Recherche utilisateur:', credentials.email);
          const user = await prisma.user.findUnique({
            where: {
              email: credentials.email
            }
          });

          if (!user) {
            console.log('❌ Utilisateur non trouvé:', credentials.email);
            return null;
          }

          if (!user.password) {
            console.log('❌ Mot de passe manquant pour:', credentials.email);
            return null;
          }

          console.log('🔑 Vérification mot de passe pour:', credentials.email);
          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          );

          if (!isPasswordValid) {
            console.log('❌ Mot de passe invalide pour:', credentials.email);
            return null;
          }

          console.log('✅ Authentification réussie pour:', credentials.email);
          return {
            id: user.id,
            email: user.email,
            name: user.name || user.email,
            role: user.role,
            image: user.image || undefined,
            company: user.company || undefined,
          };
        } catch (error) {
          console.error('❌ Erreur base de données auth:', error);
          return null;
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.company = (user as any).company;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        // Récupérer l'utilisateur réel depuis la base de données pour obtenir l'ID correct
        const user = await prisma.user.findUnique({
          where: { email: session.user.email! },
          select: { id: true, role: true, company: true }
        });
        
        if (user) {
          session.user.id = user.id;
          session.user.role = user.role as Role;
          session.user.company = user.company as string;
        }
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Si l'URL contient un callbackUrl, l'utiliser
      if (url.includes('callbackUrl')) {
        const urlObj = new URL(url);
        const callbackUrl = urlObj.searchParams.get('callbackUrl');
        if (callbackUrl) {
          return callbackUrl;
        }
      }
      
      // Redirection par défaut vers la page d'accueil qui gère la redirection selon le rôle
      return baseUrl;
    }
  },
  pages: {
    signIn: "/auth/signin"
  },
  secret: process.env.NEXTAUTH_SECRET,
};