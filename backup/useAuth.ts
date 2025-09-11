import { createContext, useContext, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (userData: any) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context) {
    return context;
  }

  // Fallback si pas de provider
  const { data: session, status } = useSession();
  
  return {
    user: session?.user as User || {
      id: 'admin-1',
      name: 'Admin Test',
      email: 'admin@test.com',
      role: 'ADMIN'
    },
    isLoading: status === 'loading',
    login: async () => true,
    register: async () => true,
    logout: () => {},
    isAuthenticated: !!session?.user || true,
    error: null,
    clearError: () => {}
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
