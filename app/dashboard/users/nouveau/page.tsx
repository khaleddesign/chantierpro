'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  UserPlus, ArrowLeft, Save, Mail, Phone, Building2, MapPin, 
  User, Shield, DollarSign, Users, Eye, EyeOff
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToastContext } from '@/components/providers/ToastProvider';
import { Role, TypeClient } from '@prisma/client';
import Link from 'next/link';

const roleOptions = [
  { value: 'CLIENT', label: 'Client', description: 'Accès limité aux projets et devis', icon: User, color: 'text-green-600' },
  { value: 'COMMERCIAL', label: 'Commercial', description: 'Gestion des clients et des ventes', icon: Users, color: 'text-blue-600' },
  { value: 'ADMIN', label: 'Administrateur', description: 'Accès complet au système', icon: Shield, color: 'text-red-600' },
];

const typeClientOptions = [
  { value: 'PARTICULIER', label: 'Particulier' },
  { value: 'PROFESSIONNEL', label: 'Professionnel' },
  { value: 'SYNDIC', label: 'Syndic' },
  { value: 'PROMOTEUR', label: 'Promoteur' },
];

interface UserFormData {
  name: string;
  email: string;
  password: string;
  role: Role;
  phone: string;
  company: string;
  address: string;
  ville: string;
  codePostal: string;
  pays: string;
  typeClient: TypeClient;
  secteurActivite: string;
  effectif: string;
  chiffreAffaires: string;
  commercialId: string;
}

export default function NewUserPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { success, error: showError } = useToastContext();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [commerciaux, setCommerciaux] = useState<any[]>([]);

  const [formData, setFormData] = useState<UserFormData>({
    name: '',
    email: '',
    password: '',
    role: 'CLIENT',
    phone: '',
    company: '',
    address: '',
    ville: '',
    codePostal: '',
    pays: 'France',
    typeClient: 'PARTICULIER',
    secteurActivite: '',
    effectif: '',
    chiffreAffaires: '',
    commercialId: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    // Charger la liste des commerciaux pour l'assignation
    if (user?.role === 'ADMIN') {
      loadCommerciaux();
    } else if (user?.role === 'COMMERCIAL') {
      // Auto-assigner le commercial connecté
      setFormData(prev => ({ ...prev, commercialId: user.id }));
    }
  }, [user]);

  const loadCommerciaux = async () => {
    try {
      const response = await fetch('/api/users?role=COMMERCIAL&limit=100');
      if (response.ok) {
        const data = await response.json();
        setCommerciaux(data.users || []);
      }
    } catch (error) {
      console.error('Erreur chargement commerciaux:', error);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Le nom est obligatoire';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'L\'email est obligatoire';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Format d\'email invalide';
    }

    if (!formData.password) {
      newErrors.password = 'Le mot de passe est obligatoire';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Le mot de passe doit contenir au moins 6 caractères';
    }

    if (formData.role === 'CLIENT' && user?.role === 'ADMIN' && !formData.commercialId) {
      newErrors.commercialId = 'Veuillez sélectionner un commercial';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          effectif: formData.effectif ? parseInt(formData.effectif) : undefined,
          chiffreAffaires: formData.chiffreAffaires ? parseFloat(formData.chiffreAffaires) : undefined,
        }),
      });

      if (response.ok) {
        const newUser = await response.json();
        success('Succès', `Utilisateur ${newUser.name} créé avec succès`);
        router.push('/dashboard/users');
      } else {
        const errorData = await response.json();
        showError('Erreur', errorData.error || 'Erreur lors de la création');
      }
    } catch (error: any) {
      showError('Erreur', error.message || 'Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof UserFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Effacer l'erreur quand l'utilisateur commence à taper
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Vérification des permissions
  if (user && !['ADMIN', 'COMMERCIAL'].includes(user.role)) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="bg-white rounded-lg p-8 text-center">
            <Shield size={48} className="mx-auto text-red-500 mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Accès refusé</h1>
            <p className="text-gray-600 mb-6">Vous n'avez pas les permissions nécessaires pour créer des utilisateurs.</p>
            <Link href="/dashboard/users">
              <Button variant="outline">Retour à la liste</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/dashboard/users">
            <Button variant="outline" size="sm">
              <ArrowLeft size={18} />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Nouvel utilisateur</h1>
            <p className="text-gray-600">Créer un compte utilisateur dans le système</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Informations de base */}
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <User size={20} className="text-blue-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Informations de base</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom complet *
                </label>
                <Input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Jean Dupont"
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Adresse email *
                </label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="jean.dupont@email.com"
                  className={errors.email ? 'border-red-500' : ''}
                />
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mot de passe *
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    placeholder="••••••••"
                    className={errors.password ? 'border-red-500' : ''}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  >
                    {showPassword ? <EyeOff size={18} className="text-gray-400" /> : <Eye size={18} className="text-gray-400" />}
                  </button>
                </div>
                {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Téléphone
                </label>
                <Input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="06 12 34 56 78"
                />
              </div>
            </div>
          </div>

          {/* Rôle et permissions */}
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Shield size={20} className="text-purple-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Rôle et permissions</h2>
            </div>

            <div className="space-y-4">
              {roleOptions.map((option) => {
                // Les commerciaux ne peuvent créer que des clients
                if (user?.role === 'COMMERCIAL' && option.value !== 'CLIENT') {
                  return null;
                }
                
                const IconComponent = option.icon;
                return (
                  <div
                    key={option.value}
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${
                      formData.role === option.value 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleInputChange('role', option.value)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center`}>
                        <IconComponent size={16} className={option.color} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{option.label}</h3>
                        <p className="text-sm text-gray-600">{option.description}</p>
                      </div>
                      <input
                        type="radio"
                        name="role"
                        value={option.value}
                        checked={formData.role === option.value}
                        onChange={() => handleInputChange('role', option.value)}
                        className="w-4 h-4 text-blue-600"
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Assignment commercial pour les clients */}
            {formData.role === 'CLIENT' && user?.role === 'ADMIN' && (
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Commercial assigné *
                </label>
                <select
                  value={formData.commercialId}
                  onChange={(e) => handleInputChange('commercialId', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.commercialId ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Sélectionner un commercial</option>
                  {commerciaux.map((commercial) => (
                    <option key={commercial.id} value={commercial.id}>
                      {commercial.name} ({commercial.email})
                    </option>
                  ))}
                </select>
                {errors.commercialId && <p className="text-red-500 text-sm mt-1">{errors.commercialId}</p>}
              </div>
            )}
          </div>

          {/* Informations de contact et entreprise */}
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Building2 size={20} className="text-green-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Informations entreprise</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom de l'entreprise
                </label>
                <Input
                  type="text"
                  value={formData.company}
                  onChange={(e) => handleInputChange('company', e.target.value)}
                  placeholder="ChantierPro SARL"
                />
              </div>

              {formData.role === 'CLIENT' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type de client
                  </label>
                  <select
                    value={formData.typeClient}
                    onChange={(e) => handleInputChange('typeClient', e.target.value as TypeClient)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {typeClientOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Adresse
                </label>
                <Input
                  type="text"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="123 Rue de la Construction"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ville
                </label>
                <Input
                  type="text"
                  value={formData.ville}
                  onChange={(e) => handleInputChange('ville', e.target.value)}
                  placeholder="Lyon"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Code postal
                </label>
                <Input
                  type="text"
                  value={formData.codePostal}
                  onChange={(e) => handleInputChange('codePostal', e.target.value)}
                  placeholder="69000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pays
                </label>
                <Input
                  type="text"
                  value={formData.pays}
                  onChange={(e) => handleInputChange('pays', e.target.value)}
                  placeholder="France"
                />
              </div>

              {formData.role === 'CLIENT' && formData.typeClient === 'PROFESSIONNEL' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Secteur d'activité
                    </label>
                    <Input
                      type="text"
                      value={formData.secteurActivite}
                      onChange={(e) => handleInputChange('secteurActivite', e.target.value)}
                      placeholder="Construction, Rénovation..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Effectif
                    </label>
                    <Input
                      type="number"
                      value={formData.effectif}
                      onChange={(e) => handleInputChange('effectif', e.target.value)}
                      placeholder="10"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Chiffre d'affaires (€)
                    </label>
                    <Input
                      type="number"
                      value={formData.chiffreAffaires}
                      onChange={(e) => handleInputChange('chiffreAffaires', e.target.value)}
                      placeholder="100000"
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Boutons d'action */}
          <div className="flex items-center justify-end gap-4">
            <Link href="/dashboard/users">
              <Button type="button" variant="outline">
                Annuler
              </Button>
            </Link>
            <Button type="submit" disabled={loading} className="flex items-center gap-2">
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save size={18} />
              )}
              {loading ? 'Création...' : 'Créer l\'utilisateur'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}