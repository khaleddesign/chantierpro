'use client';

import { useState, useEffect, useCallback } from 'react';

interface Document {
 id: string;
 nom: string;
 nomOriginal: string;
 type: string;
 taille: number;
 url: string;
 urlThumbnail?: string;
 uploader: {
   id: string;
   name: string;
   role: string;
 };
 chantier?: {
   id: string;
   nom: string;
 };
 metadonnees?: any;
 tags: string[];
 dossier?: string;
 public: boolean;
 createdAt: string;
}

interface UseDocumentsOptions {
 chantierId?: string;
 type?: string;
 search?: string;
 dossier?: string | null;
 autoRefresh?: boolean;
}

export function useDocuments(options: UseDocumentsOptions = {}) {
 const [documents, setDocuments] = useState<Document[]>([]);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState<string | null>(null);
 const [stats, setStats] = useState({
   totalDocuments: 0,
   totalPhotos: 0,
   totalSize: 0
 });const fetchDocuments = useCallback(async () => {
   try {
     setLoading(true);
     setError(null);

     const params = new URLSearchParams();
     
     if (options.chantierId) {
       params.append('chantierId', options.chantierId);
     }
     if (options.type) {
       params.append('type', options.type);
     }
     if (options.search) {
       params.append('search', options.search);
     }

     const response = await fetch(`/api/documents?${params}`);
     
     if (!response.ok) {
       throw new Error('Erreur lors du chargement des documents');
     }

     const data = await response.json();
     let docs = data.documents || [];

     if (options.dossier) {
       docs = docs.filter((doc: Document) => doc.dossier === options.dossier);
     }

     setDocuments(docs);
     
     setStats({
       totalDocuments: docs.length,
       totalPhotos: docs.filter((doc: Document) => doc.type === 'PHOTO').length,
       totalSize: docs.reduce((sum: number, doc: Document) => sum + doc.taille, 0)
     });

   } catch (err) {
     console.error('Erreur fetchDocuments:', err);
     setError(err instanceof Error ? err.message : 'Erreur inconnue');
   } finally {
     setLoading(false);
   }
 }, [options.chantierId, options.type, options.search, options.dossier]);

 const uploadDocument = useCallback(async (data: any) => {
   try {
     const response = await fetch('/api/documents', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify(data)
     });

     const result = await response.json();
     
     if (response.ok) {
       await fetchDocuments();
       return result;
     } else {
       throw new Error(result.error || 'Erreur lors de l\'upload');
     }
   } catch (err) {
     throw err;
   }
 }, [fetchDocuments]);

 const updateDocument = useCallback(async (id: string, data: any) => {
   try {
     const response = await fetch(`/api/documents/${id}`, {
       method: 'PUT',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify(data)
     });

     const result = await response.json();
     
     if (response.ok) {
       await fetchDocuments();
       return result;
     } else {
       throw new Error(result.error || 'Erreur lors de la modification');
     }
   } catch (err) {
     throw err;
   }
 }, [fetchDocuments]);

 const deleteDocument = useCallback(async (id: string) => {
   try {
     const response = await fetch(`/api/documents/${id}`, {
       method: 'DELETE'
     });

     if (response.ok) {
       await fetchDocuments();
       return true;
     } else {
       const result = await response.json();
       throw new Error(result.error || 'Erreur lors de la suppression');
     }
   } catch (err) {
     throw err;
   }
 }, [fetchDocuments]);

 const shareDocument = useCallback(async (id: string, isPublic: boolean) => {
   try {
     const response = await fetch(`/api/documents/share/${id}`, {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ public: isPublic })
     });

     const result = await response.json();
     
     if (response.ok) {
       await fetchDocuments();
       return result;
     } else {
       throw new Error(result.error || 'Erreur lors du partage');
     }
   } catch (err) {
     throw err;
   }
 }, [fetchDocuments]);

 useEffect(() => {
   fetchDocuments();
 }, [fetchDocuments]);

 useEffect(() => {
   if (options.autoRefresh) {
     const interval = setInterval(() => {
       fetchDocuments();
     }, 30000);

     return () => clearInterval(interval);
   }
 }, [options.autoRefresh, fetchDocuments]);

 return {
   documents,
   loading,
   error,
   stats,
   actions: {
     fetchDocuments,
     uploadDocument,
     updateDocument,
     deleteDocument,
     shareDocument,
     refresh: fetchDocuments
   }
 };
}

export function useDocumentStats() {
 const [stats, setStats] = useState({
   totalDocuments: 0,
   totalPhotos: 0,
   totalPlans: 0,
   totalSize: 0,
   byChantier: {},
   byType: {}
 });
 const [loading, setLoading] = useState(true);

 const fetchStats = async () => {
   try {
     setLoading(true);
     const response = await fetch('/api/documents/stats');
     
     if (response.ok) {
       const data = await response.json();
       setStats(data);
     }
   } catch (error) {
     console.error('Erreur stats documents:', error);
   } finally {
     setLoading(false);
   }
 };

 useEffect(() => {
   fetchStats();
 }, []);

 return { stats, loading, refresh: fetchStats };
}
