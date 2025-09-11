'use client';

import { useState, useRef } from 'react';
import { Upload, X, File, Image, FileText } from 'lucide-react';

interface DocumentUploadProps {
  onUploadComplete?: (documents: any[]) => void;
  onClose?: () => void;
}

export default function DocumentUpload({ onUploadComplete, onClose }: DocumentUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      console.log('📁 Fichier sélectionné:', {
        nom: selectedFile.name,
        taille: selectedFile.size,
        type: selectedFile.type
      });
      setFile(selectedFile);
      setError(null);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    console.log('🚀 Début upload:', file.name);
    setUploading(true);
    setError(null);

    try {
      // Créer FormData
      const formData = new FormData();
      formData.append('file', file);
      
      console.log('📦 FormData créé');
      console.log('🔍 FormData debug:');
      for (const [key, value] of formData.entries()) {
        console.log(`  ${key}:`, value instanceof File ? `File(${value.name})` : value);
      }

      // Appel API
      console.log('📤 Envoi vers API...');
      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData
      });

      console.log('📥 Réponse reçue:', response.status, response.statusText);
      
      const data = await response.json();
      console.log('📋 Data:', data);

      if (response.ok) {
        setResult(data);
        onUploadComplete?.([data.document]);
        console.log('✅ Upload réussi !');
      } else {
        setError(data.error || 'Erreur inconnue');
        console.log('❌ Upload échoué:', data.error);
      }

    } catch (err) {
      console.error('❌ Erreur réseau:', err);
      setError(err instanceof Error ? err.message : 'Erreur réseau');
    } finally {
      setUploading(false);
    }
  };

  const getFileIcon = () => {
    if (!file) return <File className="w-12 h-12 text-gray-400" />;
    
    if (file.type.startsWith('image/')) {
      return <Image className="w-12 h-12 text-blue-500" />;
    } else if (file.type === 'application/pdf') {
      return <FileText className="w-12 h-12 text-red-500" />;
    }
    return <File className="w-12 h-12 text-gray-500" />;
  };

  return (
    <div className="bg-white rounded-lg shadow-lg border p-6 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Test Upload Document</h3>
        {onClose && (
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Sélection fichier */}
      <div className="mb-6">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf,.txt"
          onChange={handleFileSelect}
          className="hidden"
        />
        
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors"
        >
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Cliquez pour sélectionner un fichier</p>
          <p className="text-sm text-gray-500 mt-2">PDF, Images, Texte (max 10MB)</p>
        </button>
      </div>

      {/* Fichier sélectionné */}
      {file && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-3">
            {getFileIcon()}
            <div>
              <p className="font-medium">{file.name}</p>
              <p className="text-sm text-gray-500">
                {Math.round(file.size / 1024)} KB - {file.type}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Résultat */}
      {result && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800 font-medium">✅ Upload réussi !</p>
          <p className="text-sm text-green-600 mt-1">
            Fichier: {result.document?.nomOriginal}
          </p>
          {result.warning && (
            <p className="text-orange-600 text-sm mt-1">⚠️ {result.warning}</p>
          )}
        </div>
      )}

      {/* Erreur */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 font-medium">❌ Erreur</p>
          <p className="text-sm text-red-600 mt-1">{error}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex space-x-3">
        <button
          onClick={() => {
            setFile(null);
            setResult(null);
            setError(null);
          }}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Effacer
        </button>
        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {uploading ? 'Upload...' : 'Uploader'}
        </button>
      </div>
    </div>
  );
}
