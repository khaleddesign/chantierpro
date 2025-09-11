'use client';

import { useState, useEffect } from 'react';
import { 
 ArrowLeft, 
 Download, 
 Share2, 
 Edit, 
 Trash2, 
 Eye, 
 MapPin, 
 Calendar,
 User,
 FileText,
 Image as ImageIcon,
 ZoomIn,
 ZoomOut,
 RotateCw
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import MediaViewer from '@/components/documents/MediaViewer';
import ShareDialog from '@/components/documents/ShareDialog';
import { useToasts } from '@/hooks/useToasts';

interface DocumentDetailPageProps {
 params: Promise<{ id: string }>;
}

// Remplacer async function par function normale
export default function DocumentDetailPage({ params }: DocumentDetailPageProps) {
 const [id, setId] = useState<string>('');
 
 useEffect(() => {
   params.then(p => setId(p.id));
 }, [params]);
 const router = useRouter();
 const { success, error: showError } = useToasts();
 
 const [document, setDocument] = useState<any>(null);
 const [loading, setLoading] = useState(true);
 const [showShareDialog, setShowShareDialog] = useState(false);
 const [deleting, setDeleting] = useState(false);

 useEffect(() => {
   if (id) {
     fetchDocument();
   }
 }, [id]);

 const fetchDocument = async () => {
   try {
     setLoading(true);
     const response = await fetch(`/api/documents/${id}`);
     
     if (response.ok) {
       const data = await response.json();
       setDocument(data);
     } else {
       showError('Erreur', 'Document introuvable');
       router.push('/dashboard/documents');
     }
   } catch (error) {
     console.error('Erreur chargement document:', error);
     showError('Erreur', 'Erreur lors du chargement');
   } finally {
     setLoading(false);
   }
 };

 const handleDownload = () => {
   if (!document) return;
   
   const link = window.document.createElement('a');
   link.href = document.url;
   link.download = document.nomOriginal;
   window.document.body.appendChild(link);
   link.click();
   window.document.body.removeChild(link);
   
   success('Succès', 'Téléchargement démarré');
 };

 const handleDelete = async () => {
   if (!confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) {
     return;
   }

   try {
     setDeleting(true);
     const response = await fetch(`/api/documents/${id}`, {
       method: 'DELETE'
     });

     if (response.ok) {
       success('Succès', 'Document supprimé avec succès');
       router.push('/dashboard/documents');
     } else {
       throw new Error('Erreur lors de la suppression');
     }
   } catch (error) {
     showError('Erreur', 'Erreur lors de la suppression');
   } finally {
     setDeleting(false);
   }
 };

 const formatFileSize = (bytes: number) => {
   if (bytes === 0) return '0 B';
   const k = 1024;
   const sizes = ['B', 'KB', 'MB', 'GB'];
   const i = Math.floor(Math.log(bytes) / Math.log(k));
   return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
 };

 const formatDate = (dateStr: string) => {
   return new Date(dateStr).toLocaleDateString('fr-FR', {
     weekday: 'long',
     year: 'numeric',
     month: 'long',
     day: 'numeric',
     hour: '2-digit',
     minute: '2-digit'
   });
 };

 const getTypeIcon = (type: string) => {
   switch (type) {
     case 'PHOTO':
       return <ImageIcon className="w-6 h-6" />;
     default:
       return <FileText className="w-6 h-6" />;
   }
 };

 const getTypeColor = (type: string) => {
   switch (type) {
     case 'PHOTO': return 'bg-green-500';
     case 'PDF': return 'bg-red-500';
     case 'PLAN': return 'bg-blue-500';
     case 'FACTURE': return 'bg-orange-500';
     case 'CONTRAT': return 'bg-purple-500';
     default: return 'bg-gray-500';
   }
 };

 if (loading) {
   return (
     <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e40af 50%, #ea580c 100%)' }}>
       <div className="flex items-center gap-3 text-white">
         <div className="animate-spin w-8 h-8 border-2 border-white/30 border-t-white rounded-full"></div>
         Chargement du document...
       </div>
     </div>
   );
 }

 if (!document) {
   return (
     <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e40af 50%, #ea580c 100%)' }}>
       <div className="text-center text-white">
         <h2 className="text-2xl font-bold mb-4">Document introuvable</h2>
         <Link href="/dashboard/documents" className="btn btn-primary">
           Retour aux documents
         </Link>
       </div>
     </div>
   );
 }

 return (
   <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e40af 50%, #ea580c 100%)' }}>
     <div className="container mx-auto px-4 py-8">
       <div className="flex items-center justify-between mb-8">
         <div className="flex items-center gap-4">
           <Link
             href="/dashboard/documents"
             className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
           >
             <ArrowLeft className="w-6 h-6" />
           </Link>
           
           <div>
             <h1 className="text-4xl font-bold text-white mb-2">{document.nomOriginal}</h1>
             <div className="flex items-center gap-4 text-blue-100">
               <span className={`px-3 py-1 rounded-full text-white text-sm ${getTypeColor(document.type)}`}>
                 {document.type}
               </span>
               <span>{formatFileSize(document.taille)}</span>
             </div>
           </div>
         </div>

         <div className="flex items-center gap-3">
           <button
             onClick={() => window.open(document.url, '_blank')}
             className="btn bg-blue-500 hover:bg-blue-600 text-white flex items-center gap-2"
           >
             <Eye className="w-4 h-4" />
             Aperçu
           </button>
           
           <button
             onClick={handleDownload}
             className="btn bg-green-500 hover:bg-green-600 text-white flex items-center gap-2"
           >
             <Download className="w-4 h-4" />
             Télécharger
           </button>
           
           <button
             onClick={() => setShowShareDialog(true)}
             className="btn bg-orange-500 hover:bg-orange-600 text-white flex items-center gap-2"
           >
             <Share2 className="w-4 h-4" />
             Partager
           </button>
           
           <button
             onClick={handleDelete}
             disabled={deleting}
             className="btn bg-red-500 hover:bg-red-600 text-white flex items-center gap-2"
           >
             <Trash2 className="w-4 h-4" />
             {deleting ? 'Suppression...' : 'Supprimer'}
           </button>
         </div>
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <div className="lg:col-span-2">
           <div className="glass p-6 mb-6">
             <MediaViewer document={document} />
           </div>
         </div>

         <div className="space-y-6">
           <div className="glass p-6">
             <h3 className="text-white font-semibold mb-4">Informations</h3>
             
             <div className="space-y-4">
               <div>
                 <label className="block text-blue-100 text-sm mb-1">Nom original</label>
                 <div className="text-white">{document.nomOriginal}</div>
               </div>

               <div>
                 <label className="block text-blue-100 text-sm mb-1">Type</label>
                 <div className="flex items-center gap-2">
                   {getTypeIcon(document.type)}
                   <span className="text-white">{document.type}</span>
                 </div>
               </div>

               <div>
                 <label className="block text-blue-100 text-sm mb-1">Taille</label>
                 <div className="text-white">{formatFileSize(document.taille)}</div>
               </div>

               <div>
                 <label className="block text-blue-100 text-sm mb-1 flex items-center gap-2">
                   <Calendar className="w-4 h-4" />
                   Ajouté le
                 </label>
                 <div className="text-white">{formatDate(document.createdAt)}</div>
               </div>

               <div>
                 <label className="block text-blue-100 text-sm mb-1 flex items-center gap-2">
                   <User className="w-4 h-4" />
                   Uploadé par
                 </label>
                 <div className="text-white">
                   {document.uploader && document.uploader.name}
                   {document.uploader && <span className="text-blue-200 text-sm ml-2">({document.uploader.role})</span>}
                 </div>
               </div>

               {document.chantier && (
                 <div>
                   <label className="block text-blue-100 text-sm mb-1 flex items-center gap-2">
                     <MapPin className="w-4 h-4" />
                     Chantier
                   </label>
                   <Link
                     href={`/dashboard/chantiers/${document.chantier.id}`}
                     className="text-blue-300 hover:text-white transition-colors"
                   >
                     {document.chantier.nom}
                   </Link>
                 </div>
               )}
             </div>
           </div>

           {document.metadonnees && Object.keys(document.metadonnees).length > 0 && (
             <div className="glass p-6">
               <h3 className="text-white font-semibold mb-4">Métadonnées</h3>
               
               <div className="space-y-3 text-sm">
                 {document.metadonnees.dimensions && (
                   <div>
                     <span className="text-blue-100">Dimensions:</span>
                     <span className="text-white ml-2">{document.metadonnees.dimensions}</span>
                   </div>
                 )}
                 
                 {document.metadonnees.appareil && (
                   <div>
                     <span className="text-blue-100">Appareil:</span>
                     <span className="text-white ml-2">{document.metadonnees.appareil}</span>
                   </div>
                 )}
                 
                 {document.metadonnees.datePhoto && (
                   <div>
                     <span className="text-blue-100">Date photo:</span>
                     <span className="text-white ml-2">
                       {new Date(document.metadonnees.datePhoto).toLocaleDateString('fr-FR')}
                     </span>
                   </div>
                 )}
                 
                 {document.metadonnees.geolocalisation && (
                   <div>
                     <span className="text-blue-100">Localisation:</span>
                     <div className="text-white ml-2">
                       {document.metadonnees.geolocalisation.lat.toFixed(4)}, {document.metadonnees.geolocalisation.lng.toFixed(4)}
                     </div>
                   </div>
                 )}
               </div>
             </div>
           )}

           {document.tags && document.tags.length > 0 && (
             <div className="glass p-6">
               <h3 className="text-white font-semibold mb-4">Tags</h3>
               <div className="flex flex-wrap gap-2">
                 {document.tags.map((tag: string, index: number) => (
                   <span
                     key={index}
                     className="px-3 py-1 bg-white/10 text-blue-200 rounded-full text-sm"
                   >
                     {tag}
                   </span>
                 ))}
               </div>
             </div>
           )}
         </div>
       </div>
     </div>

     {showShareDialog && (
       <ShareDialog
         document={document}
         onClose={() => setShowShareDialog(false)}
         onShare={(shareUrl) => {
           success('Succès', 'Lien de partage créé');
           navigator.clipboard.writeText(shareUrl);
         }}
       />
     )}
   </div>
 );
}
