'use client';

import { useState } from 'react';
import { ZoomIn, ZoomOut, RotateCw, Download, Maximize } from 'lucide-react';

interface MediaViewerProps {
 document: {
   id: string;
   nom: string;
   type: string;
   url: string;
   urlThumbnail?: string;
 };
}

export default function MediaViewer({ document }: MediaViewerProps) {
 const [zoom, setZoom] = useState(100);
 const [rotation, setRotation] = useState(0);
 const [fullscreen, setFullscreen] = useState(false);

 const handleZoomIn = () => {
   setZoom(prev => Math.min(prev + 25, 300));
 };

 const handleZoomOut = () => {
   setZoom(prev => Math.max(prev - 25, 25));
 };

 const handleRotate = () => {
   setRotation(prev => (prev + 90) % 360);
 };

 const handleFullscreen = () => {
   setFullscreen(true);
 };

 if (document.type === 'PHOTO') {
   return (
     <div className="relative">
       <div className="flex items-center justify-between mb-4">
         <h2 className="text-xl font-semibold text-white">Aperçu</h2>
         
         <div className="flex items-center gap-2">
           <button
             onClick={handleZoomOut}
             className="p-2 text-white hover:bg-white/10 rounded transition-colors"
             disabled={zoom <= 25}
           >
             <ZoomOut className="w-4 h-4" />
           </button>
           
           <span className="text-white text-sm min-w-16 text-center">
             {zoom}%
           </span>
           
           <button
             onClick={handleZoomIn}
             className="p-2 text-white hover:bg-white/10 rounded transition-colors"
             disabled={zoom >= 300}
           >
             <ZoomIn className="w-4 h-4" />
           </button>
           
           <button
             onClick={handleRotate}
             className="p-2 text-white hover:bg-white/10 rounded transition-colors"
           >
             <RotateCw className="w-4 h-4" />
           </button>
           
           <button
             onClick={handleFullscreen}
             className="p-2 text-white hover:bg-white/10 rounded transition-colors"
           >
             <Maximize className="w-4 h-4" />
           </button>
         </div>
       </div>

       <div className="bg-black/20 rounded-lg p-4 min-h-96 flex items-center justify-center overflow-auto">
         <img
           src={document.url}
           alt={document.nom}
           className="max-w-full max-h-full object-contain transition-all duration-300"
           style={{
             transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
             transformOrigin: 'center'
           }}
         />
       </div>

       {fullscreen && (
         <div 
           className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center"
           onClick={() => setFullscreen(false)}
         >
           <img
             src={document.url}
             alt={document.nom}
             className="max-w-full max-h-full object-contain"
             style={{
               transform: `rotate(${rotation}deg)`
             }}
           />
           <button
             className="absolute top-4 right-4 text-white hover:bg-white/10 p-2 rounded"
             onClick={() => setFullscreen(false)}
           >
             ✕
           </button>
         </div>
       )}
     </div>
   );
 }

 if (document.type === 'PDF') {
   return (
     <div className="relative">
       <div className="flex items-center justify-between mb-4">
         <h2 className="text-xl font-semibold text-white">Aperçu PDF</h2>
         
         <button
           onClick={() => window.open(document.url, '_blank')}
           className="btn btn-primary flex items-center gap-2"
         >
           <Download className="w-4 h-4" />
           Ouvrir le PDF
         </button>
       </div>

       <div className="bg-white rounded-lg min-h-96 flex items-center justify-center">
         <iframe
           src={`${document.url}#toolbar=1&navpanes=1&scrollbar=1`}
           className="w-full h-96 rounded-lg"
           title={document.nom}
         />
       </div>
     </div>
   );
 }

 return (
   <div className="relative">
     <div className="flex items-center justify-between mb-4">
       <h2 className="text-xl font-semibold text-white">Document</h2>
       
       <button
         onClick={() => window.open(document.url, '_blank')}
         className="btn btn-primary flex items-center gap-2"
       >
         <Download className="w-4 h-4" />
         Ouvrir le fichier
       </button>
     </div>

     <div className="bg-white/10 rounded-lg p-8 min-h-96 flex items-center justify-center">
       <div className="text-center">
         <div className="w-16 h-16 bg-blue-500 rounded-lg flex items-center justify-center mx-auto mb-4">
           <span className="text-white text-2xl">📄</span>
         </div>
         <h3 className="text-white font-medium mb-2">{document.nom}</h3>
         <p className="text-blue-200 text-sm mb-4">
           Aperçu non disponible pour ce type de fichier
         </p>
         <button
           onClick={() => window.open(document.url, '_blank')}
           className="btn btn-primary"
         >
           Ouvrir le fichier
         </button>
       </div>
     </div>
   </div>
 );
}
