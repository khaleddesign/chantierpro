import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

export default async function Dashboard({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin");
  }

  // Laisser le middleware gérer les redirections par rôle pour éviter les conflits

  return (
    <DashboardLayout user={session.user}>
      {children}
    </DashboardLayout>
  );
}