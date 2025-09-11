"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, ReactNode } from "react";
import { Role } from "@prisma/client";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: Role[];
  fallbackUrl?: string;
}

export function ProtectedRoute({ 
  children, 
  allowedRoles, 
  fallbackUrl = "/auth/signin" 
}: ProtectedRouteProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return; // Toujours en cours de chargement

    if (!session) {
      router.push(fallbackUrl);
      return;
    }

    // Vérifier les rôles autorisés
    if (allowedRoles && !allowedRoles.includes(session.user.role)) {
      // Rediriger vers une page d'erreur ou dashboard par défaut
      switch (session.user.role) {
        case 'CLIENT':
          router.push('/dashboard/client');
          break;
        default:
          router.push('/dashboard');
      }
      return;
    }
  }, [session, status, router, allowedRoles, fallbackUrl]);

  // Afficher un loader pendant la vérification
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
          <div className="text-lg font-semibold text-gray-900">Vérification de l'authentification...</div>
        </div>
      </div>
    );
  }

  // Afficher une page d'erreur si pas de session
  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Accès non autorisé
          </h1>
          <p className="text-gray-600 mb-6">
            Vous devez être connecté pour accéder à cette page.
          </p>
        </div>
      </div>
    );
  }

  // Vérifier les rôles
  if (allowedRoles && !allowedRoles.includes(session.user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Accès refusé
          </h1>
          <p className="text-gray-600 mb-6">
            Vous n'avez pas les permissions nécessaires pour accéder à cette page.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}