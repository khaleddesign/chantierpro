'use client';

import React, { useState, useEffect } from 'react';
import { Upload, X, Download, Eye } from 'lucide-react';

interface NormalizedPhoto {
  id: string;
  url: string;
  nomOriginal: string;
  taille: number;
  createdAt: string;
  uploader: {
    name: string;
  };
}

interface ChantierPhotosProps {
  chantierId: string;
  photos: string[] | Photo[];
}

interface Photo {
  id: string;
  url: string;
  nomOriginal: string;
  taille: number;
  createdAt: string;
  uploader: {
    name: string;
  };
}

// Fonction utilitaire pour normaliser les photos
const normalizePhotos = (photos: string[] | Photo[]): NormalizedPhoto[] => {
  return photos.map((photo, index) => {
    if (typeof photo === 'string') {
      // Photo simple (URL)
      return {
        id: `url-${index}`,
        url: photo,
        nomOriginal: `photo-${index + 1}.jpg`,
        taille: 0,
        createdAt: new Date().toISOString(),
        uploader: { name: 'Client' }
      };
    } else {
      // Photo complète (objet)
      return {
        id: photo.id,
        url: photo.url,
        nomOriginal: photo.nomOriginal,
        taille: photo.taille,
        createdAt: photo.createdAt,
        uploader: photo.uploader
      };
    }
  });
};

export default function ChantierPhotos({ chantierId, photos: initialPhotos }: ChantierPhotosProps) {
  const [photos, setPhotos] = useState<NormalizedPhoto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPhotos(normalizePhotos(initialPhotos || []));
  }, [initialPhotos]);

  const handleUpload = async (files: FileList) => {
    if (!files.length) return;

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      Array.from(files).forEach(file => {
        formData.append('files', file);
      });
      formData.append('chantierId', chantierId);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de l\'upload');
      }

      const result = await response.json();
      
      // Ajouter les nouvelles photos à la liste
      const newPhotos = result.files.map((file: any) => ({
        id: file.id,
        url: file.url,
        nomOriginal: file.nomOriginal,
        taille: file.taille,
        createdAt: file.createdAt,
        uploader: { name: 'Vous' }
      }));

      setPhotos(prev => [...prev, ...newPhotos]);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'upload');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (photoId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette photo ?')) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/upload/${photoId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression');
      }

      setPhotos(prev => prev.filter(photo => photo.id !== photoId));

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la suppression');
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
        <div className="text-center">
          <Upload className="mx-auto h-12 w-12 text-gray-400" />
          <div className="mt-4">
            <label htmlFor="photo-upload" className="cursor-pointer">
              <span className="mt-2 block text-sm font-medium text-gray-900">
                Glissez-déposez vos photos ici ou{' '}
                <span className="text-blue-600 hover:text-blue-500">cliquez pour sélectionner</span>
              </span>
            </label>
            <input
              id="photo-upload"
              name="photo-upload"
              type="file"
              className="sr-only"
              multiple
              accept="image/*"
              onChange={(e) => e.target.files && handleUpload(e.target.files)}
              disabled={loading}
            />
          </div>
          <p className="mt-1 text-xs text-gray-500">
            PNG, JPG, GIF jusqu'à 10MB
          </p>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Erreur</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      )}

      {/* Photos Grid */}
      {photos.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {photos.map((photo) => (
            <div key={photo.id} className="relative group bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="aspect-w-16 aspect-h-12">
                <img
                  src={photo.url}
                  alt={photo.nomOriginal}
                  className="w-full h-48 object-cover"
                />
              </div>
              
              {/* Overlay Actions */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200">
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <button
                    onClick={() => handleDelete(photo.id)}
                    className="bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                    disabled={loading}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                
                <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => window.open(photo.url, '_blank')}
                      className="flex-1 bg-white text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-50"
                    >
                      <Eye className="h-4 w-4 inline mr-1" />
                      Voir
                    </button>
                    <button
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = photo.url;
                        link.download = photo.nomOriginal;
                        link.click();
                      }}
                      className="flex-1 bg-white text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-50"
                    >
                      <Download className="h-4 w-4 inline mr-1" />
                      Télécharger
                    </button>
                  </div>
                </div>
              </div>

              {/* Photo Info */}
              <div className="p-3">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {photo.nomOriginal}
                </p>
                <div className="mt-1 flex items-center justify-between text-xs text-gray-500">
                  <span>{formatFileSize(photo.taille)}</span>
                  <span>{photo.uploader.name}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-gray-400 text-5xl mb-4">📷</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucune photo</h3>
          <p className="text-gray-500">Ajoutez des photos pour documenter ce chantier</p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-4">
          <div className="inline-flex items-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Traitement en cours...</span>
          </div>
        </div>
      )}
    </div>
  );
}