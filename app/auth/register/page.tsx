import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { RegisterForm } from "@/components/auth/RegisterForm";

export default async function RegisterPage() {
  const session = await getServerSession(authOptions);

  // Si déjà connecté, rediriger vers le dashboard approprié
  if (session) {
    switch (session.user.role) {
      case 'ADMIN':
      case 'COMMERCIAL':
        redirect('/dashboard');
        break;
      case 'CLIENT':
        redirect('/dashboard/client');
        break;
      default:
        redirect('/dashboard');
    }
  }

  return <RegisterForm />;
}