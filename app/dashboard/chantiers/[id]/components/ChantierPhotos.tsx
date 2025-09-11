'use client';

import { useState, useRef, useEffect } from 'react';
import { Upload, Image as ImageIcon, X, Download, ZoomIn, Calendar, User } from 'lucide-react';
import { useToasts } from '@/hooks/useToasts';

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

interface ChantierPhotosProps {
  chantierId: string;
  photos: string[];
}

export default function ChantierPhotos({ chantierId, photos: initialPhotos }: ChantierPhotosProps) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { success, error } = useToasts();

  // Convertir les photos initiales (URLs simples) en format Photo
  const convertInitialPhotos = () => {
    return initialPhotos.map((url, index) => ({
      id: `initial-${index}`,
      url,
      nomOriginal: `photo-${index + 1}.jpg`,
      taille: 0,
      createdAt: new Date().toISOString(),
      uploader: { name: 'Client' }
    }));
  };

  useEffect(() => {
    setPhotos(convertInitialPhotos());
  }, [initialPhotos]);

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const uploadedPhotos: Photo[] = [];

    try {
      for (const file of Array.from(files)) {
        // Validation du type de fichier
        if (!file.type.startsWith('image/')) {
          error('Erreur', `${file.name} n'est pas un fichier image valide`);
          continue;
        }

        // Validation de la taille (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          error('Erreur', `${file.name} est trop volumineux (max 10MB)`);
          continue;
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('chantierId', chantierId);
        formData.append('dossier', 'Photos');
        formData.append('type', 'PHOTO');

        const response = await fetch('/api/documents', {
          method: 'POST',
          body: formData
        });

        if (response.ok) {
          const uploadedDoc = await response.json();
          uploadedPhotos.push({
            id: uploadedDoc.id,
            url: uploadedDoc.url,
            nomOriginal: uploadedDoc.nomOriginal,
            taille: uploadedDoc.taille,
            createdAt: uploadedDoc.createdAt,
            uploader: uploadedDoc.uploader
          });
        } else {
          const errorData = await response.json();
          error('Erreur', `Échec de l'upload de ${file.name}: ${errorData.error}`);
        }
      }

      if (uploadedPhotos.length > 0) {
        setPhotos(prev => [...uploadedPhotos, ...prev]);
        success('Succès', `${uploadedPhotos.length} photo(s) uploadée(s) avec succès`);
      }

    } catch (err) {
      console.error('Erreur upload:', err);
      error('Erreur', 'Erreur lors de l\'upload des photos');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    if (photoId.startsWith('initial-')) {
      // Pour les photos initiales, on les retire juste de la vue
      setPhotos(prev => prev.filter(p => p.id !== photoId));
      success('Supprimé', 'Photo supprimée de la galerie');
      return;
    }

    try {
      const response = await fetch('/api/documents', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentIds: [photoId] })
      });

      if (response.ok) {
        setPhotos(prev => prev.filter(p => p.id !== photoId));
        success('Supprimé', 'Photo supprimée avec succès');
      } else {
        const errorData = await response.json();
        error('Erreur', errorData.error || 'Erreur lors de la suppression');
      }
    } catch (err) {
      console.error('Erreur suppression:', err);
      error('Erreur', 'Erreur lors de la suppression de la photo');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return 'Taille inconnue';
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

  if (loading) {
    return (
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="aspect-square bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-full">
            <ImageIcon size={20} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Photos du chantier</h3>
            <p className="text-sm text-gray-500">
              {photos.length} photo{photos.length > 1 ? 's' : ''}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={handleFileSelect}
            disabled={uploading}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Upload size={16} />
            {uploading ? 'Upload...' : 'Ajouter photos'}
          </button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileChange}
        className="hidden"
      />

      {photos.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-100">
          <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center text-gray-400 mb-4">
            <ImageIcon size={24} />
          </div>
          <p className="text-gray-900 font-medium mb-2">Aucune photo</p>
          <p className="text-sm text-gray-500 mb-4 max-w-xs mx-auto">
            Ajoutez des photos pour documenter l'avancement du chantier
          </p>
          <button
            onClick={handleFileSelect}
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Upload size={16} />
            Première photo
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {photos.map((photo) => (
            <div key={photo.id} className="group relative">
              <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                <img
                  src={photo.url}
                  alt={photo.nomOriginal}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                />
                
                {/* Overlay avec actions */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-200">
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setSelectedPhoto(photo)}
                      className="p-1.5 bg-white/90 text-gray-700 rounded-md hover:bg-white transition-colors"
                    >
                      <ZoomIn size={14} />
                    </button>
                    <button
                      onClick={() => window.open(photo.url, '_blank')}
                      className="p-1.5 bg-white/90 text-gray-700 rounded-md hover:bg-white transition-colors"
                    >
                      <Download size={14} />
                    </button>
                    <button
                      onClick={() => handleDeletePhoto(photo.id)}
                      className="p-1.5 bg-red-500/90 text-white rounded-md hover:bg-red-600 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Infos photo */}
              <div className="mt-2 text-xs text-gray-500">
                <p className="truncate font-medium text-gray-900">{photo.nomOriginal}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="flex items-center gap-1">
                    <User size={10} />
                    {photo.uploader.name}
                  </span>
                  <span>{formatFileSize(photo.taille)}</span>
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <Calendar size={10} />
                  {formatDate(photo.createdAt)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal pour zoom photo */}
      {selectedPhoto && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setSelectedPhoto(null)}>
          <div className="relative max-w-4xl max-h-full">
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute -top-10 right-0 text-white/80 hover:text-white"
            >
              <X size={24} />
            </button>
            <img
              src={selectedPhoto.url}
              alt={selectedPhoto.nomOriginal}
              className="max-w-full max-h-full object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white p-4 rounded-b-lg">
              <p className="font-medium">{selectedPhoto.nomOriginal}</p>
              <p className="text-sm text-white/80">
                Uploadé par {selectedPhoto.uploader.name} • {formatDate(selectedPhoto.createdAt)} • {formatFileSize(selectedPhoto.taille)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}