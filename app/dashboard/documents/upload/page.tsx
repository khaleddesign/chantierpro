'use client';

import { useState, useEffect } from 'react';
import { Upload, ArrowLeft, File, X, Check, AlertCircle, Camera, FileText, Video, Image } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import FileUploader from '@/components/documents/FileUploader';
import { useToasts } from '@/hooks/useToasts';

export default function UploadPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { success, error: showError } = useToasts();
  
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [uploadResults, setUploadResults] = useState<{
    success: any[];
    errors: any[];
  }>({ success: [], errors: [] });
  const [chantiers, setChantiers] = useState<Array<{ id: string; nom: string }>>([]);
  const [loading, setLoading] = useState(true);

  // Récupérer les chantiers depuis l'API
  useEffect(() => {
    const fetchChantiers = async () => {
      try {
        const response = await fetch('/api/chantiers');
        if (response.ok) {
          const data = await response.json();
          setChantiers(data.chantiers?.map((c: any) => ({ id: c.id, nom: c.nom })) || []);
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des chantiers:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchChantiers();
  }, []);

  const handleUpload = async (files: FileList, metadata: any) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    setUploadProgress({});
    setUploadResults({ success: [], errors: [] });

    const localResults = { success: [] as any[], errors: [] as any[] };

    try {
      // Upload files one by one since API expects single file
      for (const file of Array.from(files)) {
        try {
          // Initialize progress for this file
          setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));
          
          const formData = new FormData();
          formData.append('file', file); // Single file as expected by API
          formData.append('chantierId', metadata?.chantierId || '');
          formData.append('dossier', metadata?.dossier || 'Documents');
          formData.append('tags', ''); // Optional tags

          // Simulate progress
          const progressInterval = setInterval(() => {
            setUploadProgress(prev => {
              const newProgress = Math.min((prev[file.name] || 0) + 15, 90);
              if (newProgress >= 90) {
                clearInterval(progressInterval);
              }
              return { ...prev, [file.name]: newProgress };
            });
          }, 200);

          const response = await fetch('/api/documents', {
            method: 'POST',
            body: formData
          });

          clearInterval(progressInterval);
          setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));

          const result = await response.json();

          if (response.ok) {
            localResults.success.push(result);
          } else {
            localResults.errors.push({
              fileName: file.name,
              error: result.error || 'Erreur lors de l\'upload'
            });
          }

        } catch (fileError) {
          console.error(`Error uploading ${file.name}:`, fileError);
          localResults.errors.push({
            fileName: file.name,
            error: 'Erreur réseau lors de l\'upload'
          });
          setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));
        }
      }

      setUploadResults(localResults);

      if (localResults.success.length > 0) {
        success(
          'Upload terminé', 
          `${localResults.success.length}/${files.length} fichier(s) uploadé(s) avec succès`
        );
        
        if (localResults.errors.length === 0) {
          setTimeout(() => {
            router.push('/dashboard/documents');
          }, 2000);
        }
      }

      if (localResults.errors.length > 0) {
        showError('Erreurs d\'upload', `${localResults.errors.length} fichier(s) n'ont pas pu être uploadés`);
      }

    } catch (error) {
      console.error('Error during upload:', error);
      showError('Erreur', 'Erreur lors de l\'upload des fichiers');
    } finally {
      setUploading(false);
    }
  };

  const getDocumentIcon = (doc: any) => {
    const type = doc.type?.toLowerCase() || '';
    if (type === 'photo' || doc.nomOriginal?.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
      return <Camera className="w-5 h-5 text-green-500" />;
    } else if (type === 'pdf' || doc.nomOriginal?.endsWith('.pdf')) {
      return <FileText className="w-5 h-5 text-red-500" />;
    } else if (doc.nomOriginal?.match(/\.(mp4|avi|mov|mkv)$/i)) {
      return <Video className="w-5 h-5 text-purple-500" />;
    } else {
      return <File className="w-5 h-5 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <Upload className="w-6 h-6 text-blue-600" />
              </div>
              Upload de fichiers
            </h1>
            <p className="text-gray-600">
              Ajoutez vos photos, plans et documents au système. Organisez-les par chantier et dossier.
            </p>
          </div>
          <Link
            href="/dashboard/documents"
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
          >
            <ArrowLeft size={18} />
            Retour aux documents
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              {searchParams.get('chantierId') && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    📌 Les fichiers seront automatiquement associés au chantier sélectionné
                  </p>
                </div>
              )}
              <FileUploader
                onUpload={handleUpload}
                uploading={uploading}
                chantiers={chantiers}
              />

              {Object.keys(uploadProgress || {}).length > 0 && (
                <div className="mt-8">
                  <h3 className="text-gray-900 font-semibold mb-4">Progression de l'upload</h3>
                  <div className="space-y-3">
                    {Object.entries(uploadProgress || {}).map(([fileName, progress]) => (
                      <div key={fileName} className="bg-gray-100 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-gray-900 text-sm truncate flex-1">{fileName}</span>
                          <span className="text-blue-600 text-sm ml-4">{progress}%</span>
                        </div>
                        <div className="w-full bg-gray-300 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {uploadResults?.success?.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-green-700 font-semibold mb-4 flex items-center gap-2">
                    <Check className="w-5 h-5" />
                    Fichiers uploadés avec succès ({uploadResults?.success?.length || 0})
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {(uploadResults?.success || []).map((doc: any, index: number) => (
                      <div key={index} className="bg-green-50 border border-green-200 rounded-lg p-4 hover:bg-green-100 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0">
                            {doc.type === 'PHOTO' && doc.url ? (
                              <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100">
                                <img 
                                  src={doc.url} 
                                  alt={doc.nomOriginal}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                  }}
                                />
                                <div className="hidden w-full h-full flex items-center justify-center">
                                  {getDocumentIcon(doc)}
                                </div>
                              </div>
                            ) : (
                              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                {getDocumentIcon(doc)}
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-green-900 truncate" title={doc?.nomOriginal}>
                              {doc?.nomOriginal || 'Fichier'}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
                                {doc?.type || 'Document'}
                              </span>
                              {doc?.dossier && (
                                <span className="text-xs text-gray-500">
                                  📁 {doc.dossier}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {uploadResults?.errors?.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-red-700 font-semibold mb-4 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    Erreurs d'upload ({uploadResults?.errors?.length || 0})
                  </h3>
                  <div className="space-y-3">
                    {(uploadResults?.errors || []).map((error: any, index: number) => (
                      <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                              <AlertCircle className="w-4 h-4 text-red-600" />
                            </div>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-red-900">
                              {error?.fileName || 'Fichier inconnu'}
                            </p>
                            <p className="text-sm text-red-700 mt-1">
                              {error?.error || 'Erreur inconnue'}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h3 className="text-gray-900 font-semibold mb-4 flex items-center gap-2">
                <File className="w-5 h-5 text-gray-600" />
                Types de fichiers supportés
              </h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                  <Camera className="w-8 h-8 text-green-600 bg-green-100 rounded-lg p-1.5" />
                  <div>
                    <div className="text-sm font-semibold text-gray-900">Photos & Images</div>
                    <div className="text-xs text-gray-600">JPG, PNG, HEIC, WebP, GIF</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
                  <FileText className="w-8 h-8 text-red-600 bg-red-100 rounded-lg p-1.5" />
                  <div>
                    <div className="text-sm font-semibold text-gray-900">Documents</div>
                    <div className="text-xs text-gray-600">PDF, DOC, DOCX, XLSX</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                  <Video className="w-8 h-8 text-purple-600 bg-purple-100 rounded-lg p-1.5" />
                  <div>
                    <div className="text-sm font-semibold text-gray-900">Vidéos</div>
                    <div className="text-xs text-gray-600">MP4, AVI, MOV, MKV</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h3 className="text-gray-900 font-semibold mb-4">Conseils d'upload</h3>
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-blue-300 rounded-full mt-2 flex-shrink-0"></div>
                  <p>Les images de plus de 2MB seront automatiquement compressées</p>
                </div>
                
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-blue-300 rounded-full mt-2 flex-shrink-0"></div>
                  <p>Les métadonnées GPS seront extraites des photos</p>
                </div>
                
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-blue-300 rounded-full mt-2 flex-shrink-0"></div>
                  <p>Vous pouvez uploader jusqu'à 10 fichiers simultanément</p>
                </div>
                
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-blue-300 rounded-full mt-2 flex-shrink-0"></div>
                  <p>Taille maximale : 50MB par fichier</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h3 className="text-gray-900 font-semibold mb-4">Organisation automatique</h3>
              <div className="text-sm text-gray-600">
                <p className="mb-3">Vos fichiers seront automatiquement organisés par :</p>
                <ul className="space-y-2">
                  <li>• Type de fichier</li>
                  <li>• Chantier associé</li>
                  <li>• Date d'upload</li>
                  <li>• Métadonnées détectées</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}