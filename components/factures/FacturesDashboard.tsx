'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DevisStatus } from '@prisma/client';
import { 
  Search, Grid, Table, ChevronUp, ChevronDown, Eye, Edit, 
  Download, AlertCircle, CheckCircle2, Clock, DollarSign,
  CreditCard, FileText
} from 'lucide-react';
import { useToastContext } from '@/components/providers/ToastProvider';

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

export default function FacturesDashboard() {
  const [factures, setFactures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<DevisStatus | "TOUS">("TOUS");
  const [viewMode, setViewMode] = useState<"grid" | "table">("table");
  const [sortBy, setSortBy] = useState<string>('dateCreation');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const { success, error: showError } = useToastContext();

  useEffect(() => {
    fetchFactures();
  }, [search, statusFilter]);

  const fetchFactures = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        type: 'FACTURE',
        page: '1',
        limit: '50'
      });
      
      if (search) params.append('search', search);
      if (statusFilter !== 'TOUS') params.append('status', statusFilter);
      
      const response = await fetch(`/api/devis?${params}`);
      if (response.ok) {
        const data = await response.json();
        setFactures(data.devis || []);
      } else {
        // Fallback avec des données mock
        const mockFactures = [
          {
            id: '1',
            numero: 'FACT-2024-001',
            client: { name: 'Sophie Durand', company: 'Durand & Associés' },
            montant: 15420.50,
            totalTTC: 18504.60,
            statut: 'ENVOYE',
            dateEcheance: '2024-12-15',
            dateCreation: '2024-11-15'
          },
          {
            id: '2', 
            numero: 'FACT-2024-002',
            client: { name: 'Pierre Martin', company: null },
            montant: 8750.00,
            totalTTC: 10500.00,
            statut: 'PAYE',
            dateEcheance: '2024-11-30',
            dateCreation: '2024-10-30'
          }
        ];
        setFactures(mockFactures);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des factures:', error);
      setFactures([]);
    } finally {
      setLoading(false);
    }
  };

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

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const sortedFactures = [...factures].sort((a, b) => {
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
      case 'montantTTC':
        aValue = a.totalTTC || a.montant;
        bValue = b.totalTTC || b.montant;
        break;
      case 'statut':
        aValue = a.statut;
        bValue = b.statut;
        break;
      case 'dateEcheance':
        aValue = new Date(a.dateEcheance).getTime();
        bValue = new Date(b.dateEcheance).getTime();
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

  // Statistiques des factures
  const facturesEnAttente = factures.filter(f => ['BROUILLON', 'ENVOYE'].includes(f.statut)).length;
  const facturesPayees = factures.filter(f => f.statut === 'PAYE').length;
  const facturesEnRetard = factures.filter(f => {
    const echeance = new Date(f.dateEcheance);
    const aujourd = new Date();
    return f.statut !== 'PAYE' && echeance < aujourd;
  }).length;
  const montantTotal = factures.reduce((sum, f) => sum + (f.totalTTC || f.montant), 0);

  const getStatutPaiement = (statut: string, dateEcheance: string) => {
    if (statut === 'PAYE') return { label: 'Payée', color: 'text-green-600', bg: 'bg-green-50' };
    
    const echeance = new Date(dateEcheance);
    const aujourd = new Date();
    
    if (echeance < aujourd) {
      return { label: 'En retard', color: 'text-red-600', bg: 'bg-red-50' };
    } else if (statut === 'ENVOYE') {
      return { label: 'En attente', color: 'text-orange-600', bg: 'bg-orange-50' };
    } else {
      return { label: 'Brouillon', color: 'text-gray-600', bg: 'bg-gray-50' };
    }
  };

  const LoadingSkeleton = () => (
    <div className="animate-pulse space-y-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/3"></div>
        </div>
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
                { key: 'numero', label: 'Numéro', width: 'w-40' },
                { key: 'client', label: 'Client', width: 'w-48' },
                { key: 'montantTTC', label: 'Montant TTC', width: 'w-32' },
                { key: 'statut', label: 'Statut paiement', width: 'w-36' },
                { key: 'dateEcheance', label: 'Échéance', width: 'w-32' },
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
            {sortedFactures.map((facture) => {
              const statutPaiement = getStatutPaiement(facture.statut, facture.dateEcheance);
              return (
                <tr key={facture.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{facture.numero}</div>
                      <div className="text-xs text-gray-500">Créée le {formatDate(facture.dateCreation)}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {facture.client.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">{facture.client.name}</div>
                        {facture.client.company && (
                          <div className="text-xs text-gray-500 truncate">{facture.client.company}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-gray-900">
                      {formatAmount(facture.totalTTC || facture.montant)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${statutPaiement.bg} ${statutPaiement.color}`}>
                      {facture.statut === 'PAYE' && <CheckCircle2 size={12} className="mr-1" />}
                      {facture.statut !== 'PAYE' && new Date(facture.dateEcheance) < new Date() && <AlertCircle size={12} className="mr-1" />}
                      {facture.statut === 'ENVOYE' && new Date(facture.dateEcheance) >= new Date() && <Clock size={12} className="mr-1" />}
                      <span>{statutPaiement.label}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(facture.dateEcheance)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <Link href={`/dashboard/devis/${facture.id}`}>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                          <Eye size={14} />
                        </Button>
                      </Link>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                        <Download size={14} />
                      </Button>
                      {facture.statut === 'ENVOYE' && (
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                          title="Marquer comme payée"
                        >
                          <CheckCircle2 size={14} />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">En attente</p>
              <p className="text-2xl font-bold text-orange-900">{facturesEnAttente}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Clock size={24} className="text-orange-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Payées</p>
              <p className="text-2xl font-bold text-green-900">{facturesPayees}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle2 size={24} className="text-green-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">En retard</p>
              <p className="text-2xl font-bold text-red-900">{facturesEnRetard}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertCircle size={24} className="text-red-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total mensuel</p>
              <p className="text-2xl font-bold text-purple-900">{formatAmount(montantTotal)}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <DollarSign size={24} className="text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filtres et recherche */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-400" />
            </div>
            <Input
              placeholder="Rechercher par numéro, client..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex gap-4 items-center">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as DevisStatus | "TOUS")}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="TOUS">Tous les statuts</option>
              <option value="BROUILLON">Brouillons</option>
              <option value="ENVOYE">En attente</option>
              <option value="PAYE">Payées</option>
            </select>

            <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-1">
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
            </div>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      {loading ? (
        <LoadingSkeleton />
      ) : factures.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
          <FileText size={64} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune facture trouvée</h3>
          <p className="text-gray-500 mb-6">
            {search || statusFilter !== "TOUS" ? 
              'Aucune facture ne correspond à vos critères de recherche' :
              'Commencez par créer votre première facture'
            }
          </p>
          <Link href="/dashboard/devis/nouveau?type=FACTURE">
            <Button>
              <CreditCard size={18} className="mr-2" />
              Créer une facture
            </Button>
          </Link>
        </div>
      ) : (
        <RenderTableView />
      )}
    </div>
  );
}
