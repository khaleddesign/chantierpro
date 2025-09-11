'use client';

import { useState } from 'react';
import { File, Download, Eye, Trash2, Calendar, User, Building } from 'lucide-react';
import DocumentCard from './DocumentCard';
import { useDocumentDownload } from '@/hooks/useFileUpload';

interface Document {
  id: string;
  nom: string;
  nomOriginal: string;
  type: string;
  taille: number;
  url: string;
  createdAt: string;
  chantier?: {
    id: string;
    nom: string;
  };
  uploader: {
    id: string;
    name: string;
  };
}

interface DocumentListProps {
  documents: Document[];
  onDocumentClick?: (document: Document) => void;
  onDocumentDelete?: (documentId: string) => void;
  loading?: boolean;
  viewMode?: 'grid' | 'list';
}

export default function DocumentList({ 
  documents, 
  onDocumentClick, 
  onDocumentDelete,
  loading = false,
  viewMode = 'grid'
}: DocumentListProps) {
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
  const { downloadDocument, downloading } = useDocumentDownload();

  const handleSelectDoc = (docId: string) => {
    setSelectedDocs(prev => 
      prev.includes(docId) 
        ? prev.filter(id => id !== docId)
        : [...prev, docId]
    );
  };

  const handleSelectAll = () => {
    if (selectedDocs.length === documents.length) {
      setSelectedDocs([]);
    } else {
      setSelectedDocs(documents.map(doc => doc.id));
    }
  };

  const handleDownload = async (document: Document) => {
    try {
      await downloadDocument(document.id, document.nomOriginal);
    } catch (error) {
      alert('Erreur lors du téléchargement');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          <span className="text-gray-500">Chargement des documents...</span>
        </div>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="text-center py-12">
        <File className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun document</h3>
        <p className="text-gray-500">Commencez par uploader vos premiers documents</p>
      </div>
    );
  }

  if (viewMode === 'grid') {
    return (
      <div>
        {/* Actions en lot */}
        {selectedDocs.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <span className="text-sm text-blue-700">
                {selectedDocs.length} document(s) sélectionné(s)
              </span>
              <div className="flex space-x-2">
                <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
                  Télécharger tout
                </button>
                <button className="px-3 py-1 text-sm border border-red-300 text-red-700 rounded hover:bg-red-50">
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Grille de documents */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {documents.map((document) => (
            <DocumentCard
              key={document.id}
              document={document}
              selected={selectedDocs.includes(document.id)}
              onSelect={() => handleSelectDoc(document.id)}
              onClick={() => onDocumentClick?.(document)}
              onDownload={() => handleDownload(document)}
              onDelete={() => onDocumentDelete?.(document.id)}
            />
          ))}
        </div>
      </div>
    );
  }

  // Vue liste
  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Header avec sélection */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-4">
          <input
            type="checkbox"
            checked={selectedDocs.length === documents.length}
            onChange={handleSelectAll}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded"
          />
          <span className="text-sm text-gray-600">
            {selectedDocs.length > 0 ? `${selectedDocs.length} sélectionné(s)` : 'Tout sélectionner'}
          </span>
        </div>
      </div>

      {/* Liste des documents */}
      <div className="divide-y divide-gray-200">
        {documents.map((document) => (
          <div
            key={document.id}
            className={`p-4 hover:bg-gray-50 ${selectedDocs.includes(document.id) ? 'bg-blue-50' : ''}`}
          >
            <div className="flex items-center space-x-4">
              <input
                type="checkbox"
                checked={selectedDocs.includes(document.id)}
                onChange={() => handleSelectDoc(document.id)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded"
              />

              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-3">
                  <File className="w-8 h-8 text-gray-400" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {document.nomOriginal}
                    </p>
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span className="flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        {formatDate(document.createdAt)}
                      </span>
                      <span className="flex items-center">
                        <User className="w-3 h-3 mr-1" />
                        {document.uploader.name}
                      </span>
                      {document.chantier && (
                        <span className="flex items-center">
                          <Building className="w-3 h-3 mr-1" />
                          {document.chantier.nom}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-500">
                  {formatFileSize(document.taille)}
                </span>
                <button
                  onClick={() => onDocumentClick?.(document)}
                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                  title="Prévisualiser"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDownload(document)}
                  disabled={downloading}
                  className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded"
                  title="Télécharger"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDocumentDelete?.(document.id)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                  title="Supprimer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
