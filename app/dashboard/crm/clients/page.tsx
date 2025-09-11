'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Users, Plus, Target, ArrowLeft, Mail, MapPin, Phone, Grid, List, Table, ChevronUp, ChevronDown, Eye, Edit, CreditCard, Download } from 'lucide-react';
import ClientDetail from '@/components/crm/ClientDetail';

export default function CRMClientsPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'table'>('table');
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [filters, setFilters] = useState({
    search: '',
    typeClient: 'TOUS',
    commercial: '',
    ville: '',
    dateContact: '',
    pipelineMin: '',
    pipelineMax: ''
  });

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      setLoading(true);
      
      // Utiliser l'API users existante pour récupérer les clients
      const response = await fetch('/api/users?role=CLIENT&limit=100');
      
      if (response.ok) {
        const data = await response.json();
        console.log('API Response:', data); // Debug
        
        if (data.users && data.users.length > 0) {
          // Enrichir les données API avec des métadonnées CRM calculées
          const enrichedClients = data.users.map((user: any) => ({
            ...user,
            typeClient: user.typeClient || (user.company ? 'PROFESSIONNEL' : 'PARTICULIER'),
            chiffreAffaires: user.chiffreAffaires || 0,
            dernierContact: user.updatedAt || user.createdAt,
            nbOpportunites: user._count?.chantiers || 0,
            valeurPipeline: (user._count?.devis || 0) * 25000,
            ville: user.ville || 'Non renseignée'
          }));
          
          setClients(enrichedClients);
          console.log('Clients loaded:', enrichedClients.length);
        } else {
          console.log('No clients found in API response');
          setClients([]);
        }
      } else {
        console.error('API Error:', response.status, response.statusText);
        setClients([]);
      }
    } catch (error) {
      console.error('Erreur chargement clients:', error);
      setClients([]);
    } finally {
      setLoading(false);
    }
  };

  const getTypeClientConfig = (type: string) => {
    const configs = {
      PARTICULIER: { bg: "bg-blue-100", text: "text-blue-800", border: "border-blue-200", label: "Particulier" },
      PROFESSIONNEL: { bg: "bg-green-100", text: "text-green-800", border: "border-green-200", label: "Professionnel" },
      SYNDIC: { bg: "bg-amber-100", text: "text-amber-800", border: "border-amber-200", label: "Syndic" },
      PROMOTEUR: { bg: "bg-purple-100", text: "text-purple-800", border: "border-purple-200", label: "Promoteur" }
    };
    return configs[type as keyof typeof configs] || { bg: "bg-gray-100", text: "text-gray-800", border: "border-gray-200", label: type };
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Aujourd\'hui';
    if (diffDays === 1) return 'Hier';
    if (diffDays < 7) return `Il y a ${diffDays} jours`;
    return date.toLocaleDateString('fr-FR');
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const filteredClients = useMemo(() => {
    if (!clients || clients.length === 0) return [];
    return clients.filter(client => {
      const matchSearch = client.name.toLowerCase().includes(filters.search.toLowerCase()) ||
                         client.email.toLowerCase().includes(filters.search.toLowerCase()) ||
                         (client.company && client.company.toLowerCase().includes(filters.search.toLowerCase()));
      
      const matchType = filters.typeClient === 'TOUS' || client.typeClient === filters.typeClient;
      
      const matchVille = filters.ville === '' || 
                        (client.ville && client.ville.toLowerCase().includes(filters.ville.toLowerCase()));
      
      const matchPipelineMin = filters.pipelineMin === '' || 
                              client.valeurPipeline >= parseFloat(filters.pipelineMin);
                              
      const matchPipelineMax = filters.pipelineMax === '' || 
                              client.valeurPipeline <= parseFloat(filters.pipelineMax);
      
      return matchSearch && matchType && matchVille && matchPipelineMin && matchPipelineMax;
    });
  }, [clients, filters]);

  const sortedClients = useMemo(() => {
    if (!filteredClients || filteredClients.length === 0) return [];
    return [...filteredClients].sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name;
          bValue = b.name;
          break;
        case 'type':
          aValue = a.typeClient;
          bValue = b.typeClient;
          break;
        case 'ville':
          aValue = a.ville || '';
          bValue = b.ville || '';
          break;
        case 'pipeline':
          aValue = a.valeurPipeline;
          bValue = b.valeurPipeline;
          break;
        case 'dernierContact':
          aValue = new Date(a.dernierContact).getTime();
          bValue = new Date(b.dernierContact).getTime();
          break;
        case 'chiffreAffaires':
          aValue = a.chiffreAffaires;
          bValue = b.chiffreAffaires;
          break;
        default:
          aValue = a.name;
          bValue = b.name;
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
  }, [filteredClients, sortBy, sortOrder]);

  if (selectedClient) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="mb-8">
            <Button 
              variant="outline" 
              onClick={() => setSelectedClient(null)}
              className="flex items-center gap-2"
            >
              <ArrowLeft size={18} />
              Retour à la liste
            </Button>
          </div>
          <ClientDetail clientId={selectedClient} />
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-xl p-6 border border-gray-200">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="h-16 bg-gray-200 rounded"></div>
                    <div className="h-16 bg-gray-200 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header CRM Professionnel */}
        <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700 rounded-3xl p-8 text-white shadow-xl mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-6 mb-6 lg:mb-0">
              <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center backdrop-blur-sm border border-white/30">
                <Users size={40} />
              </div>
              <div>
                <h1 className="text-4xl font-bold mb-2">👥 Base Clients CRM</h1>
                <p className="text-xl text-blue-100 mb-2">
                  Gestion professionnelle de votre portefeuille client
                </p>
                <div className="flex items-center gap-6 text-blue-200 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span>{filteredClients.length} client{filteredClients.length > 1 ? 's' : ''} actifs</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                    <span>Pipeline: {formatCurrency(clients.reduce((sum, c) => sum + c.valeurPipeline, 0))}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                    <span>CA moyen: {formatCurrency(clients.reduce((sum, c) => sum + c.chiffreAffaires, 0) / Math.max(clients.length, 1))}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg p-1">
                <Button
                  variant={viewMode === 'table' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('table')}
                  className="bg-transparent hover:bg-white/20 text-white border-none"
                  title="Vue tableau"
                >
                  <Table size={18} />
                </Button>
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="bg-transparent hover:bg-white/20 text-white border-none"
                  title="Vue grille"
                >
                  <Grid size={18} />
                </Button>
              </div>
              
              <Button 
                onClick={() => {
                  const csvData = filteredClients.map(client => ({
                    Nom: client.name,
                    Email: client.email,
                    Entreprise: client.company || '',
                    Type: client.typeClient,
                    Téléphone: client.phone || '',
                    Ville: client.ville,
                    'CA Potentiel': client.chiffreAffaires,
                    'Valeur Pipeline': client.valeurPipeline,
                    'Nb Opportunités': client.nbOpportunites,
                    'Dernier Contact': formatDate(client.dernierContact)
                  }));
                  const csvContent = "data:text/csv;charset=utf-8," 
                    + Object.keys(csvData[0]).join(",") + "\n"
                    + csvData.map(row => Object.values(row).join(",")).join("\n");
                  const encodedUri = encodeURI(csvContent);
                  const link = document.createElement("a");
                  link.setAttribute("href", encodedUri);
                  link.setAttribute("download", "clients_crm_" + new Date().toISOString().split('T')[0] + ".csv");
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
                className="flex items-center gap-2 bg-white/20 backdrop-blur-sm border border-white/30 text-white hover:bg-white/30"
              >
                <Download size={20} />
                Export CSV
              </Button>
              
              <Link href="/dashboard/crm/pipeline">
                <Button className="flex items-center gap-2 bg-white/20 backdrop-blur-sm border border-white/30 text-white hover:bg-white/30">
                  <Target size={20} />
                  Pipeline
                </Button>
              </Link>
              
              <Link href="/dashboard/users/nouveau">
                <Button className="flex items-center gap-2 bg-white text-indigo-600 hover:bg-blue-50 shadow-lg">
                  <Plus size={20} />
                  Nouveau Client
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Filtres avancés */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <div className="lg:col-span-2">
              <Input
                type="text"
                placeholder="Rechercher par nom, email ou entreprise..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
            </div>
            
            <select
              value={filters.typeClient}
              onChange={(e) => setFilters({ ...filters, typeClient: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            >
              <option value="TOUS">Tous les types</option>
              <option value="PARTICULIER">Particuliers</option>
              <option value="PROFESSIONNEL">Professionnels</option>
              <option value="SYNDIC">Syndics</option>
              <option value="PROMOTEUR">Promoteurs</option>
            </select>

            <Input
              type="text"
              placeholder="Ville..."
              value={filters.ville}
              onChange={(e) => setFilters({ ...filters, ville: e.target.value })}
              className="text-sm"
            />

            <Input
              type="number"
              placeholder="Pipeline min (€)"
              value={filters.pipelineMin}
              onChange={(e) => setFilters({ ...filters, pipelineMin: e.target.value })}
              className="text-sm"
            />

            <Input
              type="number"
              placeholder="Pipeline max (€)"
              value={filters.pipelineMax}
              onChange={(e) => setFilters({ ...filters, pipelineMax: e.target.value })}
              className="text-sm"
            />
          </div>
          
          {/* Bouton de réinitialisation des filtres */}
          <div className="mt-4 flex justify-between items-center">
            <button
              onClick={() => setFilters({
                search: '',
                typeClient: 'TOUS',
                commercial: '',
                ville: '',
                dateContact: '',
                pipelineMin: '',
                pipelineMax: ''
              })}
              className="text-sm text-gray-500 hover:text-gray-700 underline"
            >
              🔄 Réinitialiser les filtres
            </button>
            
            <div className="text-sm text-gray-500">
              {filteredClients.length} client{filteredClients.length > 1 ? 's' : ''} trouvé{filteredClients.length > 1 ? 's' : ''}
            </div>
          </div>
        </div>

        {/* Liste des clients */}
        {filteredClients.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
            <Users size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Aucun client trouvé
            </h3>
            <p className="text-gray-500 mb-6">
              {filters.search || filters.typeClient !== 'TOUS' ? 
                'Aucun client ne correspond à vos critères de recherche.' :
                'Commencez par ajouter vos premiers clients.'
              }
            </p>
            <Link href="/dashboard/users">
              <Button>Ajouter un client</Button>
            </Link>
          </div>
        ) : (
          <>
            {viewMode === 'table' ? (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        {[
                          { key: 'name', label: 'Nom', width: 'w-48' },
                          { key: 'type', label: 'Type', width: 'w-32' },
                          { key: 'ville', label: 'Ville', width: 'w-32' },
                          { key: 'pipeline', label: 'Pipeline', width: 'w-32' },
                          { key: 'dernierContact', label: 'Dernière interaction', width: 'w-40' },
                          { key: 'chiffreAffaires', label: 'Chiffre d\'affaires', width: 'w-36' },
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
                      {sortedClients.map((client) => (
                        <tr key={client.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                                {client.name.split(' ').map((n: string) => n[0]).join('')}
                              </div>
                              <div className="min-w-0">
                                <div className="text-sm font-medium text-gray-900 truncate">{client.name}</div>
                                {client.company && (
                                  <div className="text-xs text-gray-500 truncate">{client.company}</div>
                                )}
                                <div className="text-xs text-gray-500 truncate">{client.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium border ${getTypeClientConfig(client.typeClient).bg} ${getTypeClientConfig(client.typeClient).text} ${getTypeClientConfig(client.typeClient).border}`}>
                              {getTypeClientConfig(client.typeClient).label}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {client.ville ? (
                              <div className="flex items-center gap-1 text-sm text-gray-900">
                                <MapPin size={14} className="text-gray-400" />
                                {client.ville}
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400 italic">Non spécifiée</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-semibold text-gray-900">
                                {formatCurrency(client.valeurPipeline)}
                              </div>
                              <div className="text-xs text-gray-500">
                                {client.nbOpportunites} opportunité{client.nbOpportunites > 1 ? 's' : ''}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(client.dernierContact)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-semibold text-gray-900">
                              {formatCurrency(client.chiffreAffaires)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-1">
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="h-8 w-8 p-0"
                                onClick={() => setSelectedClient(client.id)}
                              >
                                <Eye size={14} />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                                onClick={() => window.open(`tel:${client.phone}`, '_self')}
                                title="Appeler"
                              >
                                <Phone size={14} />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700"
                                onClick={() => window.open(`mailto:${client.email}`, '_blank')}
                                title="Email"
                              >
                                <Mail size={14} />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="h-8 w-8 p-0 text-purple-600 hover:text-purple-700"
                                onClick={() => window.open(`/dashboard/devis/nouveau?clientId=${client.id}`, '_blank')}
                                title="Nouveau devis"
                              >
                                <CreditCard size={14} />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sortedClients.map((client) => (
              <div
                key={client.id}
                className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-105 p-6 cursor-pointer group"
                onClick={() => setSelectedClient(client.id)}
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    {client.name.split(' ').map((n: string) => n[0]).join('')}
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">
                      {client.name}
                    </h3>
                    {client.company && (
                      <p className="text-sm text-gray-600 mb-2">
                        {client.company}
                      </p>
                    )}
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getTypeClientConfig(client.typeClient).bg} ${getTypeClientConfig(client.typeClient).text} ${getTypeClientConfig(client.typeClient).border}`}>
                        {getTypeClientConfig(client.typeClient).label}
                      </span>
                      {client.ville && (
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <MapPin size={12} />
                          {client.ville}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-blue-50 p-3 rounded-lg text-center">
                    <div className="text-lg font-bold text-blue-600">
                      {client.nbOpportunites}
                    </div>
                    <div className="text-xs text-blue-600">
                      Opportunités
                    </div>
                  </div>
                  
                  <div className="bg-green-50 p-3 rounded-lg text-center">
                    <div className="text-sm font-bold text-green-600">
                      {formatCurrency(client.valeurPipeline)}
                    </div>
                    <div className="text-xs text-green-600">
                      Pipeline
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100 space-y-2">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Mail size={12} />
                    {client.email}
                  </div>
                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Phone size={12} />
                      {client.phone}
                    </div>
                    <div>
                      Contact: {formatDate(client.dernierContact)}
                    </div>
                  </div>
                  
                  {/* Quick Actions par client */}
                  <div className="flex gap-1 mt-3 pt-2 border-t border-gray-100">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(`tel:${client.phone}`, '_self');
                      }}
                      className="flex-1 px-2 py-1 text-xs bg-green-50 text-green-700 rounded hover:bg-green-100 transition-colors"
                      title="Appeler"
                    >
                      📞
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(`mailto:${client.email}`, '_blank');
                      }}
                      className="flex-1 px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors"
                      title="Email"
                    >
                      📧
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(`/dashboard/devis/nouveau?clientId=${client.id}`, '_blank');
                      }}
                      className="flex-1 px-2 py-1 text-xs bg-purple-50 text-purple-700 rounded hover:bg-purple-100 transition-colors"
                      title="Devis"
                    >
                      📄
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(`/dashboard/planning/nouveau?clientId=${client.id}`, '_blank');
                      }}
                      className="flex-1 px-2 py-1 text-xs bg-orange-50 text-orange-700 rounded hover:bg-orange-100 transition-colors"
                      title="RDV"
                    >
                      📅
                    </button>
                  </div>
                </div>
              </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}