"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X, Image, Loader2 } from "lucide-react";
import { useToastContext } from "@/components/providers/ToastProvider";

interface ImageUploadProps {
  value?: string;
  onChange: (url: string | null) => void;
  disabled?: boolean;
  className?: string;
}

export function ImageUpload({ value, onChange, disabled, className = "" }: ImageUploadProps) {
  const { success, error: showError } = useToastContext();
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadImage = async (file: File) => {
    if (disabled) return;

    setLoading(true);
    try {
      // Validation côté client
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Type de fichier non autorisé. Utilisez JPG, PNG ou WebP.');
      }

      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        throw new Error('Fichier trop volumineux. Taille maximale : 5MB.');
      }

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de l\'upload');
      }

      const data = await response.json();
      onChange(data.url);
      success('Succès', 'Image uploadée avec succès');

    } catch (error: any) {
      showError('Erreur', error.message || 'Erreur lors de l\'upload');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadImage(file);
    }
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);
    
    const file = event.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      uploadImage(file);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);
  };

  const removeImage = async () => {
    if (value && !disabled) {
      try {
        // Extraire le nom du fichier de l'URL
        const filename = value.split('/').pop();
        if (filename) {
          await fetch(`/api/upload?filename=${filename}`, {
            method: 'DELETE',
          });
        }
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
      } finally {
        onChange(null);
        success('Succès', 'Image supprimée');
      }
    }
  };

  const openFileDialog = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className={`relative ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled}
      />

      {value ? (
        <div className="relative group">
          <div className="relative w-full h-48 rounded-lg overflow-hidden border-2 border-gray-200">
            <img
              src={value}
              alt="Image du chantier"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all" />
          </div>
          
          {!disabled && (
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={removeImage}
                className="h-8 w-8 p-0"
              >
                <X size={16} />
              </Button>
            </div>
          )}

          {!disabled && (
            <Button
              type="button"
              variant="outline"
              onClick={openFileDialog}
              className="absolute bottom-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity"
              disabled={loading}
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin mr-2" />
              ) : (
                <Upload size={16} className="mr-2" />
              )}
              Changer
            </Button>
          )}
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={openFileDialog}
          className={`
            w-full h-48 rounded-lg border-2 border-dashed cursor-pointer
            flex flex-col items-center justify-center
            transition-colors duration-200
            ${dragOver 
              ? 'border-indigo-500 bg-indigo-50' 
              : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
            }
            ${disabled ? 'cursor-not-allowed opacity-50' : ''}
          `}
        >
          {loading ? (
            <>
              <Loader2 size={48} className="text-gray-400 animate-spin mb-4" />
              <p className="text-sm text-gray-500">Upload en cours...</p>
            </>
          ) : (
            <>
              <Image size={48} className="text-gray-400 mb-4" />
              <p className="text-sm text-gray-600 text-center px-4">
                <span className="font-medium">Cliquez pour sélectionner</span> ou 
                glissez-déposez une image
              </p>
              <p className="text-xs text-gray-400 mt-2">
                JPG, PNG ou WebP (max. 5MB)
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}