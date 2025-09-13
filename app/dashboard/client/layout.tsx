"use client";

import { useAuth } from "@/hooks/useAuth";
import { ClientDashboardLayout } from "@/components/layout/ClientDashboardLayout";
import { ClientOnly } from "@/components/ui/ClientOnly";

export default function ClientDashboard({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClientOnly>
      <ClientDashboardContent>
        {children}
      </ClientDashboardContent>
    </ClientOnly>
  );
}

function ClientDashboardContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <div className="w-8 h-8 bg-white rounded-lg"></div>
          </div>
          <div className="text-lg font-semibold text-gray-900">Chargement...</div>
        </div>
      </div>
    );
  }

  // Let middleware handle role redirects to avoid loops
  if (user.role !== "CLIENT") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg font-semibold text-gray-900">Accès non autorisé</div>
        </div>
      </div>
    );
  }

  return (
    <ClientDashboardLayout user={user}>
      {children}
    </ClientDashboardLayout>
  );
}