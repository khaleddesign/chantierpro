'use client';

import { useState, useEffect } from 'react';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'COMMERCIAL' | 'CLIENT';
  phone?: string;
  company?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  lastLogin?: string | null;
}

interface UseUsersOptions {
  search?: string;
  role?: string;
  page?: number;
  limit?: number;
}

export function useUsers(options: UseUsersOptions = {}) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (options.search) params.append('search', options.search);
      if (options.role) params.append('role', options.role);
      if (options.page) params.append('page', options.page.toString());
      if (options.limit) params.append('limit', options.limit.toString());

      const response = await fetch(`/api/users?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des utilisateurs');
      }

      const data = await response.json();
      
      if (data.success) {
        setUsers(data.users);
        setPagination(data.pagination);
      } else {
        throw new Error(data.error || 'Erreur inconnue');
      }

    } catch (err) {
      console.error('Erreur useUsers:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  const createUser = async (userData: Omit<User, 'id' | 'status' | 'createdAt' | 'lastLogin'> & { password: string }) => {
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erreur lors de la création');
      }

      // Rafraîchir la liste
      await fetchUsers();
      
      return data.user;
    } catch (err) {
      console.error('Erreur createUser:', err);
      throw err;
    }
  };

  const updateUser = async (userId: string, userData: Partial<User>) => {
    try {
      const response = await fetch(`/api/users?id=${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erreur lors de la mise à jour');
      }

      // Rafraîchir la liste
      await fetchUsers();
      
      return data.user;
    } catch (err) {
      console.error('Erreur updateUser:', err);
      throw err;
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      const response = await fetch(`/api/users?id=${userId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erreur lors de la suppression');
      }

      // Rafraîchir la liste
      await fetchUsers();
      
      return data.user;
    } catch (err) {
      console.error('Erreur deleteUser:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [options.search, options.role, options.page, options.limit]);

  return {
    users,
    loading,
    error,
    pagination,
    actions: {
      refresh: fetchUsers,
      create: createUser,
      update: updateUser,
      delete: deleteUser,
    }
  };
}
