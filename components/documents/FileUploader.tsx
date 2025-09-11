'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, X, File, Image as ImageIcon, FileText, Folder, Camera, Video, Music } from 'lucide-react';

interface FileUploaderProps {
  onUpload: (files: FileList, metadata: any) => void;
  uploading?: boolean;
  chantiers?: Array<{ id: string; nom: string }>;
}

export default function FileUploader({ onUpload, uploading = false, chantiers = [] }: FileUploaderProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [filePreviews, setFilePreviews] = useState<Record<string, string>>({});
  const [metadata, setMetadata] = useState({
    chantierId: '',
    dossier: 'Documents'
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    addFiles(files);
  }, []);

  const createImagePreview = useCallback((file: File): Promise<string> => {
    return new Promise((resolve) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          resolve(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        resolve('');
      }
    });
  }, []);

  const addFiles = async (newFiles: File[]) => {
    const validFiles = newFiles.filter(file => {
      if (file.size > 50 * 1024 * 1024) {
        alert(`${file.name} est trop volumineux (max 50MB)`);
        return false;
      }
      return true;
    });

    const filesToAdd = [...selectedFiles, ...validFiles].slice(0, 10);
    setSelectedFiles(filesToAdd);

    // Créer les aperçus pour les nouvelles images
    const newPreviews: Record<string, string> = { ...filePreviews };
    for (const file of validFiles) {
      if (file.type.startsWith('image/')) {
        newPreviews[file.name] = await createImagePreview(file);
      }
    }
    setFilePreviews(newPreviews);
  };

  const removeFile = (index: number) => {
    const fileToRemove = selectedFiles[index];
    if (fileToRemove && filePreviews[fileToRemove.name]) {
      const newPreviews = { ...filePreviews };
      delete newPreviews[fileToRemove.name];
      setFilePreviews(newPreviews);
    }
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (selectedFiles.length === 0) return;
    
    // Créer un FileList fake à partir de notre array
    const dt = new DataTransfer();
    selectedFiles.forEach(file => dt.items.add(file));
    
    onUpload(dt.files, metadata);
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <Camera className="w-6 h-6 text-green-500" />;
    } else if (file.type === 'application/pdf') {
      return <FileText className="w-6 h-6 text-red-500" />;
    } else if (file.type.startsWith('video/')) {
      return <Video className="w-6 h-6 text-purple-500" />;
    } else if (file.type.startsWith('audio/')) {
      return <Music className="w-6 h-6 text-orange-500" />;
    } else {
      return <File className="w-6 h-6 text-gray-500" />;
    }
  };

  const getFileTypeLabel = (file: File) => {
    if (file.type.startsWith('image/')) return 'Image';
    if (file.type === 'application/pdf') return 'PDF';
    if (file.type.startsWith('video/')) return 'Vidéo';
    if (file.type.startsWith('audio/')) return 'Audio';
    return 'Document';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Zone de drop */}
      <div
        className={`
          border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200
          ${dragActive 
            ? 'border-blue-400 bg-blue-50 scale-105 shadow-lg' 
            : 'border-gray-300 hover:border-blue-300 hover:bg-gray-50'
          }
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className={`
          w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center transition-colors
          ${dragActive ? 'bg-blue-100' : 'bg-gray-100'}
        `}>
          <Upload className={`w-8 h-8 ${dragActive ? 'text-blue-500' : 'text-gray-400'}`} />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {dragActive ? 'Déposez vos fichiers ici' : 'Glissez vos fichiers ici ou cliquez pour sélectionner'}
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          Formats supportés: Images, PDF, Documents • Maximum 10 fichiers • 50MB chacun
        </p>
        <div className="flex justify-center space-x-6 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <Camera className="w-4 h-4" /> JPG, PNG
          </span>
          <span className="flex items-center gap-1">
            <FileText className="w-4 h-4" /> PDF, DOC
          </span>
          <span className="flex items-center gap-1">
            <Video className="w-4 h-4" /> MP4, AVI
          </span>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,.pdf,.doc,.docx,.txt"
        onChange={(e) => e.target.files && addFiles(Array.from(e.target.files))}
        className="hidden"
      />

      {/* Métadonnées */}
      <div className="bg-gray-50 rounded-xl p-6">
        <h4 className="text-sm font-semibold text-gray-900 mb-4">Options de classement</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Chantier (optionnel)
            </label>
            <select
              value={metadata.chantierId}
              onChange={(e) => setMetadata(prev => ({ ...prev, chantierId: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Sélectionner un chantier</option>
              {chantiers.map(chantier => (
                <option key={chantier.id} value={chantier.id}>
                  {chantier.nom}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dossier
            </label>
            <select
              value={metadata.dossier}
              onChange={(e) => setMetadata(prev => ({ ...prev, dossier: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="Documents">📄 Documents</option>
              <option value="Photos">📸 Photos</option>
              <option value="Plans">📐 Plans</option>
              <option value="Factures">🧾 Factures</option>
              <option value="Rapports">📊 Rapports</option>
              <option value="Autres">📁 Autres</option>
            </select>
          </div>
        </div>
      </div>

      {/* Liste des fichiers sélectionnés avec miniatures */}
      {selectedFiles.length > 0 && (
        <div>
          <h4 className="text-gray-900 font-semibold mb-4 flex items-center justify-between">
            Fichiers sélectionnés
            <span className="text-sm text-gray-500 font-normal">
              {selectedFiles.length}/10 fichiers
            </span>
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-80 overflow-y-auto">
            {selectedFiles.map((file, index) => (
              <div key={index} className="relative group bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                {/* Image ou icône */}
                <div className="relative h-32 bg-gray-100 flex items-center justify-center">
                  {filePreviews[file.name] ? (
                    <img 
                      src={filePreviews[file.name]} 
                      alt={file.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center">
                      {getFileIcon(file)}
                      <span className="text-xs text-gray-400 mt-1">
                        {getFileTypeLabel(file)}
                      </span>
                    </div>
                  )}
                  
                  {/* Bouton supprimer */}
                  <button
                    onClick={() => removeFile(index)}
                    disabled={uploading}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 disabled:opacity-50"
                    title="Supprimer le fichier"
                  >
                    <X className="w-3 h-3" />
                  </button>

                  {/* Badge type de fichier */}
                  <div className="absolute top-2 left-2 px-2 py-1 bg-black/60 text-white text-xs rounded-full">
                    {getFileTypeLabel(file)}
                  </div>
                </div>

                {/* Informations du fichier */}
                <div className="p-3">
                  <p className="text-sm font-medium text-gray-900 truncate" title={file.name}>
                    {file.name}
                  </p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-gray-500">
                      {formatFileSize(file.size)}
                    </span>
                    <span className="text-xs text-gray-400">
                      {file.type.split('/')[1]?.toUpperCase() || 'FILE'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bouton d'upload */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-500">
          {selectedFiles.length > 0 && (
            <>
              {selectedFiles.length} fichier{selectedFiles.length > 1 ? 's' : ''} sélectionné{selectedFiles.length > 1 ? 's' : ''}
              <span className="ml-2">
                ({formatFileSize(selectedFiles.reduce((total, file) => total + file.size, 0))})
              </span>
            </>
          )}
        </div>
        <button
          onClick={handleSubmit}
          disabled={selectedFiles.length === 0 || uploading}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors shadow-sm"
        >
          {uploading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              Upload en cours...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              Uploader {selectedFiles.length > 0 ? selectedFiles.length : ''} fichier{selectedFiles.length > 1 ? 's' : ''}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
