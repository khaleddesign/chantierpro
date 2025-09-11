"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { DevisStatus, DevisType } from '@prisma/client';
import { 
  Search, Plus, Filter, Calendar, FileText, 
  DollarSign, Clock, CheckCircle2, XCircle, 
  AlertCircle, Grid, List, Eye, Edit, 
  Download, CreditCard, Loader2, FileUp,
  Table, ChevronUp, ChevronDown
} from "lucide-react";
import { useDevis } from "@/hooks/useDevis";
import { useToastContext } from "@/components/providers/ToastProvider";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DevisForm } from "@/components/devis/DevisForm";

const statusColors = {
  BROUILLON: {
    bg: "bg-gray-100",
    text: "text-gray-800",
    icon: "📝",
    border: "border-gray-200"
  },
  ENVOYE: {
    bg: "bg-blue-100",
    text: "text-blue-800",
    icon: "📤",
    border: "border-blue-200"
  },
  ACCEPTE: {
    bg: "bg-green-100",
    text: "text-green-800",
    icon: "✅",
    border: "border-green-200"
  },
  REFUSE: {
    bg: "bg-red-100",
    text: "text-red-800",
    icon: "❌",
    border: "border-red-200"
  },
  FACTURE: {
    bg: "bg-purple-100",
    text: "text-purple-800",
    icon: "💳",
    border: "border-purple-200"
  },
  EXPIRE: {
    bg: "bg-orange-100",
    text: "text-orange-800",
    icon: "⏰",
    border: "border-orange-200"
  },
  ANNULE: {
    bg: "bg-gray-100",
    text: "text-gray-600",
    icon: "🚫",
    border: "border-gray-200"
  },
  PAYE: {
    bg: "bg-green-100",
    text: "text-green-800",
    icon: "✅",
    border: "border-green-200"
  }
};

const statusLabels = {
  BROUILLON: 'Brouillon',
  ENVOYE: 'Envoyé',
  ACCEPTE: 'Accepté',
  REFUSE: 'Refusé',
  FACTURE: 'Facturé',
  EXPIRE: 'Expiré',
  ANNULE: 'Annulé',
  PAYE: 'Payé'
};

const typeLabels = {
  DEVIS: 'Devis',
  FACTURE: 'Facture',
  AVOIR: 'Avoir'
};

export default function DevisPage() {
  const { user } = useAuth();
  const { devis, loading, error, pagination, fetchDevis, clearError, convertToFacture } = useDevis();
  const { success, error: showError } = useToastContext();
  
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<DevisStatus | "TOUS">("TOUS");
  const [typeFilter, setTypeFilter] = useState<DevisType | "TOUS">("TOUS");
  const [viewMode, setViewMode] = useState<"grid" | "list" | "table">("table");
  const [sortBy, setSortBy] = useState<string>('dateCreation');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showForm, setShowForm] = useState(false);
  const [editingDevis, setEditingDevis] = useState<any>(null);

  // Charger les devis au montage et quand les filtres changent
  useEffect(() => {
    const delayedFetch = setTimeout(() => {
      fetchDevis({
        page: 1,
        limit: 12,
        search: search || undefined,
        status: statusFilter,
        type: typeFilter === "TOUS" ? undefined : typeFilter,
      });
    }, 500);

    return () => clearTimeout(delayedFetch);
  }, [search, statusFilter, typeFilter, fetchDevis]);

  // Gérer les erreurs avec toast
  useEffect(() => {
    if (error) {
      showError('Erreur', error);
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

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const handlePageChange = (newPage: number) => {
    fetchDevis({
      page: newPage,
      limit: pagination.limit,
      search: search || undefined,
      status: statusFilter,
      type: typeFilter === "TOUS" ? undefined : typeFilter,
    });
  };

  const handleCreateDevis = () => {
    setEditingDevis(null);
    setShowForm(true);
  };

  const handleEditDevis = (devis: any) => {
    setEditingDevis(devis);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingDevis(null);
  };

  const handleFormSuccess = () => {
    fetchDevis({
      page: pagination.page,
      limit: pagination.limit,
      search: search || undefined,
      status: statusFilter,
      type: typeFilter === "TOUS" ? undefined : typeFilter,
    });
  };

  const handleConvertToFacture = async (devis: any) => {
    try {
      await convertToFacture(devis.id);
      success('Succès', 'Devis converti en facture avec succès');
      handleFormSuccess();
    } catch (error: any) {
      showError('Erreur', error.message || 'Erreur lors de la conversion');
    }
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const sortedDevis = [...devis].sort((a, b) => {
    let aValue, bValue;
    
    switch (sortBy) {
      case 'numero':
        aValue = a.numero;
        bValue = b.numero;
        break;
      case 'client':
        aValue = a.client.name;
        bValue = b.client.name;
        break;
      case 'chantier':
        aValue = a.chantier?.nom || '';
        bValue = b.chantier?.nom || '';
        break;
      case 'montantHT':
        aValue = a.totalHT || a.montant;
        bValue = b.totalHT || b.montant;
        break;
      case 'statut':
        aValue = a.statut;
        bValue = b.statut;
        break;
      case 'dateCreation':
      default:
        aValue = new Date(a.dateCreation).getTime();
        bValue = new Date(b.dateCreation).getTime();
        break;
    }
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      const comparison = aValue.localeCompare(bValue);
      return sortOrder === 'asc' ? comparison : -comparison;
    }
    
    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  // Statistiques des devis
  const devisBrouillon = devis.filter(d => d.statut === 'BROUILLON').length;
  const devisEnvoyes = devis.filter(d => d.statut === 'ENVOYE').length;
  const devisAcceptes = devis.filter(d => d.statut === 'ACCEPTE').length;
  const montantTotal = devis.reduce((sum, d) => sum + d.montant, 0);

  const RenderGridView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {devis.map((devis) => (
        <div key={devis.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-105 group overflow-hidden">
          <div className="relative p-6 bg-gradient-to-br from-indigo-50 to-purple-50">
            <div className="absolute top-3 left-3">
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.preventDefault();
                  handleEditDevis(devis);
                }}
                className="bg-white/90 hover:bg-white shadow-sm"
              >
                <Edit size={14} />
              </Button>
            </div>
            
            <div className="absolute top-3 right-3">
              <div className={`px-3 py-1 rounded-full text-sm font-medium border ${statusColors[devis.statut].bg} ${statusColors[devis.statut].text} ${statusColors[devis.statut].border}`}>
                <span className="mr-1">{statusColors[devis.statut].icon}</span>
                <span>{statusLabels[devis.statut]}</span>
              </div>
            </div>

            <div className="mt-8">
              <div className="flex items-center gap-2 mb-2">
                <FileText size={20} className="text-indigo-600" />
                <span className="text-xs font-medium text-indigo-600 uppercase tracking-wide">
                  {typeLabels[devis.type]}
                </span>
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                {devis.numero}
              </h3>
              
              <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                {devis.objet}
              </p>
            </div>
          </div>
          
          <div className="p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                {devis.client.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 truncate">{devis.client.name}</p>
                {devis.client.company && (
                  <p className="text-xs text-gray-500 truncate">{devis.client.company}</p>
                )}
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center text-sm text-gray-600">
                <Calendar size={14} className="mr-2 text-gray-400" />
                <span>Échéance : {formatDate(devis.dateEcheance)}</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <DollarSign size={14} className="mr-2 text-gray-400" />
                <span className="font-medium">{formatAmount(devis.montant)}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <Link href={`/dashboard/devis/${devis.id}`}>
                  <Button size="sm" variant="outline">
                    <Eye size={14} className="mr-1" />
                    Voir
                  </Button>
                </Link>
                
                {devis.type === 'DEVIS' && devis.statut === 'ACCEPTE' && (
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => handleConvertToFacture(devis)}
                  >
                    <CreditCard size={14} className="mr-1" />
                    Facturer
                  </Button>
                )}
              </div>

              <Button size="sm" variant="ghost">
                <Download size={14} />
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const RenderListView = () => (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left py-3 px-4 font-medium text-gray-900">N° / Objet</th>
              <th className="text-left py-3 px-4 font-medium text-gray-900">Client</th>
              <th className="text-left py-3 px-4 font-medium text-gray-900">Type</th>
              <th className="text-left py-3 px-4 font-medium text-gray-900">Statut</th>
              <th className="text-left py-3 px-4 font-medium text-gray-900">Montant</th>
              <th className="text-left py-3 px-4 font-medium text-gray-900">Échéance</th>
              <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {devis.map((devis) => (
              <tr key={devis.id} className="hover:bg-gray-50">
                <td className="py-3 px-4">
                  <div>
                    <div className="font-medium text-gray-900">{devis.numero}</div>
                    <div className="text-sm text-gray-500 line-clamp-1">{devis.objet}</div>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div>
                    <div className="font-medium text-gray-900">{devis.client.name}</div>
                    {devis.client.company && (
                      <div className="text-sm text-gray-500">{devis.client.company}</div>
                    )}
                  </div>
                </td>
                <td className="py-3 px-4">
                  <span className="text-sm font-medium text-gray-700">
                    {typeLabels[devis.type]}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <div className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${statusColors[devis.statut].bg} ${statusColors[devis.statut].text}`}>
                    <span className="mr-1">{statusColors[devis.statut].icon}</span>
                    <span>{statusLabels[devis.statut]}</span>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <span className="font-medium text-gray-900">
                    {formatAmount(devis.montant)}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span className="text-sm text-gray-600">
                    {formatDate(devis.dateEcheance)}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <Link href={`/dashboard/devis/${devis.id}`}>
                      <Button size="sm" variant="outline">
                        <Eye size={14} />
                      </Button>
                    </Link>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditDevis(devis)}
                    >
                      <Edit size={14} />
                    </Button>

                    {devis.type === 'DEVIS' && devis.statut === 'ACCEPTE' && (
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => handleConvertToFacture(devis)}
                      >
                        <CreditCard size={14} />
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const RenderTableView = () => (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {[
                { key: 'numero', label: 'Numéro', width: 'w-40' },
                { key: 'client', label: 'Client', width: 'w-48' },
                { key: 'chantier', label: 'Chantier', width: 'w-44' },
                { key: 'montantHT', label: 'Montant HT', width: 'w-32' },
                { key: 'statut', label: 'Statut', width: 'w-36' },
                { key: 'dateCreation', label: 'Date création', width: 'w-36' },
                { key: 'actions', label: 'Actions', width: 'w-32' }
              ].map((column) => (
                <th 
                  key={column.key} 
                  className={`${column.width} px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors`}
                  onClick={() => column.key !== 'actions' && handleSort(column.key)}
                >
                  <div className="flex items-center gap-2">
                    <span>{column.label}</span>
                    {column.key !== 'actions' && (
                      <div className="flex flex-col">
                        <ChevronUp 
                          size={12} 
                          className={`${sortBy === column.key && sortOrder === 'asc' ? 'text-indigo-600' : 'text-gray-300'} transition-colors`} 
                        />
                        <ChevronDown 
                          size={12} 
                          className={`${sortBy === column.key && sortOrder === 'desc' ? 'text-indigo-600' : 'text-gray-300'} transition-colors -mt-1`} 
                        />
                      </div>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {sortedDevis.map((devis) => (
              <tr key={devis.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{devis.numero}</div>
                    <div className="text-xs text-gray-500">{typeLabels[devis.type]}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {devis.client.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">{devis.client.name}</div>
                      {devis.client.company && (
                        <div className="text-xs text-gray-500 truncate">{devis.client.company}</div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {devis.chantier ? (
                    <div>
                      <div className="text-sm font-medium text-gray-900 truncate">{devis.chantier.nom}</div>
                      <div className="text-xs text-gray-500 truncate">{devis.chantier.adresse}</div>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400 italic">Aucun chantier</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-semibold text-gray-900">
                    {formatAmount(devis.totalHT || devis.montant)}
                  </div>
                  <div className="text-xs text-gray-500">
                    TTC: {formatAmount(devis.totalTTC || devis.montant)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${statusColors[devis.statut].bg} ${statusColors[devis.statut].text} ${statusColors[devis.statut].border}`}>
                    <span className="mr-1">{statusColors[devis.statut].icon}</span>
                    <span>{statusLabels[devis.statut]}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(devis.dateCreation)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-1">
                    <Link href={`/dashboard/devis/${devis.id}`}>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                        <Eye size={14} />
                      </Button>
                    </Link>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-8 w-8 p-0"
                      onClick={() => handleEditDevis(devis)}
                    >
                      <Edit size={14} />
                    </Button>
                    {devis.type === 'DEVIS' && devis.statut === 'ACCEPTE' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                        onClick={() => handleConvertToFacture(devis)}
                        title="Convertir en facture"
                      >
                        <CreditCard size={14} />
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                      <Download size={14} />
                    </Button>
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="bg-white rounded-2xl border border-gray-200 p-6 animate-pulse">
          <div className="h-4 bg-gray-200 rounded mb-4"></div>
          <div className="h-6 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      ))}
    </div>
  );

  const EmptyState = () => (
    <div className="text-center py-12">
      <FileText size={64} className="mx-auto text-gray-300 mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun devis trouvé</h3>
      <p className="text-gray-500 mb-6">
        {search || statusFilter !== "TOUS" || typeFilter !== "TOUS"
          ? 'Aucun devis ne correspond à vos critères de recherche'
          : 'Commencez par créer votre premier devis pour gérer vos documents commerciaux'
        }
      </p>
      {(!search && statusFilter === "TOUS" && typeFilter === "TOUS") && (
        <Link href="/dashboard/devis/nouveau">
          <Button>
            <Plus size={18} className="mr-2" />
            Créer mon premier devis
          </Button>
        </Link>
      )}
    </div>
  );

  const Pagination = () => (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <span>
          {pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} sur {pagination.total}
        </span>
      </div>
      
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(pagination.page - 1)}
          disabled={!pagination.hasPrevPage}
        >
          Précédent
        </Button>
        
        <div className="flex items-center gap-1">
          {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
            const pageNum = i + 1;
            return (
              <Button
                key={pageNum}
                variant={pageNum === pagination.page ? "default" : "outline"}
                size="sm"
                onClick={() => handlePageChange(pageNum)}
                className="w-8 h-8 p-0"
              >
                {pageNum}
              </Button>
            );
          })}
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(pagination.page + 1)}
          disabled={!pagination.hasNextPage}
        >
          Suivant
        </Button>
      </div>
    </div>
  );

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Mes Devis</h1>
            <p className="text-gray-500">
              Gérez vos devis, factures et documents commerciaux
            </p>
          </div>
          <Link href="/dashboard/devis/nouveau">
            <Button className="flex items-center gap-2">
              <Plus size={18} />
              Nouveau devis
            </Button>
          </Link>
        </div>
        
        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Brouillons</p>
                <p className="text-2xl font-bold text-gray-900">{devisBrouillon}</p>
              </div>
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <FileText size={24} className="text-gray-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Envoyés</p>
                <p className="text-2xl font-bold text-blue-900">{devisEnvoyes}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileUp size={24} className="text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Acceptés</p>
                <p className="text-2xl font-bold text-green-900">{devisAcceptes}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle2 size={24} className="text-green-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Montant total</p>
                <p className="text-2xl font-bold text-purple-900">{formatAmount(montantTotal)}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <DollarSign size={24} className="text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filtres et recherche */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={18} className="text-gray-400" />
              </div>
              <Input
                placeholder="Rechercher par numéro, objet ou client..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-4">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as DevisStatus | "TOUS")}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="TOUS">Tous les statuts</option>
                <option value="BROUILLON">Brouillons</option>
                <option value="ENVOYE">Envoyés</option>
                <option value="ACCEPTE">Acceptés</option>
                <option value="REFUSE">Refusés</option>
                <option value="FACTURE">Facturés</option>
                <option value="EXPIRE">Expirés</option>
              </select>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as DevisType | "TOUS")}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="TOUS">Tous les types</option>
                <option value="DEVIS">Devis</option>
                <option value="FACTURE">Factures</option>
                <option value="AVOIR">Avoirs</option>
              </select>

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
        </div>

        {/* Contenu principal */}
        {loading ? (
          <LoadingSkeleton />
        ) : devis.length === 0 ? (
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
          <DevisForm 
            devis={editingDevis}
            onClose={handleFormClose}
            onSuccess={handleFormSuccess}
          />
        )}
      </div>
    </div>
  );
}