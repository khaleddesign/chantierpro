'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { User, Mail, Phone, Building, MapPin, Save, Camera } from 'lucide-react';
import Avatar from '@/components/ui/avatar';

export default function ProfileForm() {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: (user as any)?.phone || '',
    company: (user as any)?.company || '',
    address: (user as any)?.address || ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Profil mis à jour avec succès' });
      } else {
        throw new Error('Erreur lors de la mise à jour');
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erreur lors de la mise à jour du profil' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!user) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Avatar name={user.name} role={user.role} size="xl" />
            <button className="absolute -bottom-1 -right-1 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white hover:bg-blue-700 transition-colors">
              <Camera size={14} />
            </button>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{user.name}</h2>
            <p className="text-gray-600">{user.email}</p>
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-1 ${
              user.role === 'ADMIN' ? 'bg-red-100 text-red-800' :
              user.role === 'COMMERCIAL' ? 'bg-green-100 text-green-800' :
              'bg-blue-100 text-blue-800'
            }`}>
              {user.role === 'ADMIN' ? 'Administrateur' : 
               user.role === 'COMMERCIAL' ? 'Commercial' : 'Client'}
            </span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {message && (
          <div className={`p-4 rounded-lg ${
            message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}>
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <User size={16} />
              Nom complet
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Votre nom complet"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Mail size={16} />
              Adresse email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="votre@email.com"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Phone size={16} />
              Téléphone
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="+33 6 12 34 56 78"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Building size={16} />
              Entreprise
            </label>
            <input
              type="text"
              value={formData.company}
              onChange={(e) => handleChange('company', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Nom de votre entreprise"
            />
          </div>
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <MapPin size={16} />
            Adresse
          </label>
          <textarea
            value={formData.address}
            onChange={(e) => handleChange('address', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Votre adresse complète"
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <Save size={18} />
            {loading ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </form>
    </div>
  );
}