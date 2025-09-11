import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { ClientDashboardLayout } from "@/components/layout/ClientDashboardLayout";

export default async function ClientDashboard({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin");
  }

  // Seuls les clients peuvent accéder à cette zone
  if (session.user.role !== "CLIENT") {
    redirect("/dashboard");
  }

  return (
    <ClientDashboardLayout user={session.user}>
      {children}
    </ClientDashboardLayout>
  );
}