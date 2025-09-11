import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { LoginForm } from "@/components/auth/LoginForm";

export default async function SignInPage() {
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

  return <LoginForm />;
}