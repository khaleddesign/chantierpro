"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChantierStatus } from '@prisma/client';
import { 
  Search, Plus, Filter, Calendar, MapPin, 
  Building, Clock, Briefcase, Users, MessageSquare, 
  ChevronRight, ArrowUpRight, Grid, List, CheckCircle2, 
  ClipboardList, Clock8, AlertCircle, Loader2, Edit,
  Eye, MoreHorizontal, ChevronDown, ChevronUp, Table
} from "lucide-react";
import { useChantiers } from "@/hooks/useChantiers";
import { useToastContext } from "@/components/providers/ToastProvider";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChantierForm } from "@/components/chantiers/ChantierForm";

const statusColors = {
  PLANIFIE: {
    bg: "bg-amber-100",
    text: "text-amber-800",
    icon: "🗓️",
    border: "border-amber-200"
  },
  EN_COURS: {
    bg: "bg-blue-100",
    text: "text-blue-800",
    icon: "🚧",
    border: "border-blue-200"
  },
  EN_ATTENTE: {
    bg: "bg-purple-100",
    text: "text-purple-800",
    icon: "⏳",
    border: "border-purple-200"
  },
  TERMINE: {
    bg: "bg-green-100",
    text: "text-green-800",
    icon: "✅",
    border: "border-green-200"
  },
  ANNULE: {
    bg: "bg-red-100",
    text: "text-red-800",
    icon: "❌",
    border: "border-red-200"
  }
};

const statusLabels = {
  PLANIFIE: 'Planifié',
  EN_COURS: 'En cours',
  EN_ATTENTE: 'En attente',
  TERMINE: 'Terminé',
  ANNULE: 'Annulé'
};

export default function ChantiersPage() {
  const { user } = useAuth();
  const { chantiers, loading, error, pagination, fetchChantiers, clearError } = useChantiers();
  const { error: showError } = useToastContext();

  // 🔒 SÉCURITÉ : Rediriger les clients vers leur espace dédié
  if (user?.role === "CLIENT") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg font-semibold text-gray-900 mb-2">Accès non autorisé</div>
          <p className="text-gray-600 mb-4">Cette page est réservée aux commerciaux et administrateurs.</p>
          <Link 
            href="/dashboard/client"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retourner à mon espace client
          </Link>
        </div>
      </div>
    );
  }
  
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ChantierStatus | "TOUS">("TOUS");
  const [viewMode, setViewMode] = useState<"grid" | "list" | "table">("table");
  const [showForm, setShowForm] = useState(false);
  const [editingChantier, setEditingChantier] = useState<any>(null);
  const [sortBy, setSortBy] = useState<string>('dateDebut');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Charger les chantiers au montage et quand les filtres changent
  useEffect(() => {
    const delayedFetch = setTimeout(() => {
      // Éviter les appels multiples
      if (loading) return;
      
      // Log uniquement en dev
      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 Chargement chantiers');
      }
      
      fetchChantiers({
        page: 1, // Reset à la page 1 lors d'une nouvelle recherche
        limit: pagination?.limit || 10, // ✅ Protection contre undefined
        search: search || undefined,
        status: statusFilter === 'TOUS' ? undefined : statusFilter,
      });
    }, 300); // Réduction du délai de 500ms à 300ms

    return () => clearTimeout(delayedFetch);
  }, [search, statusFilter]); // Retrait de fetchChantiers et pagination de la dépendance

  // Effet séparé pour la pagination
  useEffect(() => {
    // ✅ Protection complète contre les objets undefined
    if (pagination?.page && pagination.page > 1) {
      fetchChantiers({
        page: pagination.page,
        limit: pagination.limit || 10,
        search: search || undefined,
        status: statusFilter === 'TOUS' ? undefined : statusFilter,
      });
    }
  }, [pagination?.page]); // ✅ Accès protégé

  // Afficher les erreurs avec toast
  useEffect(() => {
    if (error) {
      showError("Erreur", error);
      clearError();
    }
  }, [error, showError, clearError]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatBudget = (budget: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0
    }).format(budget);
  };

  const getProgressColor = (progress: number) => {
    if (progress < 25) return 'from-red-500 to-orange-500';
    if (progress < 50) return 'from-orange-500 to-amber-500';
    if (progress < 75) return 'from-blue-500 to-cyan-500';
    return 'from-green-500 to-emerald-500';
  };


  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const sortedChantiers = [...(chantiers || [])].sort((a, b) => {
    let aValue: any = a[sortBy as keyof typeof a];
    let bValue: any = b[sortBy as keyof typeof b];

    // Handle nested properties
    if (sortBy === 'client') {
      aValue = a.client?.name || '';
      bValue = b.client?.name || '';
    }

    // Convert to comparable values
    if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }

    if (sortBy === 'dateDebut' || sortBy === 'dateFin') {
      aValue = new Date(aValue).getTime();
      bValue = new Date(bValue).getTime();
    }

    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const handlePageChange = (newPage: number) => {
    fetchChantiers({
      page: newPage,
      limit: pagination?.limit || 10, // ✅ Protection
      search: search || undefined,
      status: statusFilter,
    });
  };

  const handleCreateChantier = () => {
    setEditingChantier(null);
    setShowForm(true);
  };

  const handleEditChantier = (chantier: any) => {
    setEditingChantier(chantier);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingChantier(null);
  };

  const handleFormSuccess = async () => {
    try {
      // Recharger la liste depuis la page 1 pour voir le nouveau chantier
      await fetchChantiers({
        page: 1, // Toujours revenir à la page 1 après création
        limit: pagination?.limit || 10,
        search: search || undefined,
        status: statusFilter === 'TOUS' ? undefined : statusFilter,
      });
    } catch (error) {
      console.warn('Erreur lors du rechargement:', error);
    }
    
    setShowForm(false);
    setEditingChantier(null);
  };

  // Statistiques des chantiers
  const chantiersEnCours = (chantiers || []).filter(c => c.statut === 'EN_COURS').length;
  const chantiersPlanifies = (chantiers || []).filter(c => c.statut === 'PLANIFIE').length;
  const chantiersTermines = (chantiers || []).filter(c => c.statut === 'TERMINE').length;
  const budgetTotal = (chantiers || []).reduce((sum, c) => sum + c.budget, 0);

  const RenderGridView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {(chantiers || []).map((chantier) => (
        <Link 
          href={`/dashboard/chantiers/${chantier.id}`} 
          key={chantier.id}
          className="block"
        >
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-105 group overflow-hidden">
            <div className="relative h-48 bg-gradient-to-br from-gray-200 to-gray-300">
              {chantier.photo ? (
                <img 
                  src={chantier.photo} 
                  alt={chantier.nom}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center">
                  <Building size={48} className="text-gray-400" />
                </div>
              )}
              <div className="absolute inset-0 bg-black bg-opacity-20" />
              
              <div className="absolute top-3 left-3">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.preventDefault();
                    handleEditChantier(chantier);
                  }}
                  className="bg-white/90 hover:bg-white shadow-sm"
                >
                  <Edit size={14} />
                </Button>
              </div>
              
              <div className="absolute top-3 right-3">
                <div className={`px-3 py-1 rounded-full text-sm font-medium border ${statusColors[chantier.statut].bg} ${statusColors[chantier.statut].text} ${statusColors[chantier.statut].border}`}>
                  <span className="mr-1">{statusColors[chantier.statut].icon}</span>
                  <span>{statusLabels[chantier.statut]}</span>
                </div>
              </div>
              
              <div className="absolute bottom-3 left-3 right-3">
                <div className="bg-gray-200 rounded-full h-2 mb-2">
                  <div 
                    className={`h-2 rounded-full bg-gradient-to-r ${getProgressColor(chantier.progression)}`}
                    style={{ width: `${chantier.progression}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-white text-xs font-medium drop-shadow-md">
                  <span>Progression</span>
                  <span>{chantier.progression}%</span>
                </div>
              </div>
            </div>
            
            <div className="p-5">
              <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-1 group-hover:text-indigo-600">
                {chantier.nom}
              </h3>
              
              <div className="flex items-start gap-3 mb-3">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                  {chantier?.client?.name?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{chantier?.client?.name || 'Client inconnu'}</p>
                  {chantier?.client?.company && (
                    <p className="text-xs text-gray-500">{chantier.client.company}</p>
                  )}
                </div>
              </div>
              
              <div className="mb-3">
                <div className="flex items-center text-sm text-gray-600 mb-1">
                  <MapPin size={14} className="mr-1 text-gray-400" />
                  <span className="truncate">{chantier.adresse}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar size={14} className="mr-1 text-gray-400" />
                  <span>{formatDate(chantier.dateDebut)} - {formatDate(chantier.dateFin)}</span>
                </div>
              </div>
              
              <p className="text-sm text-gray-600 mb-4 line-clamp-2">{chantier.description}</p>
              
              <div className="border-t border-gray-100 pt-3 mt-auto">
                <div className="flex justify-between items-center">
                  <div className="flex gap-2">
                    {chantier._count && (
                      <div className="flex items-center text-xs text-gray-500">
                        <MessageSquare size={12} className="mr-1" />
                        {chantier._count.messages + chantier._count.comments}
                      </div>
                    )}
                  </div>
                  <div className="text-sm font-semibold text-indigo-600">
                    {formatBudget(chantier.budget)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );

  const RenderListView = () => (
    <div className="space-y-3">
      {(chantiers || []).map((chantier) => (
        <Link 
          href={`/dashboard/chantiers/${chantier.id}`} 
          key={chantier.id}
          className="block"
        >
          <div className="bg-white rounded-xl border border-gray-200 hover:shadow-lg transition-all duration-200 p-4 flex gap-4">
            <div className="w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden">
              {chantier.photo ? (
                <img 
                  src={chantier.photo} 
                  alt={chantier.nom}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="h-full w-full bg-gradient-to-r from-gray-200 to-gray-300 flex items-center justify-center">
                  <Building size={24} className="text-gray-400" />
                </div>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-base font-semibold text-gray-900 truncate">{chantier.nom}</h3>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.preventDefault();
                      handleEditChantier(chantier);
                    }}
                  >
                    <Edit size={14} />
                  </Button>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[chantier.statut].bg} ${statusColors[chantier.statut].text}`}>
                    <span className="mr-1">{statusColors[chantier.statut].icon}</span>
                    <span>{statusLabels[chantier.statut]}</span>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 mb-2">
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin size={14} className="mr-1 text-gray-400" />
                  <span className="truncate">{chantier.adresse}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar size={14} className="mr-1 text-gray-400" />
                  <span>{formatDate(chantier.dateDebut)} - {formatDate(chantier.dateFin)}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Users size={14} className="mr-1 text-gray-400" />
                  <span>{chantier?.client?.name || 'Client inconnu'}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Briefcase size={14} className="mr-1 text-gray-400" />
                  <span className="font-medium text-indigo-600">{formatBudget(chantier.budget)}</span>
                </div>
              </div>
              
              <div className="mt-3 flex items-center">
                <div className="flex-1 mr-4">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Progression</span>
                    <span>{chantier.progression}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full bg-gradient-to-r ${getProgressColor(chantier.progression)}`}
                      style={{ width: `${chantier.progression}%` }}
                    ></div>
                  </div>
                </div>
                {chantier._count && (
                  <div className="flex items-center text-xs text-gray-500 gap-2">
                    <span className="flex items-center">
                      <MessageSquare size={12} className="mr-1" />
                      {chantier._count.messages + chantier._count.comments}
                    </span>
                    <ChevronRight size={16} className="text-gray-400" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );

  const RenderTableView = () => (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {[
                { key: 'nom', label: 'Nom du chantier', width: 'w-64' },
                { key: 'client', label: 'Client', width: 'w-48' },
                { key: 'statut', label: 'Statut', width: 'w-32' },
                { key: 'progression', label: 'Progression', width: 'w-40' },
                { key: 'budget', label: 'Budget', width: 'w-32' },
                { key: 'dateDebut', label: 'Date début', width: 'w-36' },
                { key: 'actions', label: 'Actions', width: 'w-24' }
              ].map((column) => (
                <th
                  key={column.key}
                  className={`${column.width} px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100`}
                  onClick={() => column.key !== 'actions' && handleSort(column.key)}
                >
                  <div className="flex items-center space-x-1">
                    <span>{column.label}</span>
                    {column.key !== 'actions' && sortBy === column.key && (
                      sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {(sortedChantiers || []).map((chantier) => (
              <tr key={chantier.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <Link
                    href={`/dashboard/chantiers/${chantier.id}`}
                    className="group"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                        {chantier.photo ? (
                          <img 
                            src={chantier.photo} 
                            alt={chantier.nom}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-r from-gray-200 to-gray-300 flex items-center justify-center">
                            <Building size={16} className="text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 group-hover:text-indigo-600 truncate">
                          {chantier.nom}
                        </p>
                        <p className="text-sm text-gray-500 truncate">{chantier.adresse}</p>
                      </div>
                    </div>
                  </Link>
                </td>
                
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {chantier?.client?.name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{chantier?.client?.name || 'Client inconnu'}</p>
                      {chantier?.client?.company && (
                        <p className="text-xs text-gray-500 truncate">{chantier.client.company}</p>
                      )}
                    </div>
                  </div>
                </td>
                
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[chantier.statut].bg} ${statusColors[chantier.statut].text}`}>
                    <span className="mr-1">{statusColors[chantier.statut].icon}</span>
                    {statusLabels[chantier.statut]}
                  </span>
                </td>
                
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-3">
                    <div className="flex-1">
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>{chantier.progression}%</span>
                      </div>
                      <div className="h-2 w-24 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full bg-gradient-to-r ${getProgressColor(chantier.progression)}`}
                          style={{ width: `${chantier.progression}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </td>
                
                <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                  {formatBudget(chantier.budget)}
                </td>
                
                <td className="px-6 py-4 text-sm text-gray-600">
                  {formatDate(chantier.dateDebut)}
                </td>
                
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-2">
                    <Link
                      href={`/dashboard/chantiers/${chantier.id}`}
                      className="text-indigo-600 hover:text-indigo-900 transition-colors"
                      title="Voir détails"
                    >
                      <Eye size={16} />
                    </Link>
                    <button
                      onClick={() => handleEditChantier(chantier)}
                      className="text-gray-600 hover:text-gray-900 transition-colors"
                      title="Modifier"
                    >
                      <Edit size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const LoadingSkeleton = () => (
    <div className={viewMode === 'table' ? 'bg-white rounded-2xl border border-gray-200 shadow-sm' : viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-3'}>
      {viewMode === 'table' ? (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {[...Array(7)].map((_, i) => (
                  <th key={i} className="px-6 py-3">
                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...Array(6)].map((_, i) => (
                <tr key={i} className="border-b border-gray-100">
                  {[...Array(7)].map((_, j) => (
                    <td key={j} className="px-6 py-4">
                      <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        [...Array(6)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 animate-pulse">
            {viewMode === 'grid' ? (
              <>
                <div className="h-48 bg-gray-200 rounded-t-xl"></div>
                <div className="p-5 space-y-3">
                  <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-200"></div>
                    <div className="space-y-1 flex-1">
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="h-3 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded"></div>
                  </div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                </div>
              </>
            ) : (
              <div className="p-4 flex gap-4">
                <div className="w-24 h-24 bg-gray-200 rounded-lg"></div>
                <div className="flex-1 space-y-3">
                  <div className="flex justify-between">
                    <div className="h-5 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-5 bg-gray-200 rounded w-1/5"></div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded"></div>
                  </div>
                  <div className="h-2 bg-gray-200 rounded"></div>
                </div>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );

  const EmptyState = () => (
    <div className="bg-white rounded-xl p-10 text-center shadow-sm border border-gray-100 flex flex-col items-center justify-center">
      <div className="w-20 h-20 rounded-full bg-indigo-50 flex items-center justify-center mb-4">
        <ClipboardList size={32} className="text-indigo-600" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        {search || statusFilter !== 'TOUS' ? 'Aucun chantier trouvé' : 'Aucun chantier'}
      </h3>
      <p className="text-gray-500 mb-6 max-w-md">
        {search || statusFilter !== 'TOUS' 
          ? 'Essayez de modifier vos critères de recherche ou de réinitialiser les filtres'
          : 'Commencez par créer votre premier chantier pour gérer tous vos projets de construction'
        }
      </p>
      {(!search && statusFilter === 'TOUS') && (
        <Link href="/dashboard/chantiers/nouveau">
          <Button className="flex items-center gap-2">
            <Plus size={18} />
            Créer un chantier
          </Button>
        </Link>
      )}
    </div>
  );

  const Pagination = () => {
    if (!pagination || pagination.totalPages <= 1) return null; // ✅ Protection

    return (
      <div className="flex items-center justify-between bg-white px-6 py-3 border border-gray-200 rounded-lg">
        <div className="flex items-center">
          <p className="text-sm text-gray-700">
            Affichage de <span className="font-medium">{((pagination?.page || 1) - 1) * (pagination?.limit || 10) + 1}</span> à{' '}
            <span className="font-medium">
              {Math.min((pagination?.page || 1) * (pagination?.limit || 10), pagination?.total || 0)}
            </span>{' '}
            sur <span className="font-medium">{pagination?.total || 0}</span> résultats
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange((pagination?.page || 1) - 1)}
            disabled={!pagination?.hasPrevPage || loading} // ✅ Protection
          >
            Précédent
          </Button>
          
          {/* Pages numbers */}
        {Array.from({ length: Math.min(5, pagination?.totalPages || 1) }, (_, i) => { // ✅ Protection
          const page = i + 1;
          const isActive = page === pagination?.page; // ✅ Protection
            return (
              <Button
                key={page}
                variant={isActive ? "default" : "outline"}
                size="sm"
                onClick={() => handlePageChange(page)}
                disabled={loading}
              >
                {page}
              </Button>
            );
          })}
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange((pagination?.page || 1) + 1)}
            disabled={!pagination?.hasNextPage || loading} // ✅ Protection
          >
            Suivant
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Mes Chantiers</h1>
            <p className="text-gray-500">
              Gérez et suivez tous vos projets de construction
            </p>
          </div>
          <Button 
            onClick={handleCreateChantier}
            className="flex items-center gap-2"
          >
            <Plus size={18} />
            Nouveau chantier
          </Button>
        </div>
        
        {/* Filtres et recherche */}
        <div className="mb-8">
          <div className="relative mb-6 max-w-xl">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-400" />
            </div>
            <Input
              type="text"
              className="pl-10"
              placeholder="Rechercher un chantier, client ou adresse..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              disabled={loading}
            />
            {loading && (
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                <Loader2 size={18} className="text-gray-400 animate-spin" />
              </div>
            )}
          </div>
          
          <div className="flex flex-wrap gap-4 justify-between items-center">
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-gray-400" />
              <span className="text-sm text-gray-600 mr-2">Filtrer par :</span>
              
              <Button
                variant={statusFilter === 'TOUS' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('TOUS')}
                disabled={loading}
              >
                Tous
              </Button>
              
              <Button
                variant={statusFilter === 'EN_COURS' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('EN_COURS')}
                disabled={loading}
                className="flex items-center gap-1"
              >
                <Clock8 size={14} />
                En cours
              </Button>
              
              <Button
                variant={statusFilter === 'PLANIFIE' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('PLANIFIE')}
                disabled={loading}
                className="flex items-center gap-1"
              >
                <Calendar size={14} />
                Planifiés
              </Button>
              
              <Button
                variant={statusFilter === 'TERMINE' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('TERMINE')}
                disabled={loading}
                className="flex items-center gap-1"
              >
                <CheckCircle2 size={14} />
                Terminés
              </Button>
            </div>
            
            <div className="flex items-center gap-2 bg-white rounded-lg p-1 border border-gray-200">
              <Button
                variant={viewMode === 'table' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('table')}
                title="Vue tableau"
              >
                <Table size={18} />
              </Button>
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                title="Vue grille"
              >
                <Grid size={18} />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                title="Vue liste"
              >
                <List size={18} />
              </Button>
            </div>
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 rounded-xl border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">En cours</p>
                <p className="text-2xl font-bold text-indigo-600">{chantiersEnCours}</p>
              </div>
              <Clock8 className="h-8 w-8 text-indigo-600" />
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Planifiés</p>
                <p className="text-2xl font-bold text-amber-600">{chantiersPlanifies}</p>
              </div>
              <Calendar className="h-8 w-8 text-amber-600" />
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Terminés</p>
                <p className="text-2xl font-bold text-green-600">{chantiersTermines}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Budget total</p>
                <p className="text-xl font-bold text-gray-900">{formatBudget(budgetTotal)}</p>
              </div>
              <Briefcase className="h-8 w-8 text-gray-600" />
            </div>
          </div>
        </div>

        {/* Contenu principal */}
        {loading ? (
          <LoadingSkeleton />
        ) : (chantiers || []).length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {viewMode === 'table' ? <RenderTableView /> : viewMode === 'grid' ? <RenderGridView /> : <RenderListView />}
            <div className="mt-8">
              <Pagination />
            </div>
          </>
        )}

        {/* Modal de formulaire */}
        {showForm && (
          <ChantierForm 
            chantier={editingChantier}
            onClose={handleFormClose}
            onSuccess={handleFormSuccess}
          />
        )}
      </div>
    </div>
  );
}