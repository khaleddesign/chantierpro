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
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const user = await prisma.user.findUnique({
            where: {
              email: credentials.email
            }
          });

          if (!user || !user.password) {
            return null;
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          );

          if (!isPasswordValid) {
            return null;
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name || user.email,
            role: user.role,
            image: user.image || undefined,
            company: user.company || undefined,
          };
        } catch (error) {
          console.error('Erreur base de données auth:', error);
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