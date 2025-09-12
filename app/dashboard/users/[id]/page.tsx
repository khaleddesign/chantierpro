'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { User, Mail, Phone, Building, MapPin, Save, ArrowLeft, Key, Shield, Camera, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface UserData {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  address?: string;
  ville?: string;
  codePostal?: string;
  role: 'ADMIN' | 'COMMERCIAL' | 'CLIENT' | 'OUVRIER';
  typeClient?: 'PARTICULIER' | 'PROFESSIONNEL' | 'SYNDIC' | 'PROMOTEUR';
  secteurActivite?: string;
  effectif?: number;
  chiffreAffaires?: number;
  image?: string;
  commercialId?: string;
  password?: string; // For create mode
  createdAt: string;
  updatedAt: string;
}

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;
  const isCreateMode = userId === 'nouveau';
  
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      try {
        if (isCreateMode) {
          // Mode création - utilisateur vide avec valeurs par défaut
          const newUser: UserData = {
            id: '',
            name: '',
            email: '',
            phone: '',
            company: '',
            address: '',
            ville: '',
            codePostal: '',
            role: 'CLIENT',
            typeClient: 'PARTICULIER',
            secteurActivite: '',
            effectif: undefined,
            chiffreAffaires: undefined,
            image: '',
            commercialId: '',
            createdAt: '',
            updatedAt: ''
          };
          setUser(newUser);
        } else {
          // Mode modification - charger l'utilisateur existant depuis l'API
          const response = await fetch(`/api/users/${userId}`);
          if (response.ok) {
            const result = await response.json();
            if (result.success && result.data) {
              setUser(result.data);
            } else {
              console.error('Utilisateur non trouvé');
              router.push('/dashboard/users');
            }
          } else {
            console.error('Erreur lors du chargement de l\'utilisateur:', response.status);
            router.push('/dashboard/users');
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement de l\'utilisateur:', error);
        router.push('/dashboard/users');
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchUser();
    }
  }, [userId, isCreateMode, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    try {
      if (isCreateMode) {
        // Mode création - utiliser l'API de création d'utilisateur
        const response = await fetch('/api/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(user)
        });

        if (response.ok) {
          alert('Utilisateur créé avec succès !');
          router.push('/dashboard/users');
        } else {
          const error = await response.json();
          alert(`Erreur lors de la création: ${error.error || 'Erreur inconnue'}`);
        }
      } else {
        // Mode modification - utiliser l'API de mise à jour
        const response = await fetch(`/api/users/${userId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(user)
        });

        if (response.ok) {
          alert('Utilisateur mis à jour avec succès !');
          router.push('/dashboard/users');
        } else {
          const error = await response.json();
          alert(`Erreur lors de la mise à jour: ${error.error || 'Erreur inconnue'}`);
        }
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      const errorMessage = isCreateMode ? 'Erreur lors de la création' : 'Erreur lors de la sauvegarde';
      alert(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('Les mots de passe ne correspondent pas');
      return;
    }
    if (passwordData.newPassword.length < 12) {
      alert('Le mot de passe doit contenir au moins 12 caractères');
      return;
    }

    // Validation de la complexité du mot de passe (alignée sur l'API)
    const hasUpperCase = /[A-Z]/.test(passwordData.newPassword);
    const hasLowerCase = /[a-z]/.test(passwordData.newPassword);
    const hasNumbers = /\d/.test(passwordData.newPassword);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(passwordData.newPassword);

    if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
      alert('Le mot de passe doit contenir au moins : une majuscule, une minuscule, un chiffre et un caractère spécial');
      return;
    }

    setSaving(true);
    try {
      if (isCreateMode) {
        // En mode création, juste mettre à jour l'état local
        if (user) {
          setUser({ ...user, password: passwordData.newPassword });
          alert('Mot de passe défini avec succès !');
          setShowPasswordForm(false);
          setPasswordData({ newPassword: '', confirmPassword: '' });
        }
      } else {
        // En mode modification, envoyer la mise à jour du mot de passe à l'API
        const response = await fetch(`/api/users/${userId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            password: passwordData.newPassword
          })
        });

        if (response.ok) {
          alert('Mot de passe modifié avec succès !');
          setShowPasswordForm(false);
          setPasswordData({ newPassword: '', confirmPassword: '' });
        } else {
          const error = await response.json();
          alert(`Erreur lors du changement de mot de passe: ${error.error || 'Erreur inconnue'}`);
        }
      }
    } catch (error) {
      console.error('Erreur lors du changement de mot de passe:', error);
      alert('Erreur lors du changement de mot de passe');
    } finally {
      setSaving(false);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'from-red-500 to-red-600';
      case 'COMMERCIAL': return 'from-green-500 to-green-600';
      case 'CLIENT': return 'from-blue-500 to-blue-600';
      case 'OUVRIER': return 'from-orange-500 to-orange-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'Administrateur';
      case 'COMMERCIAL': return 'Commercial';
      case 'CLIENT': return 'Client';
      case 'OUVRIER': return 'Ouvrier';
      default: return role;
    }
  };

  const handleChange = (field: keyof UserData, value: any) => {
    if (!user) return;
    setUser({ ...user, [field]: value });
  };

  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="bg-white rounded-2xl p-8">
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-4 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center py-12">
            <Users size={64} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Utilisateur introuvable
            </h3>
            <p className="text-gray-500 mb-6">
              L'utilisateur que vous cherchez n'existe pas.
            </p>
            <Link href="/dashboard/users">
              <Button>Retour à la liste</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          
          {/* Navigation */}
          <div className="flex items-center justify-between mb-8">
            <Link 
              href="/dashboard/users"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft size={20} />
              <span>Retour aux utilisateurs</span>
            </Link>
          </div>

          {/* Titre */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {isCreateMode ? 'Créer un utilisateur' : 'Modifier l\'utilisateur'}
            </h1>
            <p className="text-gray-500">
              {isCreateMode 
                ? 'Ajoutez un nouvel utilisateur au système' 
                : `Gérez les informations de ${user.name}`
              }
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Formulaire principal */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900">Informations Personnelles</h3>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nom complet *
                    </label>
                    <input
                      type="text"
                      required
                      value={user.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={user.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Téléphone
                    </label>
                    <input
                      type="tel"
                      value={user.phone || ''}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rôle *
                    </label>
                    <select
                      required
                      value={user.role}
                      onChange={(e) => handleChange('role', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="ADMIN">Administrateur</option>
                      <option value="COMMERCIAL">Commercial</option>
                      <option value="CLIENT">Client</option>
                      <option value="OUVRIER">Ouvrier</option>
                    </select>
                  </div>

                  {user.role === 'CLIENT' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Type de client
                      </label>
                      <select
                        value={user.typeClient || ''}
                        onChange={(e) => handleChange('typeClient', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="">Sélectionner un type</option>
                        <option value="PARTICULIER">Particulier</option>
                        <option value="PROFESSIONNEL">Professionnel</option>
                        <option value="SYNDIC">Syndic</option>
                        <option value="PROMOTEUR">Promoteur</option>
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Entreprise
                    </label>
                    <input
                      type="text"
                      value={user.company || ''}
                      onChange={(e) => handleChange('company', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Adresse
                  </label>
                  <input
                    type="text"
                    value={user.address || ''}
                    onChange={(e) => handleChange('address', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ville
                    </label>
                    <input
                      type="text"
                      value={user.ville || ''}
                      onChange={(e) => handleChange('ville', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Code postal
                    </label>
                    <input
                      type="text"
                      value={user.codePostal || ''}
                      onChange={(e) => handleChange('codePostal', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-6 border-t border-gray-200">
                  <Button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                  >
                    <Save size={16} />
                    {saving ? 'Enregistrement...' : (isCreateMode ? 'Créer l\'utilisateur' : 'Enregistrer')}
                  </Button>
                  <Link href="/dashboard/users">
                    <Button variant="outline">
                      Annuler
                    </Button>
                  </Link>
                </div>
              </form>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              
              {/* Sécurité */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
                <div className="p-4 border-b border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900">Sécurité</h3>
                </div>
                <div className="p-4 space-y-4">
                  <button
                    onClick={() => setShowPasswordForm(!showPasswordForm)}
                    className="w-full flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Key size={20} className="text-gray-600" />
                    <span className="font-medium text-gray-900">
                      {isCreateMode ? 'Définir un mot de passe' : 'Changer le mot de passe'}
                    </span>
                  </button>

                  {showPasswordForm && (
                    <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Nouveau mot de passe
                        </label>
                        <input
                          type="password"
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Confirmer le mot de passe
                        </label>
                        <input
                          type="password"
                          value={passwordData.confirmPassword}
                          onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={handlePasswordChange}
                          disabled={saving}
                          className="flex-1 bg-red-500 hover:bg-red-600"
                        >
                          Modifier
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setShowPasswordForm(false)}
                          className="flex-1"
                        >
                          Annuler
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Informations */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
                <div className="p-4 border-b border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900">Informations</h3>
                </div>
                <div className="p-4 space-y-4">
                  {!isCreateMode && (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Créé le</span>
                        <span className="font-semibold text-gray-900">
                          {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Modifié le</span>
                        <span className="font-semibold text-gray-900">
                          {new Date(user.updatedAt).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    </>
                  )}
                  {isCreateMode && (
                    <div className="text-center py-4">
                      <span className="text-sm text-gray-500">Nouvel utilisateur</span>
                    </div>
                  )}
                  {user.chiffreAffaires && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">CA annuel</span>
                      <span className="font-semibold text-gray-900">
                        {user.chiffreAffaires.toLocaleString('fr-FR')} €
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}