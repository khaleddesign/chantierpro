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

  // Rediriger les clients vers leur espace dédié
  if (session.user.role === "CLIENT") {
    redirect("/dashboard/client");
  }

  return (
    <DashboardLayout user={session.user}>
      {children}
    </DashboardLayout>
  );
}