import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';
import { Role } from '@prisma/client';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
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
            return null;
          }

          const isValidPassword = await bcrypt.compare(credentials.password, user.password);

          if (!isValidPassword) {
            return null;
          }

          return {
            id: user.id,
            name: user.name || user.email.split('@')[0],
            email: user.email,
            role: user.role,
            company: user.company || undefined,
            image: user.image || undefined,
          };
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      }
    })
  ],
  
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.name = user.name || user.email?.split('@')[0] || 'Utilisateur';
        token.email = user.email;
        token.role = user.role;
        token.company = user.company;
        token.image = user.image;

        if (process.env.NODE_ENV === 'development') {
          console.log('🔑 JWT:', user.id);
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (token) {
        session.user = {
          id: token.id as string,
          name: token.name as string,
          email: token.email as string,
          role: token.role as Role,
          company: token.company as string,
          image: token.image as string,
        };

        if (process.env.NODE_ENV === 'development') {
          console.log('👤 Session:', session.user.id);
        }
      }
      return session;
    },

    async redirect({ url, baseUrl }) {
      // Si l'URL contient un callbackUrl, l'utiliser
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // Sinon, rediriger vers le dashboard par défaut
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    }
  },
  
  // Configuration explicite des cookies pour fiabiliser l'envoi du token en production (Vercel)
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production'
        ? '__Secure-next-auth.session-token'
        : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax', // plus permissif que 'strict' pour les appels API cross-subtree
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // ✅ 30 jours au lieu de 4 heures
    updateAge: 24 * 60 * 60,    // ✅ Mise à jour toutes les 24h
  },
  
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',

  // ✅ CONFIGURATION COOKIES OPTIMISÉE POUR VERCEL (appuie la section cookies ci-dessus)
  useSecureCookies: process.env.NODE_ENV === 'production',

  jwt: {
    maxAge: 30 * 24 * 60 * 60, // ✅ 30 jours
  },
};