"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { User, Mail, Phone, Building, MapPin, Camera, Save, Key, Shield } from "lucide-react";

export default function ProfilePage() {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '06 12 34 56 78',
    company: (user as any)?.company || '',
    address: '15 Rue de la Paix, 75001 Paris',
    bio: 'Professionnel du BTP avec 10 ans d\'expérience',
    avatar: (user as any)?.avatar || 'JD'
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleSave = () => {
    // Ici on sauvegarderait les données
    console.log('Sauvegarde du profil:', formData);
    setIsEditing(false);
    // Simulation de la sauvegarde
    alert('Profil mis à jour avec succès !');
  };

  const handlePasswordChange = () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('Les mots de passe ne correspondent pas');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      alert('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }
    // Ici on changerait le mot de passe
    console.log('Changement de mot de passe');
    setShowPasswordForm(false);
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    alert('Mot de passe modifié avec succès !');
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'from-red-500 to-red-600';
      case 'COMMERCIAL': return 'from-green-500 to-green-600';
      case 'CLIENT': return 'from-blue-500 to-blue-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'Administrateur';
      case 'COMMERCIAL': return 'Commercial';
      case 'CLIENT': return 'Client';
      default: return role;
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 rounded-3xl p-8 text-white shadow-2xl">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="relative">
            <div className={`w-24 h-24 rounded-full bg-gradient-to-br ${getRoleColor(user?.role || '')} flex items-center justify-center text-white text-3xl font-bold shadow-xl`}>
              {formData.avatar}
            </div>
            <button className="absolute -bottom-2 -right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center text-blue-600 hover:bg-blue-50 transition-colors shadow-lg">
              <Camera size={16} />
            </button>
          </div>
          <div className="text-center md:text-left">
            <h1 className="text-3xl font-bold mb-2">{user?.name}</h1>
            <p className="text-xl text-blue-100 mb-2">{getRoleLabel(user?.role || '')}</p>
            <p className="text-blue-200">{user?.email}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Informations personnelles */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm">
          <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900 flex items-center">
                <User className="mr-2" size={24} />
                Informations Personnelles
              </h3>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  isEditing 
                    ? 'bg-gray-500 text-white hover:bg-gray-600' 
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
              >
                {isEditing ? 'Annuler' : 'Modifier'}
              </button>
            </div>
          </div>
          
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User size={16} className="inline mr-1" />
                  Nom complet
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <p className="px-4 py-3 bg-gray-50 rounded-lg">{formData.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Mail size={16} className="inline mr-1" />
                  Email
                </label>
                {isEditing ? (
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <p className="px-4 py-3 bg-gray-50 rounded-lg">{formData.email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Phone size={16} className="inline mr-1" />
                  Téléphone
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <p className="px-4 py-3 bg-gray-50 rounded-lg">{formData.phone}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Building size={16} className="inline mr-1" />
                  Entreprise
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) => setFormData({...formData, company: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <p className="px-4 py-3 bg-gray-50 rounded-lg">{formData.company}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin size={16} className="inline mr-1" />
                Adresse
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ) : (
                <p className="px-4 py-3 bg-gray-50 rounded-lg">{formData.address}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Biographie
              </label>
              {isEditing ? (
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({...formData, bio: e.target.value})}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ) : (
                <p className="px-4 py-3 bg-gray-50 rounded-lg">{formData.bio}</p>
              )}
            </div>

            {isEditing && (
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={handleSave}
                  className="flex items-center gap-2 bg-green-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-600 transition-colors"
                >
                  <Save size={16} />
                  Sauvegarder
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="bg-gray-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-600 transition-colors"
                >
                  Annuler
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Sécurité et paramètres */}
        <div className="space-y-6">
          
          {/* Sécurité */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
            <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-red-50 to-orange-50">
              <h3 className="text-lg font-bold text-gray-900 flex items-center">
                <Shield className="mr-2" size={20} />
                Sécurité
              </h3>
            </div>
            <div className="p-4 space-y-4">
              <button
                onClick={() => setShowPasswordForm(!showPasswordForm)}
                className="w-full flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Key size={20} className="text-gray-600" />
                <span className="font-medium text-gray-900">Changer le mot de passe</span>
              </button>

              {showPasswordForm && (
                <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mot de passe actuel
                    </label>
                    <input
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nouveau mot de passe
                    </label>
                    <input
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handlePasswordChange}
                      className="flex-1 bg-red-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-600 transition-colors"
                    >
                      Modifier
                    </button>
                    <button
                      onClick={() => setShowPasswordForm(false)}
                      className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-400 transition-colors"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              )}

              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 text-green-700">
                  <Shield size={16} />
                  <span className="text-sm font-medium">Compte sécurisé</span>
                </div>
                <p className="text-xs text-green-600 mt-1">
                  Dernière connexion: Aujourd'hui à 09:30
                </p>
              </div>
            </div>
          </div>

          {/* Statistiques */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
            <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
              <h3 className="text-lg font-bold text-gray-900">Activité</h3>
            </div>
            <div className="p-4 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Projets</span>
                <span className="font-semibold text-gray-900">12</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Messages envoyés</span>
                <span className="font-semibold text-gray-900">247</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Compte créé</span>
                <span className="font-semibold text-gray-900">Jan 2024</span>
              </div>
            </div>
          </div>

        </div>
      </div>
        </div>
      </div>
    </div>
  );
}
