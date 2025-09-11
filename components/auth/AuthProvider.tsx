'use client';

import { ReactNode } from 'react';
import { AuthContext } from '@/hooks/useAuth';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const user = {
    id: 'admin-1',
    name: 'Admin Test',
    email: 'admin@test.com',
    role: 'ADMIN'
  };

  const login = async (email: string, password: string) => {
    return true; // Simulation toujours réussie
  };

  const logout = () => {
    // Simulation logout
  };

  const isLoading = false;

  return (
    <AuthContext.Provider value={{ user, login, register: async () => true, logout, isLoading, error: null, clearError: () => {}, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}
