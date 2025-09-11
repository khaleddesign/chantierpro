'use client';

import { useState, useEffect } from 'react';
import { Calendar, Clock, Users, MapPin, ArrowLeft, Edit, Trash2, Check, X, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToasts } from '@/hooks/useToasts';

interface PlanningDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function PlanningDetailPage({ params }: PlanningDetailPageProps) {
  const { id } = await params;
  const router = useRouter();
  const { success, error: showError } = useToasts();
  
  const [planning, setPlanning] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchPlanning();
  }, [id]);

  const fetchPlanning = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/planning/${id}`);
      
      if (response.ok) {
        const data = await response.json();
        setPlanning(data);
      } else {
        showError('Erreur', 'Planning introuvable');
        router.push('/dashboard/planning');
      }
    } catch (error) {
      console.error('Erreur chargement planning:', error);
      showError('Erreur', 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce planning ?')) {
      return;
    }

    try {
      setDeleting(true);
      const response = await fetch(`/api/planning/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        success('Succès', 'Planning supprimé avec succès');
        router.push('/dashboard/planning');
      } else {
        throw new Error('Erreur lors de la suppression');
      }
    } catch (error) {
      showError('Erreur', 'Erreur lors de la suppression');
    } finally {
      setDeleting(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      const response = await fetch(`/api/planning/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statut: newStatus })
      });

      if (response.ok) {
        const updatedPlanning = await response.json();
        setPlanning(updatedPlanning);
        success('Succès', 'Statut mis à jour');
      }
    } catch (error) {
      showError('Erreur', 'Erreur lors de la mise à jour');
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (statut: string) => {
    switch (statut) {
      case 'PLANIFIE': return 'bg-blue-500';
      case 'EN_COURS': return 'bg-orange-500';
      case 'TERMINE': return 'bg-green-500';
      case 'ANNULE': return 'bg-red-500';
      case 'REPORTE': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'RDV_CLIENT': return 'bg-blue-500';
      case 'PLANNING_CHANTIER': return 'bg-green-500';
      case 'LIVRAISON': return 'bg-orange-500';
      case 'INSPECTION': return 'bg-purple-500';
      case 'CONGES': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e40af 50%, #ea580c 100%)' }}>
        <div className="flex items-center gap-3 text-white">
          <div className="animate-spin w-8 h-8 border-2 border-white/30 border-t-white rounded-full"></div>
          Chargement du planning...
        </div>
      </div>
    );
  }

  if (!planning) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e40af 50%, #ea580c 100%)' }}>
        <div className="text-center text-white">
          <h2 className="text-2xl font-bold mb-4">Planning introuvable</h2>
          <Link href="/dashboard/planning" className="btn btn-primary">
            Retour au planning
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e40af 50%, #ea580c 100%)' }}>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard/planning"
              className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </Link>
            
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">{planning.titre}</h1>
              <div className="flex items-center gap-4 text-blue-100">
                <span className={`px-3 py-1 rounded-full text-white text-sm ${getTypeColor(planning.type)}`}>
                  {planning.type.replace('_', ' ')}
                </span>
                <span className={`px-3 py-1 rounded-full text-white text-sm ${getStatusColor(planning.statut)}`}>
                  {planning.statut}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {planning.statut === 'PLANIFIE' && (
              <>
                <button
                  onClick={() => handleStatusChange('EN_COURS')}
                  className="btn bg-orange-500 hover:bg-orange-600 text-white flex items-center gap-2"
                >
                  <Clock className="w-4 h-4" />
                  Démarrer
                </button>
                <button
                  onClick={() => handleStatusChange('TERMINE')}
                  className="btn bg-green-500 hover:bg-green-600 text-white flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  Terminer
                </button>
              </>
            )}
            
            {planning.statut === 'EN_COURS' && (
              <button
                onClick={() => handleStatusChange('TERMINE')}
                className="btn bg-green-500 hover:bg-green-600 text-white flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                Terminer
              </button>
            )}

            <button
              onClick={() => setEditing(true)}
              className="btn btn-ghost flex items-center gap-2"
            >
              <Edit className="w-4 h-4" />
              Modifier
            </button>
            
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="btn bg-red-500 hover:bg-red-600 text-white flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              {deleting ? 'Suppression...' : 'Supprimer'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Informations principales */}
          <div className="lg:col-span-2 space-y-6">
            {/* Détails de l'événement */}
            <div className="glass p-6">
              <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                <Calendar className="w-6 h-6" />
                Détails de l'événement
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-blue-100 text-sm mb-2">Date et heure de début</label>
                  <div className="text-white font-medium">
                    {formatDate(planning.dateDebut)}
                  </div>
                  <div className="text-blue-200">
                    {formatTime(planning.dateDebut)}
                  </div>
                </div>

                <div>
                  <label className="block text-blue-100 text-sm mb-2">Date et heure de fin</label>
                  <div className="text-white font-medium">
                    {formatDate(planning.dateFin)}
                  </div>
                  <div className="text-blue-200">
                    {formatTime(planning.dateFin)}
                  </div>
                </div>

                {planning.lieu && (
                  <div className="md:col-span-2">
                    <label className="block text-blue-100 text-sm mb-2 flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Lieu
                    </label>
                    <div className="text-white">{planning.lieu}</div>
                  </div>
                )}

                {planning.description && (
                  <div className="md:col-span-2">
                    <label className="block text-blue-100 text-sm mb-2">Description</label>
                    <div className="text-white">{planning.description}</div>
                  </div>
                )}

                {planning.notes && (
                  <div className="md:col-span-2">
                    <label className="block text-blue-100 text-sm mb-2">Notes</label>
                    <div className="text-white">{planning.notes}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Chantier lié */}
            {planning.chantier && (
              <div className="glass p-6">
                <h2 className="text-xl font-semibold text-white mb-4">Chantier associé</h2>
                <Link
                  href={`/dashboard/chantiers/${planning.chantier.id}`}
                  className="block p-4 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
                >
                  <div className="text-white font-medium">{planning.chantier.nom}</div>
                  {planning.chantier.adresse && (
                    <div className="text-blue-200 text-sm mt-1">{planning.chantier.adresse}</div>
                  )}
                </Link>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Organisateur */}
            <div className="glass p-6">
              <h3 className="text-white font-semibold mb-4">Organisateur</h3>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                  {planning.organisateur.name.charAt(0)}
                </div>
                <div>
                  <div className="text-white font-medium">{planning.organisateur.name}</div>
                  <div className="text-blue-200 text-sm">{planning.organisateur.role}</div>
                </div>
              </div>
            </div>

            {/* Participants */}
            {planning.participants && planning.participants.length > 0 && (
              <div className="glass p-6">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Participants ({planning.participants.length})
                </h3>
                
                <div className="space-y-3">
                  {planning.participants.map((participant: any) => (
                    <div key={participant.id} className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-medium text-sm">
                        {participant.name.charAt(0)}
                      </div>
                      <div>
                        <div className="text-white text-sm font-medium">{participant.name}</div>
                        <div className="text-blue-200 text-xs">{participant.role}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions rapides */}
            <div className="glass p-6">
              <h3 className="text-white font-semibold mb-4">Actions rapides</h3>
              
              <div className="space-y-3">
                <button className="w-full p-3 bg-white/10 hover:bg-white/20 rounded-lg text-white text-left transition-colors flex items-center gap-3">
                  <MessageCircle className="w-5 h-5" />
                  Envoyer un message
                </button>
                
                <button className="w-full p-3 bg-white/10 hover:bg-white/20 rounded-lg text-white text-left transition-colors flex items-center gap-3">
                  <Calendar className="w-5 h-5" />
                  Dupliquer l'événement
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
