"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  FolderOpen, Upload, Search, Filter, Download, Eye, MoreHorizontal, 
  FileText, Image, Archive, Trash2, Share2, Star, Calendar, User,
  File, Video, Music, ChevronUp, ChevronDown, Table, Grid
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Document {
  id: string;
  name: string;
  type: 'pdf' | 'image' | 'video' | 'audio' | 'document' | 'archive' | 'other';
  size: number;
  url: string;
  uploadedBy: {
    id: string;
    name: string;
  };
  uploadedAt: string;
  chantier?: {
    id: string;
    nom: string;
  };
  category: 'plans' | 'photos' | 'factures' | 'devis' | 'rapports' | 'autres';
  isStarred: boolean;
  description?: string;
  tags?: string[];
}

interface Folder {
  id: string;
  name: string;
  parentId?: string;
  documentsCount: number;
  createdAt: string;
  chantier?: {
    id: string;
    nom: string;
  };
}

const documentIcons = {
  pdf: FileText,
  image: Image,
  video: Video,
  audio: Music,
  document: FileText,
  archive: Archive,
  other: File
};

const categoryColors = {
  plans: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200' },
  photos: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200' },
  factures: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200' },
  devis: { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-200' },
  rapports: { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-200' },
  autres: { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-200' }
};

const categoryLabels = {
  plans: 'Plans',
  photos: 'Photos',
  factures: 'Factures',
  devis: 'Devis',
  rapports: 'Rapports',
  autres: 'Autres'
};

export default function DocumentsPage() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("tous");
  const [viewMode, setViewMode] = useState<"grid" | "list" | "table">("table");
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<string>('uploadedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Données simulées pour les dossiers
  const mockFolders: Folder[] = [
    {
      id: "1",
      name: "Villa Moderne",
      documentsCount: 12,
      createdAt: "2024-01-15T10:00:00Z",
      chantier: { id: "1", nom: "Villa Moderne" }
    },
    {
      id: "2",
      name: "Rénovation Appartement",
      documentsCount: 8,
      createdAt: "2024-02-01T09:00:00Z",
      chantier: { id: "2", nom: "Rénovation Appartement" }
    },
    {
      id: "3",
      name: "Documents administratifs",
      documentsCount: 25,
      createdAt: "2024-01-01T08:00:00Z"
    }
  ];

  // Charger les documents depuis l'API
  const loadDocuments = async () => {
    try {
      const searchQuery = search ? `&search=${encodeURIComponent(search)}` : '';
      const categoryQuery = categoryFilter !== 'tous' ? `&type=${categoryFilter}` : '';
      const response = await fetch(`/api/documents?page=1&limit=50${searchQuery}${categoryQuery}`);
      
      if (response.ok) {
        const data = await response.json();
        setDocuments(data.documents.map((doc: any) => ({
          id: doc.id,
          name: doc.nom,
          type: doc.type.toLowerCase(),
          size: doc.taille,
          url: doc.url,
          uploadedBy: doc.uploader,
          uploadedAt: doc.createdAt,
          chantier: doc.chantier,
          category: mapDocumentTypeToCategory(doc.type),
          isStarred: false, // TODO: implémenter le système de favoris
          description: doc.tags || '',
          tags: doc.tags ? doc.tags.split(',') : []
        })));
        
        // Mettre à jour les statistiques
        if (data.stats) {
          // Utiliser les vraies statistiques de l'API
          console.log('Statistiques documents:', data.stats);
        }
      } else {
        console.error('Erreur lors du chargement des documents');
      }
    } catch (error) {
      console.error('Erreur lors du chargement des documents:', error);
    }
  };

  // Mapper les types de documents vers les catégories d'affichage
  const mapDocumentTypeToCategory = (type: string): string => {
    switch (type) {
      case 'PDF': return 'plans';
      case 'PHOTO': return 'photos';
      case 'FACTURE': return 'factures';
      case 'PLAN': return 'plans';
      case 'CONTRAT': return 'devis';
      default: return 'autres';
    }
  };

  useEffect(() => {
    loadDocuments();
    setLoading(false);
  }, [search, categoryFilter]);

  const handleDeleteDocuments = async (documentIds: string[]) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer ${documentIds.length} document(s) ?`)) {
      try {
        const response = await fetch('/api/documents', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ documentIds }),
        });

        if (response.ok) {
          // Recharger les documents
          await loadDocuments();
          setSelectedItems([]);
          console.log('Documents supprimés avec succès');
        } else {
          console.error('Erreur lors de la suppression des documents');
        }
      } catch (error) {
        console.error('Erreur lors de la suppression des documents:', error);
      }
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const filteredAndSortedDocuments = documents.filter(doc => {
    const matchesSearch = !search || 
      doc.name.toLowerCase().includes(search.toLowerCase()) ||
      doc.description?.toLowerCase().includes(search.toLowerCase()) ||
      doc.tags?.some(tag => tag.toLowerCase().includes(search.toLowerCase()));
    
    const matchesCategory = categoryFilter === "tous" || doc.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  }).sort((a, b) => {
    let aValue, bValue;
    
    switch (sortBy) {
      case 'name':
        aValue = a.name;
        bValue = b.name;
        break;
      case 'category':
        aValue = a.category;
        bValue = b.category;
        break;
      case 'chantier':
        aValue = a.chantier?.nom || '';
        bValue = b.chantier?.nom || '';
        break;
      case 'size':
        aValue = a.size;
        bValue = b.size;
        break;
      case 'uploadedBy':
        aValue = a.uploadedBy.name;
        bValue = b.uploadedBy.name;
        break;
      case 'uploadedAt':
      default:
        aValue = new Date(a.uploadedAt).getTime();
        bValue = new Date(b.uploadedAt).getTime();
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

  const handleSelectItem = (id: string) => {
    setSelectedItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const handleDownloadSelected = async () => {
    if (selectedItems.length === 0) {
      alert('Aucun document sélectionné');
      return;
    }

    try {
      for (const documentId of selectedItems) {
        const response = await fetch(`/api/documents/${documentId}/download`);
        if (response.ok) {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.style.display = 'none';
          a.href = url;
          a.download = `document-${documentId}`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        }
      }
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
      alert('Erreur lors du téléchargement des documents');
    }
  };

  const handleShareSelected = () => {
    if (selectedItems.length === 0) {
      alert('Aucun document sélectionné');
      return;
    }

    const email = prompt('Adresse email du destinataire:');
    if (email && email.includes('@')) {
      fetch('/api/documents/share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentIds: selectedItems,
          recipientEmail: email,
        }),
      }).then(response => {
        if (response.ok) {
          alert('Documents partagés avec succès');
          setSelectedItems([]);
        } else {
          alert('Erreur lors du partage des documents');
        }
      });
    }
  };

  const handlePreviewDocument = async (documentId: string) => {
    try {
      const response = await fetch(`/api/documents/${documentId}`);
      if (response.ok) {
        const document = await response.json();
        if (document.type && (document.type === 'PHOTO' || document.type === 'PDF' || document.type === 'PLAN')) {
          window.open(`/api/documents/${documentId}/preview`, '_blank');
        } else {
          alert('Aperçu non disponible pour ce type de document');
        }
      }
    } catch (error) {
      console.error('Erreur lors de l\'aperçu:', error);
      alert('Erreur lors de l\'aperçu du document');
    }
  };

  const handleDownloadDocument = async (documentId: string) => {
    try {
      const response = await fetch(`/api/documents/${documentId}/download`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `document-${documentId}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert('Erreur lors du téléchargement');
      }
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
      alert('Erreur lors du téléchargement du document');
    }
  };

  const handleMoreActions = (documentId: string) => {
    const actions = [
      'Renommer',
      'Déplacer vers un chantier',
      'Copier le lien',
      'Supprimer'
    ];
    
    const choice = prompt(`Actions pour le document:\n${actions.map((action, i) => `${i + 1}. ${action}`).join('\n')}\n\nEntrez le numéro de votre choix:`);
    
    if (choice) {
      const choiceNum = parseInt(choice);
      switch (choiceNum) {
        case 1:
          const newName = prompt('Nouveau nom:');
          if (newName && newName.trim()) {
            fetch(`/api/documents/${documentId}`, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ nom: newName.trim() }),
            }).then(response => {
              if (response.ok) {
                loadDocuments();
                alert('Document renommé avec succès');
              } else {
                alert('Erreur lors du renommage');
              }
            });
          }
          break;
        case 2:
          alert('Fonctionnalité de déplacement en cours de développement');
          break;
        case 3:
          navigator.clipboard.writeText(`${window.location.origin}/api/documents/${documentId}/preview`)
            .then(() => alert('Lien copié dans le presse-papiers'))
            .catch(() => alert('Erreur lors de la copie du lien'));
          break;
        case 4:
          if (confirm('Supprimer définitivement ce document ?')) {
            fetch(`/api/documents/${documentId}`, {
              method: 'DELETE',
            }).then(response => {
              if (response.ok) {
                loadDocuments();
                alert('Document supprimé avec succès');
              } else {
                alert('Erreur lors de la suppression');
              }
            });
          }
          break;
        default:
          break;
      }
    }
  };

  const handleStarDocument = (id: string) => {
    setDocuments(prev => prev.map(doc => 
      doc.id === id ? { ...doc, isStarred: !doc.isStarred } : doc
    ));
  };

  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg p-6 border h-32"></div>
              ))}
            </div>
            <div className="bg-white rounded-lg p-6 border h-96"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* En-tête */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Documents</h1>
            <p className="text-gray-500">
              Gérez tous vos documents et fichiers de chantiers
            </p>
          </div>
          <Link href="/dashboard/documents/upload">
            <Button className="flex items-center gap-2">
              <Upload size={18} />
              Importer des documents
            </Button>
          </Link>
        </div>

        {/* Statistiques rapides */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total documents</p>
                <p className="text-2xl font-bold text-gray-900">{documents.length}</p>
              </div>
              <FolderOpen size={24} className="text-blue-400" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Favoris</p>
                <p className="text-2xl font-bold text-yellow-900">
                  {documents.filter(d => d.isStarred).length}
                </p>
              </div>
              <Star size={24} className="text-yellow-400" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Dossiers</p>
                <p className="text-2xl font-bold text-green-900">{folders.length}</p>
              </div>
              <FolderOpen size={24} className="text-green-400" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Espace utilisé</p>
                <p className="text-2xl font-bold text-purple-900">
                  {formatFileSize(documents.reduce((total, doc) => total + doc.size, 0))}
                </p>
              </div>
              <Archive size={24} className="text-purple-400" />
            </div>
          </div>
        </div>

        {/* Filtres et recherche */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-64">
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Rechercher dans les documents..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Filter size={18} className="text-gray-400" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="tous">Toutes catégories</option>
                <option value="plans">Plans</option>
                <option value="photos">Photos</option>
                <option value="factures">Factures</option>
                <option value="devis">Devis</option>
                <option value="rapports">Rapports</option>
                <option value="autres">Autres</option>
              </select>
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
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                title="Vue liste"
              >
                <FolderOpen size={18} />
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

        {/* Actions bulk si des éléments sont sélectionnés */}
        {selectedItems.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-blue-800">
                {selectedItems.length} élément(s) sélectionné(s)
              </span>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={handleDownloadSelected}>
                  <Download size={16} className="mr-2" />
                  Télécharger
                </Button>
                <Button size="sm" variant="outline" onClick={handleShareSelected}>
                  <Share2 size={16} className="mr-2" />
                  Partager
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="text-red-600 hover:text-red-700"
                  onClick={() => handleDeleteDocuments(selectedItems)}
                >
                  <Trash2 size={16} className="mr-2" />
                  Supprimer
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Liste des documents */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-3 px-6 font-medium text-gray-900">
                    <input
                      type="checkbox"
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedItems(filteredAndSortedDocuments.map(d => d.id));
                        } else {
                          setSelectedItems([]);
                        }
                      }}
                      checked={selectedItems.length === filteredAndSortedDocuments.length && filteredAndSortedDocuments.length > 0}
                    />
                  </th>
                  {[
                    { key: 'name', label: 'Nom fichier', width: 'w-64' },
                    { key: 'category', label: 'Type', width: 'w-32' },
                    { key: 'size', label: 'Taille', width: 'w-24' },
                    { key: 'chantier', label: 'Chantier/Client', width: 'w-40' },
                    { key: 'uploadedAt', label: 'Date upload', width: 'w-36' },
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
                {filteredAndSortedDocuments.map((document) => {
                  const IconComponent = documentIcons[document.type] || File;
                  return (
                    <tr key={document.id} className="hover:bg-gray-50">
                      <td className="py-4 px-6">
                        <input
                          type="checkbox"
                          checked={selectedItems.includes(document.id)}
                          onChange={() => handleSelectItem(document.id)}
                        />
                      </td>
                      
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0">
                            <IconComponent size={20} className="text-gray-400" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {document.name}
                              </p>
                              {document.isStarred && (
                                <Star size={16} className="text-yellow-400 fill-current" />
                              )}
                            </div>
                            {document.description && (
                              <p className="text-xs text-gray-500 truncate">
                                {document.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${categoryColors[document.category].bg} ${categoryColors[document.category].text} ${categoryColors[document.category].border}`}>
                          <IconComponent size={12} className="mr-1" />
                          {categoryLabels[document.category]}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">
                          {formatFileSize(document.size)}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        {document.chantier ? (
                          <div>
                            <div className="text-sm font-medium text-gray-900 truncate">{document.chantier.nom}</div>
                            <div className="text-xs text-gray-500">Chantier</div>
                          </div>
                        ) : (
                          <div>
                            <div className="text-sm font-medium text-gray-900 truncate">{document.uploadedBy.name}</div>
                            <div className="text-xs text-gray-500">Utilisateur</div>
                          </div>
                        )}
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(document.uploadedAt)}
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0" title="Aperçu" onClick={() => handlePreviewDocument(document.id)}>
                            <Eye size={14} />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0" title="Télécharger" onClick={() => handleDownloadDocument(document.id)}>
                            <Download size={14} />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-8 w-8 p-0"
                            onClick={() => handleStarDocument(document.id)}
                            title={document.isStarred ? "Retirer des favoris" : "Ajouter aux favoris"}
                          >
                            <Star size={14} className={document.isStarred ? "text-yellow-400 fill-current" : ""} />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0" title="Plus d'actions" onClick={() => handleMoreActions(document.id)}>
                            <MoreHorizontal size={14} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {filteredAndSortedDocuments.length === 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <FolderOpen size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun document trouvé</h3>
            <p className="text-gray-500">
              Aucun document ne correspond à vos critères de recherche
            </p>
          </div>
        )}
      </div>
    </div>
  );
}