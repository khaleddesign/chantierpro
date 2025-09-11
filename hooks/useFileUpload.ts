'use client';

import { useState, useCallback } from 'react';

interface UploadOptions {
  chantierId?: string;
  type?: string;
  description?: string;
  onProgress?: (progress: number) => void;
  onSuccess?: (document: any) => void;
  onError?: (error: string) => void;
}

export function useFileUpload() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const uploadFile = useCallback(async (file: File, options: UploadOptions = {}) => {
    try {
      setUploading(true);
      setProgress(0);
      setError(null);

      // Validation côté client
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error(`Type de fichier non supporté: ${file.type}`);
      }

      if (file.size > 10 * 1024 * 1024) {
        throw new Error(`Fichier trop volumineux: ${Math.round(file.size / 1024 / 1024)}MB (max 10MB)`);
      }

      const formData = new FormData();
      formData.append('file', file);
      
      if (options.chantierId) {
        formData.append('chantierId', options.chantierId);
      }
      if (options.description) {
        formData.append('description', options.description);
      }

      // Utiliser fetch avec monitoring de progression
      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `Erreur HTTP: ${response.status}`);
      }

      setProgress(100);
      options.onSuccess?.(result.document);
      return result.document;

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erreur inconnue lors de l\'upload';
      console.error('Erreur upload:', err);
      setError(errorMsg);
      options.onError?.(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setUploading(false);
    }
  }, []);

  const uploadMultipleFiles = useCallback(async (files: File[], options: UploadOptions = {}) => {
    const results = [];
    let successCount = 0;
    
    for (let i = 0; i < files.length; i++) {
      try {
        setProgress(Math.round((i / files.length) * 100));
        
        const result = await uploadFile(files[i], {
          ...options,
          onProgress: (fileProgress) => {
            const totalProgress = ((i * 100) + fileProgress) / files.length;
            setProgress(Math.round(totalProgress));
            options.onProgress?.(Math.round(totalProgress));
          }
        });
        
        results.push(result);
        successCount++;
      } catch (error) {
        console.error(`Erreur upload fichier ${files[i].name}:`, error);
        results.push({ error: error instanceof Error ? error.message : 'Erreur inconnue', fileName: files[i].name });
      }
    }
    
    setProgress(100);
    
    if (successCount === 0) {
      throw new Error('Aucun fichier n\'a pu être uploadé');
    } else if (successCount < files.length) {
      const failedCount = files.length - successCount;
      throw new Error(`${failedCount} fichier(s) ont échoué sur ${files.length}`);
    }
    
    return results;
  }, [uploadFile]);

  const reset = useCallback(() => {
    setUploading(false);
    setProgress(0);
    setError(null);
  }, []);

  return {
    uploadFile,
    uploadMultipleFiles,
    uploading,
    progress,
    error,
    reset
  };
}

export function useDocumentDownload() {
  const [downloading, setDownloading] = useState(false);

  const downloadDocument = useCallback(async (documentId: string, fileName: string) => {
    try {
      setDownloading(true);
      
      const response = await fetch(`/api/documents/${documentId}/download`);
      
      if (!response.ok) {
        throw new Error('Erreur lors du téléchargement');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Erreur téléchargement:', error);
      throw error;
    } finally {
      setDownloading(false);
    }
  }, []);

  return {
    downloadDocument,
    downloading
  };
}
