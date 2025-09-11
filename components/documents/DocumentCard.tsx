'use client';

import { useState } from 'react';
import { File, FileText, Image, Download, Eye, Trash2, Calendar, User, Building2, FileImage, FileVideo, FileAudio, Archive } from 'lucide-react';

interface DocumentCardProps {
  document: {
    id: string;
    nom: string;
    nomOriginal: string;
    type: string;
    taille: number;
    url: string;
    createdAt: string;
    uploaderName?: string;
    chantierName?: string;
    dossier?: string;
    tags?: string[];
    public?: boolean;
  };
  selected?: boolean;
  onSelect?: () => void;
  onClick?: () => void;
  onPreview?: (document: any) => void;
  onDownload?: (document: any) => void;
  onDelete?: (document: any) => void;
  showActions?: boolean;
}

export default function DocumentCard({
  document,
  onPreview,
  onDownload,
  onDelete,
  showActions = true
}: DocumentCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const getFileIcon = (type: string) => {
    const fileType = type.toLowerCase();
    
    if (fileType.includes('image') || fileType.includes('jpg') || fileType.includes('png') || fileType.includes('gif')) {
      return <FileImage className="w-6 h-6 text-blue-600" />;
    }
    if (fileType.includes('pdf')) {
      return <FileText className="w-6 h-6 text-red-600" />;
    }
    if (fileType.includes('video')) {
      return <FileVideo className="w-6 h-6 text-purple-600" />;
    }
    if (fileType.includes('audio')) {
      return <FileAudio className="w-6 h-6 text-green-600" />;
    }
    if (fileType.includes('zip') || fileType.includes('rar') || fileType.includes('7z')) {
      return <Archive className="w-6 h-6 text-orange-600" />;
    }
    return <File className="w-6 h-6 text-gray-600" />;
  };

  const getFileTypeColor = (type: string) => {
    const fileType = type.toLowerCase();
    
    if (fileType.includes('image')) return 'bg-blue-100 text-blue-700 border-blue-200';
    if (fileType.includes('pdf')) return 'bg-red-100 text-red-700 border-red-200';
    if (fileType.includes('video')) return 'bg-purple-100 text-purple-700 border-purple-200';
    if (fileType.includes('audio')) return 'bg-green-100 text-green-700 border-green-200';
    if (fileType.includes('zip') || fileType.includes('rar')) return 'bg-orange-100 text-orange-700 border-orange-200';
    return 'bg-gray-100 text-gray-700 border-gray-200';
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

  const handleDelete = async () => {
    if (!onDelete) return;
    
    if (confirm(`Êtes-vous sûr de vouloir supprimer le document "${document.nom}" ?`)) {
      setIsDeleting(true);
      try {
        await onDelete(document);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-lg transition-all duration-300 hover:scale-[1.02] group">
      {/* Header avec icône et titre */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="flex-shrink-0">
            {getFileIcon(document.type)}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 truncate text-sm" title={document.nom}>
              {document.nom}
            </h3>
            {document.nomOriginal && document.nomOriginal !== document.nom && (
              <p className="text-xs text-gray-500 truncate" title={document.nomOriginal}>
                Origine: {document.nomOriginal}
              </p>
            )}
          </div>
        </div>
        
        {document.public && (
          <div className="flex-shrink-0">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
              Public
            </span>
          </div>
        )}
      </div>

      {/* Type de fichier et taille */}
      <div className="flex items-center gap-2 mb-3">
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getFileTypeColor(document.type)}`}>
          {document.type.split('/')[1]?.toUpperCase() || document.type.toUpperCase()}
        </span>
        <span className="text-xs text-gray-500">
          {formatFileSize(document.taille)}
        </span>
      </div>

      {/* Informations contextuelles */}
      <div className="space-y-2 mb-4">
        {document.chantierName && (
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <Building2 className="w-3 h-3" />
            <span>{document.chantierName}</span>
          </div>
        )}
        
        {document.uploaderName && (
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <User className="w-3 h-3" />
            <span>{document.uploaderName}</span>
          </div>
        )}
        
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <Calendar className="w-3 h-3" />
          <span>{formatDate(document.createdAt)}</span>
        </div>
      </div>

      {/* Dossier */}
      {document.dossier && (
        <div className="mb-4">
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
            📁 {document.dossier}
          </span>
        </div>
      )}

      {/* Tags */}
      {document.tags && document.tags.length > 0 && (
        <div className="mb-4">
          <div className="flex flex-wrap gap-1">
            {document.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200"
              >
                #{tag}
              </span>
            ))}
            {document.tags.length > 3 && (
              <span className="text-xs text-gray-500">
                +{document.tags.length - 3} autre{document.tags.length - 3 > 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      {showActions && (
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center gap-2">
            {onPreview && (
              <button
                onClick={() => onPreview(document)}
                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors group-hover:opacity-100 opacity-0"
                title="Aperçu"
              >
                <Eye className="w-4 h-4" />
              </button>
            )}
            
            {onDownload && (
              <button
                onClick={() => onDownload(document)}
                className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors group-hover:opacity-100 opacity-0"
                title="Télécharger"
              >
                <Download className="w-4 h-4" />
              </button>
            )}
          </div>

          {onDelete && (
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors group-hover:opacity-100 opacity-0 disabled:opacity-50"
              title="Supprimer"
            >
              <Trash2 className={`w-4 h-4 ${isDeleting ? 'animate-pulse' : ''}`} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}