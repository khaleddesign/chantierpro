"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ChantierStatus } from '@prisma/client';
import ChantierEtapes from './components/ChantierEtapes';
import AssignmentPanel from './components/AssignmentPanel';
import ChantierPhotos from './components/ChantierPhotos';
import ChantierTimeline from './components/ChantierTimeline';
import ChantierDocuments from './components/ChantierDocuments';
import ChantierMessages from './components/ChantierMessages';
import ChantierHero from "@/components/chantiers/ChantierHero";
import ChantierTabs from "@/components/chantiers/ChantierTabs";
import { Calendar, Users, Image, MessageSquare, Clipboard, ArrowLeft, MapPin, Mail, Phone, FileText } from 'lucide-react';

interface Chantier {
  id: string;
  nom: string;
  description: string;
  adresse: string;
  statut: ChantierStatus;
  progression: number;
  dateDebut: string;
  dateFin: string;
  budget: number;
  superficie: string;
  photo?: string;
  photos: string[];
  lat?: number;
  lng?: number;
  client: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    company?: string;
    address?: string;
  };
  assignees: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    phone?: string;
  }>;
  timeline: Array<{
    id: string;
    titre: string;
    description: string;
    date: string;
    type: 'DEBUT' | 'ETAPE' | 'PROBLEME' | 'FIN' | 'ATTENTE' | 'NOTE';
    createdBy: {
      id: string;
      name: string;
      role: string;
    };
  }>;
  comments: Array<{
    id: string;
    message: string;
    photos: string[];
    createdAt: string;
    auteur: {
      name: string;
      role: string;
    };
  }>;
  messages: Array<{
    id: string;
    message: string;
    photos: string[];
    createdAt: string;
    expediteur: {
      id: string;
      name: string;
      role: string;
    };
  }>;
  documents?: any[];
  _count: {
    timeline: number;
    comments: number;
    messages: number;
    devis: number;
    documents: number;
    etapes: number;
  };
}

export default function ChantierDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [chantier, setChantier] = useState<Chantier | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("informations");
  const [newMessage, setNewMessage] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    nom: "",
    description: "",
    statut: "",
    progression: 0,
    budget: 0,
    superficie: "",
    dateDebut: "",
    dateFin: ""
  });

  const mockChantier: Chantier = {
    id: "1",
    nom: "Rénovation Villa Moderne",
    description: "Rénovation complète d'une villa de 200m² avec extension moderne, nouvelle cuisine équipée, salle de bain avec spa, terrasse avec piscine et aménagement paysager. Isolation thermique renforcée et installation de panneaux solaires pour une approche éco-responsable.",
    adresse: "15 Avenue des Pins, 06400 Cannes",
    statut: "EN_COURS" as ChantierStatus,
    progression: 65,
    dateDebut: "2024-03-15",
    dateFin: "2024-08-30",
    budget: 120000,
    superficie: "200m²",
    photo: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&h=400&fit=crop",
    photos: [
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&h=300&fit=crop",
      "https://images.unsplash.com/photo-1600607688960-e095c75bb04f?w=400&h=300&fit=crop",
      "https://images.unsplash.com/photo-1600607687644-aac4c3eac7f4?w=400&h=300&fit=crop",
      "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=400&h=300&fit=crop"
    ],
    lat: 43.5528,
    lng: 7.0174,
    client: {
      id: "client-1",
      name: "Marie Dubois",
      email: "marie.dubois@email.com",
      phone: "+33 6 12 34 56 78",
      company: "Dubois Immobilier",
      address: "12 Rue de la République, 06400 Cannes"
    },
    assignees: [
      {
        id: "user-1",
        name: "Pierre Maçon",
        email: "pierre.macon@chantierpro.fr",
        role: "OUVRIER",
        phone: "+33 6 87 65 43 21"
      },
      {
        id: "user-2",
        name: "Julie Électricienne",
        email: "julie.elec@chantierpro.fr",
        role: "OUVRIER",
        phone: "+33 6 11 22 33 44"
      }
    ],
    timeline: [
      {
        id: "1",
        titre: "Démolition terminée",
        description: "Démolition de l'ancienne cuisine et de la salle de bain principales. Évacuation des gravats effectuée.",
        date: "2024-04-15T10:30:00Z",
        type: "ETAPE",
        createdBy: { id: "user-1", name: "Pierre Maçon", role: "OUVRIER" }
      },
      {
        id: "2",
        titre: "Début des travaux de plomberie",
        description: "Installation des nouvelles canalisations pour la cuisine et les salles de bain. Raccordement en cours.",
        date: "2024-04-10T14:00:00Z",
        type: "ETAPE",
        createdBy: { id: "user-3", name: "Marie Dupont", role: "COMMERCIAL" }
      },
      {
        id: "3",
        titre: "Chantier démarré",
        description: "Le chantier de rénovation a officiellement commencé. Livraison des matériaux effectuée.",
        date: "2024-03-15T08:00:00Z",
        type: "DEBUT",
        createdBy: { id: "user-4", name: "Jean Superviseur", role: "ADMIN" }
      }
    ],
    comments: [
      {
        id: "1",
        message: "Très satisfaite des travaux jusqu'à présent. L'équipe est professionnelle et respecte les délais.",
        photos: [],
        createdAt: "2024-04-12T16:30:00Z",
        auteur: { name: "Marie Dubois", role: "CLIENT" }
      },
      {
        id: "2",
        message: "Photo du mur porteur avant démolition pour validation. Tout est conforme au plan.",
        photos: ["https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=300&h=200&fit=crop"],
        createdAt: "2024-04-08T11:15:00Z",
        auteur: { name: "Pierre Maçon", role: "OUVRIER" }
      }
    ],
    messages: [
      {
        id: "1",
        message: "Bonjour Marie, les carrelages que vous avez choisis sont arrivés. Nous pouvons commencer la pose dès demain si vous confirmez.",
        photos: [],
        createdAt: "2024-04-16T09:15:00Z",
        expediteur: { id: "user-1", name: "Pierre Maçon", role: "OUVRIER" }
      },
      {
        id: "2",
        message: "Parfait ! Vous pouvez y aller. J'ai hâte de voir le résultat 😊",
        photos: [],
        createdAt: "2024-04-16T09:45:00Z",
        expediteur: { id: "user-2", name: "Marie Dubois", role: "CLIENT" }
      }
    ],
    _count: {
      timeline: 3,
      comments: 2,
      messages: 15,
      devis: 1,
      documents: 5,
      etapes: 8
    }
  };

  const fetchChantier = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/chantiers/${params.id}`);
      
      if (response.ok) {
        const data = await response.json();
        setChantier(data);
      } else {
        console.error('Erreur API:', response.status);
        setChantier(null);
      }
    } catch (error) {
      console.error('Erreur:', error);
      setChantier(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (params.id) {
      fetchChantier();
    }
  }, [params.id]);

  const tabs = [
    { id: "informations", label: "Informations", icon: <Clipboard size={18} /> },
    { id: "timeline", label: "Timeline", icon: <Calendar size={18} />, count: chantier?._count?.timeline || 0 },
    { id: "photos", label: "Photos", icon: <Image size={18} />, count: chantier?.photos?.length || 0 },
    { id: "documents", label: "Documents", icon: <FileText size={18} />, count: chantier?._count?.documents || 0 },
    { id: "messages", label: "Messages", icon: <MessageSquare size={18} />, count: chantier?._count?.messages || 0 },
    { id: "equipe", label: "Équipe", icon: <Users size={18} />, count: chantier?.assignees?.length || 0 },
    { id: "etapes", label: "Étapes", icon: <Calendar size={18} />, count: chantier?._count?.etapes || 0 }
  ];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    console.log("Envoi message:", newMessage);
    setNewMessage("");
  };

  const handleDelete = async () => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce chantier ? Cette action peut être annulée par un administrateur.")) {
      return;
    }

    try {
      const response = await fetch(`/api/chantiers/${params.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        router.push('/dashboard/chantiers');
      } else {
        const error = await response.json();
        alert(`Erreur: ${error.error}`);
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      alert('Erreur lors de la suppression');
    }
  };

  const handleEdit = () => {
    if (!chantier) return;
    setEditData({
      nom: chantier.nom,
      description: chantier.description,
      statut: chantier.statut,
      progression: chantier.progression,
      budget: chantier.budget,
      superficie: chantier.superficie,
      dateDebut: chantier.dateDebut.split('T')[0],
      dateFin: chantier.dateFin.split('T')[0]
    });
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    try {
      const response = await fetch(`/api/chantiers/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editData),
      });

      if (response.ok) {
        await fetchChantier(); // Recharger les données
        setIsEditing(false);
      } else {
        console.error('Erreur lors de la mise à jour');
      }
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditData({
      nom: "",
      description: "",
      statut: "",
      progression: 0,
      budget: 0,
      superficie: "",
      dateDebut: "",
      dateFin: ""
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!chantier) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
        <div className="text-red-500 text-5xl mb-4">❌</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Chantier introuvable</h2>
        <Link href="/dashboard/chantiers" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          Retour aux chantiers
        </Link>
      </div>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case "informations":
        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Description du projet
                  </h3>
                  {!isEditing && (
                    <button
                      onClick={handleEdit}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Modifier
                    </button>
                  )}
                </div>
                
                {isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nom du chantier</label>
                      <input
                        type="text"
                        value={editData.nom}
                        onChange={(e) => setEditData({ ...editData, nom: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <textarea
                        value={editData.description}
                        onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                        <select
                          value={editData.statut}
                          onChange={(e) => setEditData({ ...editData, statut: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="PLANIFIE">Planifié</option>
                          <option value="EN_COURS">En cours</option>
                          <option value="EN_ATTENTE">En attente</option>
                          <option value="TERMINE">Terminé</option>
                          <option value="ANNULE">Annulé</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Progression (%)</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={editData.progression}
                          onChange={(e) => setEditData({ ...editData, progression: parseInt(e.target.value) || 0 })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Budget (€)</label>
                        <input
                          type="number"
                          value={editData.budget}
                          onChange={(e) => setEditData({ ...editData, budget: parseFloat(e.target.value) || 0 })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Superficie</label>
                        <input
                          type="text"
                          value={editData.superficie}
                          onChange={(e) => setEditData({ ...editData, superficie: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Date de début</label>
                        <input
                          type="date"
                          value={editData.dateDebut}
                          onChange={(e) => setEditData({ ...editData, dateDebut: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Date de fin</label>
                        <input
                          type="date"
                          value={editData.dateFin}
                          onChange={(e) => setEditData({ ...editData, dateFin: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <div className="flex gap-3 pt-4">
                      <button
                        onClick={handleSaveEdit}
                        className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Sauvegarder
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-gray-600 leading-relaxed mb-6">
                      {chantier.description}
                    </p>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="text-gray-500 text-sm block mb-1">
                      Date de début
                    </label>
                    <p className="text-gray-900 font-medium">
                      {new Date(chantier.dateDebut).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <div>
                    <label className="text-gray-500 text-sm block mb-1">
                      Date de fin prévue
                    </label>
                    <p className="text-gray-900 font-medium">
                      {new Date(chantier.dateFin).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <div>
                    <label className="text-gray-500 text-sm block mb-1">
                      Budget total
                    </label>
                    <p className="text-emerald-600 font-semibold text-lg">
                      {chantier.budget.toLocaleString('fr-FR')} €
                    </p>
                  </div>
                  <div>
                    <label className="text-gray-500 text-sm block mb-1">
                      Superficie
                    </label>
                    <p className="text-gray-900 font-medium">
                      {chantier.superficie}
                    </p>
                  </div>
                </div>
              </div>

              {chantier.lat && chantier.lng && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Localisation
                  </h3>
                  <p className="text-gray-600 mb-4 flex items-center gap-2">
                    <MapPin size={16} className="text-gray-400" />
                    {chantier.adresse}
                  </p>
                  <div className="h-[300px] bg-gray-100 rounded-lg flex items-center justify-center text-gray-500">
                    🗺️ Carte interactive (Lat: {chantier.lat}, Lng: {chantier.lng})
                  </div>
                </div>
              )}
            </div>

            <div>
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Informations client
                </h3>
                <div className="flex items-center gap-4 mb-4 pb-4 border-b border-gray-100">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center text-white text-lg font-bold">
                    {chantier?.client?.name?.charAt(0) || '?'}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {chantier?.client?.name || 'Client inconnu'}
                    </p>
                    {chantier?.client?.company && (
                      <p className="text-gray-500 text-sm">
                        {chantier.client.company}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-gray-500 text-sm block mb-1">
                      Email
                    </label>
                    <a href={`mailto:${chantier?.client?.email || ''}`} className="text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1">
                      <Mail size={14} />
                      {chantier?.client?.email || 'Email non disponible'}
                    </a>
                  </div>

                  {chantier?.client?.phone && (
                    <div>
                      <label className="text-gray-500 text-sm block mb-1">
                        Téléphone
                      </label>
                      <a href={`tel:${chantier?.client?.phone || ''}`} className="text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1">
                        <Phone size={14} />
                        {chantier?.client?.phone || 'Téléphone non disponible'}
                      </a>
                    </div>
                  )}

                  {chantier?.client?.address && (
                    <div>
                      <label className="text-gray-500 text-sm block mb-1">
                        Adresse
                      </label>
                      <p className="text-gray-900 flex items-center gap-1">
                        <MapPin size={14} className="text-gray-400" />
                        {chantier?.client?.address || 'Adresse non disponible'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      case "equipe":
        return (
          <div>
            <AssignmentPanel 
              chantierId={chantier.id} 
              assignees={chantier.assignees}
              onAssignmentChange={(newAssignees) => {
                setChantier({ ...chantier, assignees: newAssignees });
              }}
            />
          </div>
        );

      case "etapes":
        return (
          <div>
            <ChantierEtapes chantierId={chantier.id} />
          </div>
        );

      case "photos":
        return (
          <div>
            <ChantierPhotos chantierId={chantier.id} photos={chantier.photos || []} />
          </div>
        );

      case "timeline":
        return (
          <div>
            <ChantierTimeline chantierId={chantier.id} initialTimeline={chantier.timeline || []} />
          </div>
        );

      case "documents":
        return (
          <div>
            <ChantierDocuments chantierId={chantier.id} initialDocuments={chantier.documents || []} />
          </div>
        );

      case "messages":
        return (
          <div>
            <ChantierMessages chantierId={chantier.id} initialMessages={chantier.messages || []} />
          </div>
        );

      default:
        return (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="text-4xl mb-4">🚧</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Contenu en développement</h3>
            <p className="text-gray-600">Cette section est en cours de développement et sera disponible prochainement.</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <nav className="mb-6">
          <div className="flex items-center gap-2 text-sm">
            <Link href="/dashboard" className="text-blue-600 hover:text-blue-800 transition-colors">
              Dashboard
            </Link>
            <span className="text-gray-400">/</span>
            <Link href="/dashboard/chantiers" className="text-blue-600 hover:text-blue-800 transition-colors">
              Chantiers
            </Link>
            <span className="text-gray-400">/</span>
            <span className="text-gray-700 font-medium">
              {chantier?.nom}
            </span>
          </div>
        </nav>

        <ChantierHero 
          chantier={chantier}
          onEdit={handleEdit}
          onShare={() => console.log('Partager')}
          onArchive={() => console.log('Archiver')}
          onDelete={handleDelete}
        />

        <ChantierTabs
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        >
          {renderTabContent()}
        </ChantierTabs>
        
      </div>
    </div>
  );
}
