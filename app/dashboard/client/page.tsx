"use client";

import { useAuth } from "@/hooks/useAuth";
import { 
  Building2, FileText, Calendar, MessageSquare, CheckCircle2,
  Clock, AlertTriangle, MapPin, Phone, Mail, User
} from "lucide-react";
import Link from "next/link";

export default function ClientDashboardPage() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <User size={32} />
          </div>
          <div className="text-lg font-semibold text-gray-900">Chargement de votre espace...</div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="space-y-8">
      {/* Header personnalisé client */}
      <div className="bg-gradient-to-br from-green-600 via-blue-600 to-teal-600 rounded-3xl p-8 text-white shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-6 mb-6 lg:mb-0">
            <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center backdrop-blur-sm border border-white/30">
              <User size={40} />
            </div>
            <div>
              <h1 className="text-4xl font-bold mb-2">
                Bienvenue {user.name} !
              </h1>
              <p className="text-xl text-green-100 mb-1">
                Votre espace client personnel
              </p>
              {(user as any).company && (
                <p className="text-green-200 text-sm">
                  {(user as any).company}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Statistiques client */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { 
            title: "Mes Chantiers", 
            value: "3", 
            subtitle: "En cours",
            icon: Building2, 
            color: "from-blue-500 to-blue-600",
            bgColor: "bg-blue-50",
            href: "/dashboard/client/chantiers"
          },
          { 
            title: "Devis Reçus", 
            value: "2", 
            subtitle: "En attente",
            icon: FileText, 
            color: "from-green-500 to-green-600",
            bgColor: "bg-green-50",
            href: "/dashboard/client/devis"
          },
          { 
            title: "Messages", 
            value: "5", 
            subtitle: "Non lus",
            icon: MessageSquare, 
            color: "from-purple-500 to-purple-600",
            bgColor: "bg-purple-50",
            href: "/dashboard/client/messages"
          },
          { 
            title: "Planning", 
            value: "2", 
            subtitle: "Cette semaine",
            icon: Calendar, 
            color: "from-orange-500 to-orange-600",
            bgColor: "bg-orange-50",
            href: "/dashboard/client/planning"
          }
        ].map((stat, index) => (
          <Link
            key={index}
            href={stat.href}
            className={`${stat.bgColor} border border-gray-200 rounded-2xl p-6 hover:shadow-xl transition-all duration-300 hover:scale-105 group cursor-pointer block`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-14 h-14 bg-gradient-to-r ${stat.color} rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                <stat.icon size={28} />
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
              <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">{stat.title}</h3>
              <p className="text-sm text-gray-500">{stat.subtitle}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Contenu principal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Mes chantiers en cours */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Building2 size={24} className="text-blue-600" />
                Chantiers en Cours
              </h3>
              <Link 
                href="/dashboard/client/chantiers"
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                Voir tout
              </Link>
            </div>
          </div>
          <div className="p-6 space-y-4">
            {[
              { 
                nom: "Rénovation Cuisine",
                progression: 65,
                status: "EN_COURS",
                dateEcheance: "15 Mars 2024"
              },
              { 
                nom: "Extension Garage",
                progression: 30,
                status: "PLANIFIE",
                dateEcheance: "20 Avril 2024"
              }
            ].map((chantier, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">{chantier.nom}</h4>
                  <p className="text-sm text-gray-500">Échéance: {chantier.dateEcheance}</p>
                  <div className="mt-2">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Progression</span>
                      <span>{chantier.progression}%</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-300"
                        style={{ width: `${chantier.progression}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Devis récents */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <FileText size={24} className="text-green-600" />
                Devis Récents
              </h3>
              <Link 
                href="/dashboard/client/devis"
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                Voir tout
              </Link>
            </div>
          </div>
          <div className="p-6 space-y-4">
            {[
              { 
                numero: "DEV-2024-001",
                objet: "Rénovation salle de bain",
                montant: 12500,
                status: "ENVOYE",
                date: "10 Mars 2024"
              },
              { 
                numero: "DEV-2024-002",
                objet: "Travaux électriques",
                montant: 3500,
                status: "ACCEPTE",
                date: "5 Mars 2024"
              }
            ].map((devis, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-gray-900">{devis.numero}</h4>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      devis.status === 'ACCEPTE' ? 'bg-green-100 text-green-800' :
                      devis.status === 'ENVOYE' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {devis.status === 'ACCEPTE' ? 'Accepté' : 
                       devis.status === 'ENVOYE' ? 'Envoyé' : devis.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">{devis.objet}</p>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-lg font-bold text-gray-900">
                      {devis.montant.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                    </span>
                    <span className="text-xs text-gray-500">{devis.date}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}