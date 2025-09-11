"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Building2, 
  Calendar, 
  MapPin, 
  Clock, 
  User, 
  TrendingUp, 
  AlertCircle,
  CheckCircle2,
  Eye,
  MessageSquare,
  Camera
} from "lucide-react";
import Link from "next/link";

interface Chantier {
  id: string;
  nom: string;
  description: string;
  adresse: string;
  statut: string;
  progression: number;
  dateDebut: string;
  dateFin: string;
  budget: number;
  client: {
    id: string;
    name: string;
    email: string;
    company?: string;
  };
  _count: {
    messages: number;
    comments: number;
    etapes: number;
  };
}

const statusColors = {
  PLANIFIE: "bg-yellow-100 text-yellow-800",
  EN_COURS: "bg-blue-100 text-blue-800", 
  EN_ATTENTE: "bg-orange-100 text-orange-800",
  TERMINE: "bg-green-100 text-green-800",
  ANNULE: "bg-red-100 text-red-800"
};

const statusLabels = {
  PLANIFIE: "Planifié",
  EN_COURS: "En cours",
  EN_ATTENTE: "En attente", 
  TERMINE: "Terminé",
  ANNULE: "Annulé"
};

export default function OuvrierDashboard() {
  const { user } = useAuth();
  const [chantiers, setChantiers] = useState<Chantier[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    enCours: 0,
    termines: 0,
    enAttente: 0
  });

  useEffect(() => {
    fetchMesChantiers();
  }, [user]);

  const fetchMesChantiers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/chantiers/mes-chantiers');
      const data = await response.json();
      
      if (data.chantiers) {
        setChantiers(data.chantiers);
        
        // Calculer les statistiques
        const stats = data.chantiers.reduce((acc: any, chantier: Chantier) => {
          acc.total++;
          switch (chantier.statut) {
            case 'EN_COURS': acc.enCours++; break;
            case 'TERMINE': acc.termines++; break;
            case 'EN_ATTENTE': acc.enAttente++; break;
          }
          return acc;
        }, { total: 0, enCours: 0, termines: 0, enAttente: 0 });
        
        setStats(stats);
      }
    } catch (error) {
      console.error('Erreur chargement chantiers:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getProgressColor = (progression: number) => {
    if (progression < 30) return "bg-red-500";
    if (progression < 70) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getStatusIcon = (statut: string) => {
    switch (statut) {
      case 'TERMINE': return <CheckCircle2 className="h-4 w-4" />;
      case 'EN_COURS': return <Clock className="h-4 w-4" />;
      case 'EN_ATTENTE': return <AlertCircle className="h-4 w-4" />;
      default: return <Calendar className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* En-tête */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Mes Chantiers
          </h1>
          <p className="text-gray-600">
            Bienvenue {user?.name}, voici vos chantiers assignés
          </p>
        </div>

        {/* Statistiques rapides */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Chantiers</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">En Cours</CardTitle>
              <Clock className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.enCours}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Terminés</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.termines}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">En Attente</CardTitle>
              <AlertCircle className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.enAttente}</div>
            </CardContent>
          </Card>
        </div>

        {/* Liste des chantiers */}
        <div className="space-y-6">
          {chantiers.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <Building2 className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Aucun chantier assigné
                  </h3>
                  <p className="text-gray-600">
                    Vous n'êtes actuellement assigné à aucun chantier.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            chantiers.map((chantier) => (
              <Card key={chantier.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <CardContent className="p-0">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-semibold text-gray-900">
                            {chantier.nom}
                          </h3>
                          <Badge className={`${statusColors[chantier.statut as keyof typeof statusColors]} flex items-center gap-1`}>
                            {getStatusIcon(chantier.statut)}
                            {statusLabels[chantier.statut as keyof typeof statusLabels]}
                          </Badge>
                        </div>
                        <p className="text-gray-600 mb-3">{chantier.description}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {chantier.adresse}
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            {chantier.client.name}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-900 mb-1">
                          {chantier.progression}%
                        </div>
                        <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-300 ${getProgressColor(chantier.progression)}`}
                            style={{ width: `${chantier.progression}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Dates et informations */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date début
                        </label>
                        <p className="text-sm font-medium text-gray-900 mt-1">
                          {formatDate(chantier.dateDebut)}
                        </p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date fin prévue
                        </label>
                        <p className="text-sm font-medium text-gray-900 mt-1">
                          {formatDate(chantier.dateFin)}
                        </p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Budget
                        </label>
                        <p className="text-sm font-medium text-gray-900 mt-1">
                          {new Intl.NumberFormat('fr-FR', {
                            style: 'currency',
                            currency: 'EUR',
                            minimumFractionDigits: 0
                          }).format(chantier.budget)}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <MessageSquare className="h-4 w-4" />
                          {chantier._count.messages} messages
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {chantier._count.etapes} étapes
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Camera className="h-4 w-4 mr-2" />
                          Ajouter Photo
                        </Button>
                        <Button variant="outline" size="sm">
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Messages
                        </Button>
                        <Button asChild size="sm">
                          <Link href={`/dashboard/chantiers/${chantier.id}`}>
                            <Eye className="h-4 w-4 mr-2" />
                            Voir Détails
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}