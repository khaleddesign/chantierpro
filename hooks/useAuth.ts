import { useSession, signIn, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, useEffect, createContext } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  company?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (userData: any) => Promise<boolean>;
  error: string | null;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setError(null);
      
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Identifiants invalides');
        return false;
      }

      if (result?.ok) {
        return true;
      }

      return false;
    } catch (error) {
      console.error('Erreur de connexion:', error);
      setError('Erreur de connexion');
      return false;
    }
  };

  const logout = () => {
    signOut({ callbackUrl: '/auth/signin' });
  };

  const register = async (userData: any): Promise<boolean> => {
    try {
      setError(null);
      
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Erreur lors de l\'inscription');
        return false;
      }

      // Connexion automatique après inscription réussie
      const loginResult = await signIn('credentials', {
        email: userData.email,
        password: userData.password,
        redirect: false,
      });

      if (loginResult?.ok) {
        return true;
      } else {
        // Inscription réussie mais connexion échouée
        setError('Inscription réussie. Veuillez vous connecter.');
        setTimeout(() => {
          router.push('/auth/signin');
        }, 100);
        return true;
      }

    } catch (error) {
      console.error('Erreur lors de l\'inscription:', error);
      setError('Erreur de connexion lors de l\'inscription');
      return false;
    }
  };

  return {
    user: session?.user as User | null,
    login,
    register,
    logout,
    isLoading: status === 'loading',
    error,
    clearError: () => setError(null),
    isAuthenticated: !!session?.user,
  };
}

export function useRequireAuth() {
  const router = useRouter();
  const auth = useAuth();
  
  useEffect(() => {
    if (!auth.isLoading && !auth.user) {
      router.push('/auth/login');
    }
  }, [auth.isLoading, auth.user, router]);
  
  return auth;
}
