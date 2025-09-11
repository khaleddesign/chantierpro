'use client';

import { useState, useEffect, Suspense } from 'react';
import { Calendar, Clock, Users, MapPin, ArrowLeft, Check, User, Building } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useRequireAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';

function NouveauPlanningPageContent() {
  useRequireAuth();
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [formData, setFormData] = useState({
    titre: '',
    description: '',
    type: 'REUNION',
    dateDebut: '',
    dateFin: '',
    lieu: '',
    notes: '',
    chantierId: searchParams.get('chantierId') || '',
    clientId: searchParams.get('clientId') || '',
    participantIds: [] as string[],
    recurrence: ''
  });
  
  const [saving, setSaving] = useState(false);
  const [chantiers, setChantiers] = useState<any[]>([]);
  const [utilisateurs, setUtilisateurs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Charger les chantiers et utilisateurs
  useEffect(() => {
    const loadData = async () => {
      try {
        const [chantiersRes, usersRes] = await Promise.all([
          fetch('/api/chantiers'),
          fetch('/api/users')
        ]);
        
        if (chantiersRes.ok) {
          const chantiersData = await chantiersRes.json();
          setChantiers(chantiersData.chantiers || []);
        }
        
        if (usersRes.ok) {
          const usersData = await usersRes.json();
          setUtilisateurs(usersData.users || []);
        }
      } catch (error) {
        console.error('Erreur chargement des données:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const response = await fetch('/api/planning', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          organisateurId: session?.user?.id || '',
          participantIds: formData.participantIds
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la création du planning');
      }

      const result = await response.json();
      alert('Planning créé avec succès !');
      router.push('/dashboard/planning');
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la création du planning');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleParticipantToggle = (userId: string) => {
    setFormData(prev => ({
      ...prev,
      participantIds: prev.participantIds.includes(userId)
        ? prev.participantIds.filter(id => id !== userId)
        : [...prev.participantIds, userId]
    }));
  };

  // Ajout d'un titre par défaut si on vient du CRM avec clientId
  useEffect(() => {
    if (searchParams.get('clientId')) {
      const clientId = searchParams.get('clientId');
      setFormData(prev => ({
        ...prev,
        titre: `RDV Client #${clientId}`,
        type: 'REUNION'
      }));
    }
  }, [searchParams]);

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Navigation */}
        <div className="flex items-center justify-between mb-8">
          <Link 
            href="/dashboard/planning"
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft size={20} />
            <span>Retour au planning</span>
          </Link>
        </div>

        {/* Titre */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Nouveau Planning</h1>
          <p className="text-gray-500">
            Créer un nouveau rendez-vous ou planning chantier
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Titre de l'événement *
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={formData.titre}
                    onChange={(e) => handleChange('titre', e.target.value)}
                    placeholder="Ex: Réunion équipe chantier"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Type d'événement *
                  </label>
                  <select
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={formData.type}
                    onChange={(e) => handleChange('type', e.target.value)}
                  >
                    <option value="REUNION" style={{ color: '#000' }}>📋 Réunion</option>
                    <option value="LIVRAISON" style={{ color: '#000' }}>🚚 Livraison</option>
                    <option value="INSPECTION" style={{ color: '#000' }}>🔍 Inspection</option>
                    <option value="AUTRE" style={{ color: '#000' }}>📌 Autre</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">
                      Date et heure de début *
                    </label>
                    <input
                      type="datetime-local"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      value={formData.dateDebut}
                      onChange={(e) => handleChange('dateDebut', e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-medium mb-2">
                      Date et heure de fin *
                    </label>
                    <input
                      type="datetime-local"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      value={formData.dateFin}
                      onChange={(e) => handleChange('dateFin', e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Lieu
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={formData.lieu}
                    onChange={(e) => handleChange('lieu', e.target.value)}
                    placeholder="Ex: Bureau, Chantier, Visioconférence"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Chantier (optionnel)
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={formData.chantierId}
                    onChange={(e) => handleChange('chantierId', e.target.value)}
                    disabled={loading}
                  >
                    <option value="" style={{ color: '#000' }}>Aucun chantier</option>
                    {chantiers.map(chantier => (
                      <option key={chantier.id} value={chantier.id} style={{ color: '#000' }}>
                        🏗️ {chantier.nom}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-3">
                    Participants
                  </label>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {loading ? (
                      <div className="text-gray-500 text-sm">Chargement des utilisateurs...</div>
                    ) : (
                      utilisateurs.map(user => (
                        <label
                          key={user.id}
                          className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={formData.participantIds.includes(user.id)}
                            onChange={() => handleParticipantToggle(user.id)}
                            className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500"
                          />
                          <User className="w-4 h-4 text-gray-600" />
                          <div className="flex-1">
                            <div className="text-gray-900 text-sm">{user.name}</div>
                            <div className="text-gray-600 text-xs">{user.role}</div>
                          </div>
                        </label>
                      ))
                    )}
                  </div>
                  {formData.participantIds.length > 0 && (
                    <div className="mt-2 text-sm text-blue-600">
                      {formData.participantIds.length} participant(s) sélectionné(s)
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    placeholder="Détails de l'événement..."
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Récurrence (optionnel)
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={formData.recurrence}
                    onChange={(e) => handleChange('recurrence', e.target.value)}
                  >
                    <option value="" style={{ color: '#000' }}>Pas de récurrence</option>
                    <option value="DAILY" style={{ color: '#000' }}>Tous les jours</option>
                    <option value="WEEKLY" style={{ color: '#000' }}>Toutes les semaines</option>
                    <option value="MONTHLY" style={{ color: '#000' }}>Tous les mois</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Notes additionnelles
                  </label>
                  <textarea
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={formData.notes}
                    onChange={(e) => handleChange('notes', e.target.value)}
                    placeholder="Notes internes..."
                  />
                </div>

                <div className="flex items-center justify-end space-x-4 pt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push('/dashboard/planning')}
                    disabled={saving}
                  >
                    Annuler
                  </Button>
                  <Button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-2"
                  >
                    {saving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Enregistrement...
                      </>
                    ) : (
                      'Enregistrer'
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>

          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h3 className="text-gray-900 font-semibold mb-4 flex items-center gap-2">
                <Users className="w-5 h-5" />
                Types d'événements
              </h3>
              
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <div className="w-3 h-3 bg-blue-400 rounded-full mt-1 flex-shrink-0"></div>
                  <div>
                    <div className="text-gray-900 font-medium">RDV Client</div>
                    <div className="text-gray-600">Rendez-vous commerciaux et présentations</div>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-3 h-3 bg-green-400 rounded-full mt-1 flex-shrink-0"></div>
                  <div>
                    <div className="text-gray-900 font-medium">Planning Chantier</div>
                    <div className="text-gray-600">Organisation des équipes sur site</div>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-3 h-3 bg-orange-400 rounded-full mt-1 flex-shrink-0"></div>
                  <div>
                    <div className="text-gray-900 font-medium">Livraison</div>
                    <div className="text-gray-600">Réception de matériaux et équipements</div>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-3 h-3 bg-purple-400 rounded-full mt-1 flex-shrink-0"></div>
                  <div>
                    <div className="text-gray-900 font-medium">Inspection</div>
                    <div className="text-gray-600">Contrôles qualité et conformité</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h3 className="text-gray-900 font-semibold mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Conseils
              </h3>
              
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p>Planifiez vos RDV clients en dehors des heures de chantier</p>
                </div>
                
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p>Prévoyez 30 minutes de battement entre les interventions</p>
                </div>
                
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p>Ajoutez tous les participants concernés pour éviter les conflits</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NouveauPlanningPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <NouveauPlanningPageContent />
    </Suspense>
  );
}
