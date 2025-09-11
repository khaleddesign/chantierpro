"use client";

import { useAuth } from "@/hooks/useAuth";
import { 
  Calendar, TrendingUp, Users, AlertTriangle, Clock, Settings,
  Plus, ArrowRight, BarChart3, DollarSign, Building2, CheckCircle2,
  MessageSquare, Folder, Sun, Hand, Target, CreditCard, FolderKanban,
  PersonStanding
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function DashboardPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Building2 size={32} />
          </div>
          <div className="text-lg font-semibold text-gray-900">Chargement du dashboard...</div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  // Redirection pour les ouvriers vers leur dashboard spécialisé
  if (user.role === "OUVRIER") {
    router.push("/dashboard/ouvrier");
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Building2 size={32} />
          </div>
          <div className="text-lg font-semibold text-gray-900">Redirection vers vos chantiers...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Header avec salutation personnalisée */}
          <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent"></div>
            <div className="relative">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-6 mb-6 lg:mb-0">
                  <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center text-4xl backdrop-blur-sm border border-white/30">
                    <Building2 size={40} />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
                      Bonjour {user.name} ! <Hand size={32} className="text-yellow-300" />
                    </h1>
                    <p className="text-xl text-blue-100 mb-1">
                      {user.role === 'ADMIN' ? 'Vue d\'ensemble de votre plateforme' :
                       user.role === 'COMMERCIAL' ? 'Gérez vos projets et clients' :
                       'Suivez l\'avancement de vos projets'}
                    </p>
                    <div className="flex items-center gap-2 text-blue-200">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-sm">Système opérationnel</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => router.push('/dashboard/chantiers/nouveau')}
                    className="flex items-center gap-2 bg-white/20 backdrop-blur-sm border border-white/30 text-white px-6 py-3 rounded-xl font-semibold hover:bg-white/30 transition-all duration-300 hover:scale-105"
                  >
                    <Plus size={20} />
                    Nouveau Projet
                  </button>
                  <button
                    onClick={() => router.push('/dashboard/messages')}
                    className="flex items-center gap-2 bg-white text-blue-600 px-6 py-3 rounded-xl font-semibold hover:bg-blue-50 transition-all duration-300 hover:scale-105 shadow-lg"
                  >
                    <MessageSquare size={20} />
                    Messages
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Statistiques principales */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { 
                title: "Chantiers Actifs", 
                value: "15", 
                change: "+3 ce mois",
                icon: Building2, 
                color: "from-blue-500 to-blue-600",
                bgColor: "bg-blue-50",
                href: "/dashboard/chantiers"
              },
              { 
                title: "Clients CRM", 
                value: "127", 
                change: "+12 clients ce mois",
                icon: Target, 
                color: "from-green-500 to-green-600",
                bgColor: "bg-green-50",
                href: "/dashboard/crm"
              },
              { 
                title: "Factures", 
                value: "89", 
                change: "+15 cette semaine",
                icon: CreditCard, 
                color: "from-purple-500 to-purple-600",
                bgColor: "bg-purple-50",
                href: "/dashboard/factures"
              },
              { 
                title: "Projets Actifs", 
                value: "23", 
                change: "+5 ce mois",
                icon: FolderKanban, 
                color: "from-orange-500 to-orange-600",
                bgColor: "bg-orange-50",
                href: "/dashboard/projets"
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
                  <ArrowRight size={20} className="text-gray-400 group-hover:text-gray-600 transition-colors" />
                </div>
                <div className="space-y-2">
                  <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
                  <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">{stat.title}</h3>
                  <p className="text-sm text-green-600 font-medium">{stat.change}</p>
                </div>
              </Link>
            ))}
          </div>

          {/* Contenu principal en grille */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Activité récente - 2 colonnes */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm">
              <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-gray-100 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <Clock size={24} className="text-blue-600" />
                    Activité Récente
                  </h3>
                  <Link 
                    href="/dashboard/chantiers"
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
                  >
                    Voir tout <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
              <div className="p-6 space-y-4">
                {[
                  { 
                    action: "Nouveau chantier créé", 
                    details: "Villa Moderne - Sophie Durand", 
                    time: "Il y a 15 min", 
                    type: "success",
                    icon: Building2,
                  },
                  { 
                    action: "Devis validé", 
                    details: "450K€ - Rénovation Complète", 
                    time: "Il y a 32 min", 
                    type: "success",
                    icon: CheckCircle2,
                  },
                  { 
                    action: "Équipe assignée", 
                    details: "Équipe Alpha → Projet Extension", 
                    time: "Il y a 1h", 
                    type: "info",
                    icon: Users
                  },
                  { 
                    action: "Message reçu", 
                    details: "Client: Question sur planning", 
                    time: "Il y a 1h30", 
                    type: "message",
                    icon: MessageSquare
                  },
                  { 
                    action: "Facture payée", 
                    details: "180K€ - Aménagement Bureau", 
                    time: "Il y a 2h", 
                    type: "success",
                    icon: DollarSign,
                  }
                ].map((activity, index) => (
                  <div key={index} className="flex items-start gap-4 p-4 bg-gray-50 hover:bg-white border border-gray-200 rounded-xl transition-all duration-300 hover:shadow-md cursor-pointer group">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white flex-shrink-0 group-hover:scale-110 transition-transform">
                      <Building2 size={28} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 mb-1">{activity.action}</p>
                      <p className="text-sm text-gray-600 mb-1">{activity.details}</p>
                      <p className="text-xs text-gray-500">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Colonne droite */}
            <div className="space-y-6">
              
              {/* Alertes importantes */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
                <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-orange-50 to-red-50 rounded-t-2xl">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <AlertTriangle size={20} className="text-orange-600" />
                    Alertes Importantes
                  </h3>
                </div>
                <div className="p-4 space-y-3">
                  {[
                    { type: "warning", message: "3 chantiers accusent du retard", priority: "Urgent" },
                    { type: "info", message: "Sauvegarde automatique effectuée", priority: "Info" },
                    { type: "error", message: "Problème connexion API météo", priority: "Moyen" }
                  ].map((alert, index) => (
                    <div key={index} className={`p-3 rounded-lg border-l-4 ${
                      alert.type === 'error' ? 'border-l-red-500 bg-red-50 hover:bg-red-100' :
                      alert.type === 'warning' ? 'border-l-yellow-500 bg-yellow-50 hover:bg-yellow-100' :
                      'border-l-blue-500 bg-blue-50 hover:bg-blue-100'
                    } transition-colors cursor-pointer`}>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900">{alert.message}</span>
                        <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                          alert.type === 'error' ? 'bg-red-100 text-red-800' :
                          alert.type === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {alert.priority}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Météo du jour */}
              <div className="bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl p-6 text-white">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold">Météo Chantiers</h3>
                  <Sun size={32} />
                </div>
                <div className="space-y-2">
                  <div className="text-2xl font-bold">22°C</div>
                  <p className="text-blue-100">Parfait pour les travaux extérieurs</p>
                  <div className="flex items-center gap-4 text-sm text-blue-200">
                    <span>Vent: 12 km/h</span>
                    <span>Humidité: 45%</span>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Actions rapides */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Settings size={24} className="text-purple-600" />
              Actions Rapides
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                { title: "CRM", icon: Target, href: "/dashboard/crm", color: "from-blue-500 to-blue-600" },
                { title: "Factures", icon: CreditCard, href: "/dashboard/factures", color: "from-green-500 to-green-600" },
                { title: "Projets", icon: FolderKanban, href: "/dashboard/projets", color: "from-purple-500 to-purple-600" },
                { title: "Équipes", icon: PersonStanding, href: "/dashboard/equipes", color: "from-orange-500 to-orange-600" },
                { title: "Administration", icon: Settings, href: "/dashboard/admin", color: "from-pink-500 to-pink-600" },
                { title: "Planning", icon: Calendar, href: "/dashboard/planning", color: "from-indigo-500 to-indigo-600" },
                { title: "Nouveau Chantier", icon: Building2, href: "/dashboard/chantiers/nouveau", color: "from-cyan-500 to-cyan-600" },
                { title: "Créer Devis", icon: DollarSign, href: "/dashboard/devis/nouveau", color: "from-teal-500 to-teal-600" },
                { title: "Messages", icon: MessageSquare, href: "/dashboard/messages", color: "from-amber-500 to-amber-600" },
                { title: "Documents", icon: Folder, href: "/dashboard/documents", color: "from-emerald-500 to-emerald-600" },
                { title: "Utilisateurs", icon: Users, href: "/dashboard/users", color: "from-violet-500 to-violet-600" },
                { title: "Rapports", icon: BarChart3, href: "/dashboard/reports", color: "from-rose-500 to-rose-600" }
              ].map((action, index) => (
                <Link
                  key={index}
                  href={action.href}
                  className="flex flex-col items-center gap-3 p-4 bg-gray-50 hover:bg-white border border-gray-200 rounded-xl transition-all duration-300 hover:shadow-md hover:scale-105 cursor-pointer group"
                >
                  <div className={`w-12 h-12 bg-gradient-to-r ${action.color} rounded-xl flex items-center justify-center text-white text-xl group-hover:scale-110 transition-transform shadow-lg`}>
                    <action.icon size={24} />
                  </div>
                  <span className="font-medium text-gray-900 text-sm text-center group-hover:text-blue-600 transition-colors">
                    {action.title}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}