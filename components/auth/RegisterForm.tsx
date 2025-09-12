"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, Eye, EyeOff, AlertCircle, User, Mail, Phone, Building } from "lucide-react";
import Link from "next/link";

type TypeClient = 'PARTICULIER' | 'PROFESSIONNEL';
type Role = 'CLIENT' | 'COMMERCIAL' | 'ADMIN' | 'OUVRIER';

export function RegisterForm() {
  const { register, isLoading, error, clearError } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [userData, setUserData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    company: "",
    role: "CLIENT" as Role,
    typeClient: "PARTICULIER" as TypeClient,
  });

  const [passwordError, setPasswordError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setPasswordError("");

    // Validation des mots de passe
    if (userData.password !== userData.confirmPassword) {
      setPasswordError("Les mots de passe ne correspondent pas");
      return;
    }

    // Validation renforcée du mot de passe (aligné sur l'API)
    if (userData.password.length < 12) {
      setPasswordError("Le mot de passe doit contenir au moins 12 caractères");
      return;
    }

    const hasUpperCase = /[A-Z]/.test(userData.password);
    const hasLowerCase = /[a-z]/.test(userData.password);
    const hasNumbers = /\d/.test(userData.password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(userData.password);

    if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
      setPasswordError("Le mot de passe doit contenir au moins : une majuscule, une minuscule, un chiffre et un caractère spécial");
      return;
    }

    if (!userData.name || !userData.email || !userData.password) {
      return;
    }

    const { confirmPassword, ...registerData } = userData;
    const result = await register(registerData);
    
    if (result) {
      console.log("Inscription réussie");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setUserData(prev => ({ ...prev, [name]: value }));
    if (error) clearError();
    if (passwordError) setPasswordError("");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-xl">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-gradient-to-r from-green-600 to-blue-600 rounded-2xl flex items-center justify-center mb-4">
            <User className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Créer un compte
          </h2>
          <p className="text-sm text-gray-600">
            Rejoignez ChantierPro et gérez vos projets
          </p>
        </div>

        {/* Error Alert */}
        {(error || passwordError) && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
            <p className="text-sm text-red-600">{error || passwordError}</p>
          </div>
        )}

        {/* Form */}
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <Label htmlFor="name" className="text-gray-700 font-medium">
              Nom complet *
            </Label>
            <div className="relative mt-1">
              <Input
                id="name"
                name="name"
                type="text"
                required
                value={userData.name}
                onChange={handleChange}
                placeholder="Votre nom complet"
                className="pl-10"
                disabled={isLoading}
              />
              <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            </div>
          </div>

          <div>
            <Label htmlFor="email" className="text-gray-700 font-medium">
              Email *
            </Label>
            <div className="relative mt-1">
              <Input
                id="email"
                name="email"
                type="email"
                required
                value={userData.email}
                onChange={handleChange}
                placeholder="votre.email@exemple.com"
                className="pl-10"
                disabled={isLoading}
              />
              <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            </div>
          </div>

          <div>
            <Label htmlFor="phone" className="text-gray-700 font-medium">
              Téléphone
            </Label>
            <div className="relative mt-1">
              <Input
                id="phone"
                name="phone"
                type="tel"
                value={userData.phone}
                onChange={handleChange}
                placeholder="+33 1 23 45 67 89"
                className="pl-10"
                disabled={isLoading}
              />
              <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            </div>
          </div>

          <div>
            <Label htmlFor="role" className="text-gray-700 font-medium">
              Rôle *
            </Label>
            <select
              id="role"
              name="role"
              value={userData.role}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-input bg-background rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              disabled={isLoading}
              required
            >
              <option value="CLIENT">Client</option>
              <option value="COMMERCIAL">Commercial</option>
              <option value="ADMIN">Administrateur</option>
              <option value="OUVRIER">Ouvrier</option>
            </select>
          </div>

          <div>
            <Label htmlFor="typeClient" className="text-gray-700 font-medium">
              Type de client
            </Label>
            <select
              id="typeClient"
              name="typeClient"
              value={userData.typeClient}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-input bg-background rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              disabled={isLoading}
            >
              <option value="PARTICULIER">Particulier</option>
              <option value="PROFESSIONNEL">Professionnel</option>
            </select>
          </div>

          {userData.typeClient === 'PROFESSIONNEL' && (
            <div>
              <Label htmlFor="company" className="text-gray-700 font-medium">
                Entreprise
              </Label>
              <div className="relative mt-1">
                <Input
                  id="company"
                  name="company"
                  type="text"
                  value={userData.company}
                  onChange={handleChange}
                  placeholder="Nom de votre entreprise"
                  className="pl-10"
                  disabled={isLoading}
                />
                <Building className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="password" className="text-gray-700 font-medium">
              Mot de passe *
            </Label>
            <div className="relative mt-1">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                required
                value={userData.password}
                onChange={handleChange}
                placeholder="Au moins 12 caractères avec majuscules, chiffres et caractères spéciaux"
                className="pr-10"
                disabled={isLoading}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400" />
                )}
              </button>
            </div>
          </div>

          <div>
            <Label htmlFor="confirmPassword" className="text-gray-700 font-medium">
              Confirmer le mot de passe *
            </Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              value={userData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirmez votre mot de passe"
              className="mt-1"
              disabled={isLoading}
            />
          </div>

          <Button
            type="submit"
            className="w-full h-12 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-semibold rounded-lg shadow-lg transition-all duration-200"
            disabled={isLoading || !userData.name || !userData.email || !userData.password || !userData.confirmPassword}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Création du compte...
              </div>
            ) : (
              "Créer mon compte"
            )}
          </Button>
        </form>

        {/* Login link */}
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Déjà un compte ?{' '}
            <Link
              href="/auth/signin"
              className="font-semibold text-blue-600 hover:text-blue-500 transition-colors"
            >
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}