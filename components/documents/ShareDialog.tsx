'use client';

import { useState } from 'react';
import { Share2, Link as LinkIcon, Copy, X, Check } from 'lucide-react';

interface ShareDialogProps {
 document: {
   id: string;
   nom: string;
   public: boolean;
 };
 onClose: () => void;
 onShare: (shareUrl: string) => void;
}

export default function ShareDialog({ document, onClose, onShare }: ShareDialogProps) {
 const [isPublic, setIsPublic] = useState(document.public);
 const [shareUrl, setShareUrl] = useState('');
 const [copied, setCopied] = useState(false);
 const [loading, setLoading] = useState(false);

 const handleShare = async () => {
   try {
     setLoading(true);
     const response = await fetch(`/api/documents/share/${document.id}`, {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ public: isPublic })
     });

     const result = await response.json();
     
     if (response.ok && result.shareUrl) {
       setShareUrl(result.shareUrl);
       onShare(result.shareUrl);
     }
   } catch (error) {
     console.error('Erreur partage:', error);
   } finally {
     setLoading(false);
   }
 };

 const handleCopy = async () => {
   try {
     await navigator.clipboard.writeText(shareUrl);
     setCopied(true);
     setTimeout(() => setCopied(false), 2000);
   } catch (error) {
     console.error('Erreur copie:', error);
   }
 };

 return (
   <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
     <div className="glass p-6 rounded-lg max-w-md w-full">
       <div className="flex items-center justify-between mb-4">
         <h2 className="text-xl font-semibold text-white flex items-center gap-2">
           <Share2 className="w-6 h-6" />
           Partager le document
         </h2>
         <button
           onClick={onClose}
           className="p-2 text-white hover:bg-white/10 rounded transition-colors"
         >
           <X className="w-5 h-5" />
         </button>
       </div>

       <div className="space-y-4">
         <div>
           <h3 className="text-white font-medium mb-2">{document.nom}</h3>
           <p className="text-blue-200 text-sm">
             Créez un lien de partage pour permettre l'accès à ce document
           </p>
         </div>

         <div className="flex items-center gap-3">
           <input
             type="checkbox"
             id="public"
             checked={isPublic}
             onChange={(e) => setIsPublic(e.target.checked)}
             className="w-4 h-4 text-blue-500"
           />
           <label htmlFor="public" className="text-white">
             Rendre ce document public
           </label>
         </div>

         {shareUrl ? (
           <div>
             <label className="block text-blue-100 text-sm mb-2">
               Lien de partage
             </label>
             <div className="flex gap-2">
               <input
                 type="text"
                 value={shareUrl}
                 readOnly
                 className="flex-1 p-3 rounded-lg bg-white/10 text-white border border-white/20"
               />
               <button
                 onClick={handleCopy}
                 className="btn bg-blue-500 hover:bg-blue-600 text-white flex items-center gap-2"
               >
                 {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                 {copied ? 'Copié' : 'Copier'}
               </button>
             </div>
           </div>
         ) : (
           <div className="flex items-center justify-end gap-3 pt-4">
             <button
               onClick={onClose}
               className="px-4 py-2 text-blue-200 hover:text-white transition-colors"
             >
               Annuler
             </button>
             <button
               onClick={handleShare}
               disabled={loading}
               className="btn btn-primary flex items-center gap-2"
             >
               {loading ? (
                 <>
                   <div className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full"></div>
                   Création...
                 </>
               ) : (
                 <>
                   <LinkIcon className="w-4 h-4" />
                   Créer le lien
                 </>
               )}
             </button>
           </div>
         )}
       </div>
     </div>
   </div>
 );
}
