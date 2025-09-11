import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

export default async function HomePage() {
  const session = await getServerSession(authOptions)
  
  if (session) {
    // Rediriger selon le rôle de l'utilisateur
    switch (session.user.role) {
      case 'ADMIN':
      case 'COMMERCIAL':
        redirect('/dashboard')
        break
      case 'CLIENT':
        redirect('/dashboard/client')
        break
      default:
        redirect('/dashboard')
    }
  } else {
    redirect('/auth/signin')
  }
}