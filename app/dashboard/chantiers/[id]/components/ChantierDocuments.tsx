'use client';

import { useState, useEffect } from 'react';
import { FileText, Upload, Download, Eye, Trash2, Calendar, User, Search } from 'lucide-react';
import { useToasts } from '@/hooks/useToasts';
import Link from 'next/link';

interface Document {
  id: string;
  nom: string;
  nomOriginal: string;
  type: 'PDF' | 'DOC' | 'XLSX' | 'PHOTO' | 'AUTRE';
  taille: number;
  url: string;
  createdAt: string;
  uploader: {
    id: string;
    name: string;
  };
  dossier?: string;
  tags?: string;
}

interface ChantierDocumentsProps {
  chantierId: string;
  initialDocuments?: Document[];
}

export default function ChantierDocuments({ chantierId, initialDocuments = [] }: ChantierDocumentsProps) {
  const [documents, setDocuments] = useState<Document[]>(initialDocuments);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('');
  const { success, error } = useToasts();

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ chantierId });
      if (searchTerm) params.append('search', searchTerm);
      if (selectedType) params.append('type', selectedType);

      const response = await fetch(`/api/documents?${params}`);
      
      if (response.ok) {
        const data = await response.json();
        setDocuments(data.documents || []);
      } else {
        console.error('Erreur chargement documents:', response.status);
      }
    } catch (err) {
      console.error('Erreur documents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (searchTerm || selectedType) {
      const debounceTimer = setTimeout(fetchDocuments, 300);
      return () => clearTimeout(debounceTimer);
    }
  }, [searchTerm, selectedType, chantierId]);

  const handleDeleteDocument = async (documentId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) return;

    try {
      const response = await fetch('/api/documents', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentIds: [documentId] })
      });

      if (response.ok) {
        setDocuments(prev => prev.filter(doc => doc.id !== documentId));
        success('Supprimé', 'Document supprimé avec succès');
      } else {
        const errorData = await response.json();
        error('Erreur', errorData.error || 'Erreur lors de la suppression');
      }
    } catch (err) {
      console.error('Erreur suppression:', err);
      error('Erreur', 'Erreur lors de la suppression du document');
    }
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'PDF':
        return '📄';
      case 'DOC':
        return '📝';
      case 'XLSX':
        return '📊';
      case 'PHOTO':
        return '🖼️';
      default:
        return '📎';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
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

  const filteredDocuments = documents.filter(doc =>
    doc.nomOriginal.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (doc.tags && doc.tags.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const documentsByType = filteredDocuments.reduce((acc, doc) => {
    const type = doc.type || 'AUTRE';
    if (!acc[type]) acc[type] = [];
    acc[type].push(doc);
    return acc;
  }, {} as Record<string, Document[]>);

  if (loading && documents.length === 0) {
    return (
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/4"></div>
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex gap-4 p-4 border rounded-lg">
              <div className="w-12 h-12 bg-gray-200 rounded"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/3"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-full">
            <FileText size={20} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Documents du chantier</h3>
            <p className="text-sm text-gray-500">
              {documents.length} document{documents.length > 1 ? 's' : ''}
            </p>
          </div>
        </div>
        
        <Link
          href={`/dashboard/documents/upload?chantierId=${chantierId}`}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Upload size={16} />
          Ajouter documents
        </Link>
      </div>

      {/* Filtres et recherche */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Rechercher des documents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Tous les types</option>
          <option value="PDF">PDF</option>
          <option value="DOC">Documents</option>
          <option value="XLSX">Tableaux</option>
          <option value="PHOTO">Photos</option>
          <option value="AUTRE">Autres</option>
        </select>
      </div>

      {filteredDocuments.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-100">
          <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center text-gray-400 mb-4">
            <FileText size={24} />
          </div>
          <p className="text-gray-900 font-medium mb-2">
            {searchTerm || selectedType ? 'Aucun document trouvé' : 'Aucun document'}
          </p>
          <p className="text-sm text-gray-500 mb-4 max-w-xs mx-auto">
            {searchTerm || selectedType 
              ? 'Essayez avec d\'autres critères de recherche' 
              : 'Ajoutez des documents pour organiser les fichiers du chantier'
            }
          </p>
          {!searchTerm && !selectedType && (
            <Link
              href={`/dashboard/documents/upload?chantierId=${chantierId}`}
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Upload size={16} />
              Premier document
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(documentsByType).map(([type, docs]) => (
            <div key={type}>
              <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                <span className="text-lg">{getFileIcon(type)}</span>
                {type} ({docs.length})
              </h4>
              <div className="space-y-2">
                {docs.map((document) => (
                  <div key={document.id} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-xl">
                      {getFileIcon(document.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h5 className="font-medium text-gray-900 truncate">{document.nomOriginal}</h5>
                          <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <User size={12} />
                              {document.uploader.name}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar size={12} />
                              {formatDate(document.createdAt)}
                            </span>
                            <span>{formatFileSize(document.taille)}</span>
                          </div>
                          {document.dossier && (
                            <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mt-1">
                              {document.dossier}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-1 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => window.open(document.url, '_blank')}
                            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Voir"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => {
                              const link = window.document.createElement('a');
                              link.href = document.url;
                              link.download = document.nomOriginal;
                              link.click();
                            }}
                            className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Télécharger"
                          >
                            <Download size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteDocument(document.id)}
                            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}