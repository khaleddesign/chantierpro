"use client";

import { useState, useEffect } from "react";
import { Users, Search, Plus, Filter, Mail, Phone, Building2, MapPin, Edit, Trash2, UserCheck, UserX, Eye } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToastContext } from "@/components/providers/ToastProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Role } from "@prisma/client";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  phone?: string;
  company?: string;
  address?: string;
  ville?: string;
  codePostal?: string;
  image?: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    chantiers?: number;
    devis?: number;
  };
}

const roleColors = {
  ADMIN: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200' },
  COMMERCIAL: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200' },
  CLIENT: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200' },
  OUVRIER: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200' },
};

const roleLabels = {
  ADMIN: 'Administrateur',
  COMMERCIAL: 'Commercial',
  CLIENT: 'Client',
  OUVRIER: 'Ouvrier',
};

export default function UsersPage() {
  const { user } = useAuth();
  const { success, error: showError } = useToastContext();
  const router = useRouter();
  
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<Role | "TOUS">("TOUS");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [showNewUserModal, setShowNewUserModal] = useState(false);

  // Simuler le chargement des utilisateurs
  const mockUsers: User[] = [
    {
      id: '1',
      name: 'Jean Dupont',
      email: 'jean.dupont@email.com',
      role: 'ADMIN',
      phone: '06 12 34 56 78',
      company: 'ChantierPro SARL',
      address: '123 Rue de la Construction',
      ville: 'Lyon',
      codePostal: '69000',
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-02-01T14:30:00Z',
    },
    {
      id: '2',
      name: 'Marie Martin',
      email: 'marie.martin@email.com',
      role: 'COMMERCIAL',
      phone: '06 98 76 54 32',
      company: 'ChantierPro SARL',
      address: '456 Avenue des Bâtisseurs',
      ville: 'Villeurbanne',
      codePostal: '69100',
      createdAt: '2024-01-20T09:15:00Z',
      updatedAt: '2024-01-25T16:45:00Z',
      _count: { chantiers: 5, devis: 12 }
    },
    {
      id: '3',
      name: 'Sophie Durand',
      email: 'sophie.durand@email.com',
      role: 'CLIENT',
      phone: '06 11 22 33 44',
      company: 'Durand & Associés',
      address: '789 Boulevard de la République',
      ville: 'Lyon',
      codePostal: '69002',
      createdAt: '2024-02-01T11:20:00Z',
      updatedAt: '2024-02-15T13:10:00Z',
      _count: { chantiers: 2, devis: 3 }
    },
    {
      id: '4',
      name: 'Pierre Leroy',
      email: 'pierre.leroy@email.com',
      role: 'CLIENT',
      phone: '06 55 44 33 22',
      address: '321 Rue des Jardins',
      ville: 'Lyon',
      codePostal: '69003',
      createdAt: '2024-02-10T14:30:00Z',
      updatedAt: '2024-02-20T10:15:00Z',
      _count: { chantiers: 1, devis: 2 }
    },
  ];

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      
      // Récupérer tous les utilisateurs via l'API
      const response = await fetch('/api/users?limit=1000');
      
      if (response.ok) {
        const data = await response.json();
        console.log('API Users Response:', data);
        
        if (data.users && data.users.length > 0) {
          setUsers(data.users);
          console.log('Users loaded:', data.users.length);
        } else {
          console.log('No users found in API response');
          // Fallback: données d'exemple si aucun utilisateur n'existe
          setUsers(mockUsers);
        }
      } else {
        console.error('API Error:', response.status, response.statusText);
        // Fallback en cas d'erreur API
        setUsers(mockUsers);
      }
    } catch (error) {
      console.error('Erreur chargement utilisateurs:', error);
      // Fallback en cas d'erreur
      setUsers(mockUsers);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = !search || 
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.company?.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === "TOUS" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const handleViewUser = (userId: string) => {
    const selectedUser = users.find(u => u.id === userId);
    if (selectedUser) {
      alert(`Détails utilisateur:\nNom: ${selectedUser.name}\nEmail: ${selectedUser.email}\nRôle: ${selectedUser.role}\nEntreprise: ${selectedUser.company || 'Non renseignée'}`);
    }
  };

  const handleEditUser = (userId: string) => {
    const selectedUser = users.find(u => u.id === userId);
    if (selectedUser) {
      const newName = prompt('Nouveau nom:', selectedUser.name);
      if (newName && newName.trim()) {
        setUsers(prev => prev.map(u => 
          u.id === userId ? { ...u, name: newName.trim() } : u
        ));
        success('Succès', 'Utilisateur mis à jour avec succès');
      }
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      try {
        const response = await fetch(`/api/users/${userId}`, {
          method: 'DELETE'
        });
        
        if (response.ok) {
          setUsers(prev => prev.filter(u => u.id !== userId));
          success('Succès', 'Utilisateur supprimé avec succès');
        } else {
          throw new Error('Erreur lors de la suppression');
        }
      } catch (error: any) {
        showError('Erreur', error.message || 'Erreur lors de la suppression');
      }
    }
  };

  // Statistiques
  const totalUsers = users.length;
  const adminCount = users.filter(u => u.role === 'ADMIN').length;
  const commercialCount = users.filter(u => u.role === 'COMMERCIAL').length;
  const clientCount = users.filter(u => u.role === 'CLIENT').length;

  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg p-6 border h-24"></div>
              ))}
            </div>
            <div className="bg-white rounded-lg p-6 border">
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-4 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* En-tête */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestion des Utilisateurs</h1>
            <p className="text-gray-500">
              Gérez les comptes utilisateurs et leurs permissions
            </p>
          </div>
          {['ADMIN', 'COMMERCIAL'].includes(user?.role || '') && (
            <Link href="/dashboard/users/nouveau">
              <Button className="flex items-center gap-2">
                <Plus size={18} />
                Nouvel utilisateur
              </Button>
            </Link>
          )}
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{totalUsers}</p>
              </div>
              <Users size={24} className="text-gray-400" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Administrateurs</p>
                <p className="text-2xl font-bold text-red-900">{adminCount}</p>
              </div>
              <UserCheck size={24} className="text-red-400" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Commerciaux</p>
                <p className="text-2xl font-bold text-blue-900">{commercialCount}</p>
              </div>
              <Building2 size={24} className="text-blue-400" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Clients</p>
                <p className="text-2xl font-bold text-green-900">{clientCount}</p>
              </div>
              <UserX size={24} className="text-green-400" />
            </div>
          </div>
        </div>

        {/* Filtres */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-64">
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Rechercher par nom, email ou entreprise..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Filter size={18} className="text-gray-400" />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as Role | "TOUS")}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="TOUS">Tous les rôles</option>
                <option value="ADMIN">Administrateurs</option>
                <option value="COMMERCIAL">Commerciaux</option>
                <option value="CLIENT">Clients</option>
              </select>
            </div>
          </div>
        </div>

        {/* Liste des utilisateurs */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-3 px-6 font-medium text-gray-900">Utilisateur</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-900">Rôle</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-900">Contact</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-900">Entreprise</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-900">Statistiques</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-900">Inscrit le</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredUsers.map((userItem) => (
                  <tr key={userItem.id} className="hover:bg-gray-50">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                          {userItem.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{userItem.name}</div>
                          <div className="text-sm text-gray-500">{userItem.email}</div>
                        </div>
                      </div>
                    </td>
                    
                    <td className="py-4 px-6">
                      <div className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${roleColors[userItem.role].bg} ${roleColors[userItem.role].text} ${roleColors[userItem.role].border} border`}>
                        {roleLabels[userItem.role]}
                      </div>
                    </td>
                    
                    <td className="py-4 px-6">
                      <div className="space-y-1">
                        {userItem.phone && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Phone size={14} className="mr-1" />
                            {userItem.phone}
                          </div>
                        )}
                        <div className="flex items-center text-sm text-gray-600">
                          <Mail size={14} className="mr-1" />
                          {userItem.email}
                        </div>
                      </div>
                    </td>
                    
                    <td className="py-4 px-6">
                      <div className="space-y-1">
                        {userItem.company && (
                          <div className="flex items-center text-sm text-gray-900 font-medium">
                            <Building2 size={14} className="mr-1" />
                            {userItem.company}
                          </div>
                        )}
                        {(userItem.ville || userItem.address) && (
                          <div className="flex items-center text-sm text-gray-600">
                            <MapPin size={14} className="mr-1" />
                            {userItem.ville ? `${userItem.ville}` : userItem.address}
                          </div>
                        )}
                      </div>
                    </td>
                    
                    <td className="py-4 px-6">
                      {userItem._count && (
                        <div className="space-y-1 text-sm">
                          {userItem._count.chantiers !== undefined && (
                            <div className="text-gray-600">
                              {userItem._count.chantiers} chantier{userItem._count.chantiers > 1 ? 's' : ''}
                            </div>
                          )}
                          {userItem._count.devis !== undefined && (
                            <div className="text-gray-600">
                              {userItem._count.devis} devis
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                    
                    <td className="py-4 px-6">
                      <span className="text-sm text-gray-600">
                        {formatDate(userItem.createdAt)}
                      </span>
                    </td>
                    
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" onClick={() => router.push(`/dashboard/users/${userItem.id}`)}>
                          <Eye size={14} />
                        </Button>
                        
                        <Button size="sm" variant="outline" onClick={() => router.push(`/dashboard/users/${userItem.id}`)}>
                          <Edit size={14} />
                        </Button>
                        
                        {user?.role === 'ADMIN' && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleDeleteUser(userItem.id)}
                            className="text-red-600 hover:text-red-700 hover:border-red-300"
                          >
                            <Trash2 size={14} />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {filteredUsers.length === 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <Users size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun utilisateur trouvé</h3>
            <p className="text-gray-500">
              Aucun utilisateur ne correspond à vos critères de recherche
            </p>
          </div>
        )}
      </div>
    </div>
  );
}