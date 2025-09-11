'use client';

import { useState } from 'react';
import { 
 FileText, 
 Image, 
 Download, 
 Share2, 
 MoreHorizontal, 
 Eye,
 Trash2,
 Edit,
 MapPin,
 Calendar,
 User
} from 'lucide-react';

interface FileCardProps {
 document: {
   id: string;
   nom: string;
   nomOriginal: string;
   type: string;
   taille: number;
   url: string;
   urlThumbnail?: string;
   uploader: {
     name: string;
     role: string;
   };
   chantier?: {
     nom: string;
   };
   metadonnees?: any;
   tags: string[];
   createdAt: string;
 };
 viewMode: 'grid' | 'list';
 selected: boolean;
 onSelect: () => void;
 onClick: () => void;
}

export default function FileCard({ document, viewMode, selected, onSelect, onClick }: FileCardProps) {
 const [showMenu, setShowMenu] = useState(false);

 const getFileIcon = (type: string) => {
   switch (type) {
     case 'PHOTO':
       return <Image style={{ width: '24px', height: '24px' }} />;
     case 'PDF':
     case 'PLAN':
     case 'FACTURE':
     case 'CONTRAT':
       return <FileText style={{ width: '24px', height: '24px' }} />;
     default:
       return <FileText style={{ width: '24px', height: '24px' }} />;
   }
 };

 const getTypeColor = (type: string) => {
   switch (type) {
     case 'PHOTO': return { bg: '#dcfce7', text: '#166534', border: '#bbf7d0' };
     case 'PDF': return { bg: '#fee2e2', text: '#991b1b', border: '#fecaca' };
     case 'PLAN': return { bg: '#dbeafe', text: '#1e40af', border: '#bfdbfe' };
     case 'FACTURE': return { bg: '#fef3c7', text: '#92400e', border: '#fde68a' };
     case 'CONTRAT': return { bg: '#e9d5ff', text: '#6b21a8', border: '#d8b4fe' };
     default: return { bg: '#f1f5f9', text: '#475569', border: '#e2e8f0' };
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
     day: 'numeric',
     month: 'short',
     year: 'numeric'
   });
 };

 const typeColors = getTypeColor(document.type);

 if (viewMode === 'list') {
   return (
     <div 
       style={{
         display: 'flex',
         alignItems: 'center',
         gap: '1rem',
         padding: '12px 16px',
         borderRadius: '8px',
         backgroundColor: selected ? '#eff6ff' : 'white',
         border: `1px solid ${selected ? '#3b82f6' : '#e2e8f0'}`,
         cursor: 'pointer',
         transition: 'all 0.2s ease'
       }}
       onClick={onClick}
       onMouseEnter={(e) => {
         if (!selected) {
           e.currentTarget.style.backgroundColor = '#f8fafc';
         }
       }}
       onMouseLeave={(e) => {
         if (!selected) {
           e.currentTarget.style.backgroundColor = 'white';
         }
       }}
     >
       <input
         type="checkbox"
         checked={selected}
         onChange={onSelect}
         onClick={(e) => e.stopPropagation()}
         style={{
           width: '16px',
           height: '16px',
           accentColor: '#3b82f6'
         }}
       />
       
       {document.type === 'PHOTO' && document.urlThumbnail ? (
         <img
           src={document.urlThumbnail}
           alt={document.nom}
           style={{
             width: '40px',
             height: '40px',
             borderRadius: '6px',
             objectFit: 'cover'
           }}
         />
       ) : (
         <div style={{
           width: '40px',
           height: '40px',
           borderRadius: '6px',
           backgroundColor: typeColors.bg,
           border: `1px solid ${typeColors.border}`,
           display: 'flex',
           alignItems: 'center',
           justifyContent: 'center',
           color: typeColors.text
         }}>
           {getFileIcon(document.type)}
         </div>
       )}
       
       <div style={{ flex: 1, minWidth: 0 }}>
         <h3 style={{ 
           fontSize: '14px', 
           fontWeight: '500', 
           color: '#1e293b', 
           margin: 0, 
           overflow: 'hidden',
           textOverflow: 'ellipsis',
           whiteSpace: 'nowrap'
         }}>
           {document.nom}
         </h3>
         <div style={{ 
           display: 'flex', 
           alignItems: 'center', 
           gap: '16px', 
           fontSize: '12px', 
           color: '#64748b',
           marginTop: '2px'
         }}>
           <span>{formatFileSize(document.taille)}</span>
           <span>{formatDate(document.createdAt)}</span>
           <span>{document.uploader.name}</span>
         </div>
       </div>

       <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
         {document.chantier && (
           <span style={{
             fontSize: '11px',
             color: '#3b82f6',
             backgroundColor: '#eff6ff',
             padding: '4px 8px',
             borderRadius: '4px',
             border: '1px solid #bfdbfe'
           }}>
             {document.chantier.nom}
           </span>
         )}
         
         <button
           onClick={(e) => {
             e.stopPropagation();
             window.open(document.url, '_blank');
           }}
           style={{
             padding: '6px',
             color: '#64748b',
             backgroundColor: 'transparent',
             border: 'none',
             borderRadius: '4px',
             cursor: 'pointer',
             display: 'flex',
             alignItems: 'center'
           }}
           onMouseEnter={(e) => {
             e.currentTarget.style.backgroundColor = '#f1f5f9';
             e.currentTarget.style.color = '#1e293b';
           }}
           onMouseLeave={(e) => {
             e.currentTarget.style.backgroundColor = 'transparent';
             e.currentTarget.style.color = '#64748b';
           }}
         >
           <Eye style={{ width: '16px', height: '16px' }} />
         </button>
         
         <button
           onClick={(e) => {
             e.stopPropagation();
             const link = window.document.createElement('a');
             link.href = document.url;
             link.download = document.nomOriginal;
             link.click();
           }}
           style={{
             padding: '6px',
             color: '#64748b',
             backgroundColor: 'transparent',
             border: 'none',
             borderRadius: '4px',
             cursor: 'pointer',
             display: 'flex',
             alignItems: 'center'
           }}
           onMouseEnter={(e) => {
             e.currentTarget.style.backgroundColor = '#f1f5f9';
             e.currentTarget.style.color = '#1e293b';
           }}
           onMouseLeave={(e) => {
             e.currentTarget.style.backgroundColor = 'transparent';
             e.currentTarget.style.color = '#64748b';
           }}
         >
           <Download style={{ width: '16px', height: '16px' }} />
         </button>
       </div>
     </div>
   );
 }

 return (
   <div 
     style={{
       position: 'relative',
       cursor: 'pointer',
       transition: 'all 0.2s ease'
     }}
     onClick={onClick}
     onMouseEnter={(e) => {
       e.currentTarget.style.transform = 'translateY(-2px)';
       e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.1)';
     }}
     onMouseLeave={(e) => {
       e.currentTarget.style.transform = 'translateY(0)';
       e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
     }}
   >
     <div className="card" style={{ 
       padding: '16px', 
       height: '100%',
       border: selected ? '2px solid #3b82f6' : '1px solid #e2e8f0',
       backgroundColor: selected ? '#eff6ff' : 'white'
     }}>
       <div style={{ position: 'absolute', top: '12px', left: '12px' }}>
         <input
           type="checkbox"
           checked={selected}
           onChange={onSelect}
           onClick={(e) => e.stopPropagation()}
           style={{
             width: '16px',
             height: '16px',
             accentColor: '#3b82f6'
           }}
         />
       </div>

       <div style={{ 
         position: 'absolute', 
         top: '12px', 
         right: '12px', 
         opacity: 0,
         transition: 'opacity 0.2s ease'
       }}
       onMouseEnter={(e) => {
         e.currentTarget.style.opacity = '1';
       }}>
         <div style={{ position: 'relative' }}>
           <button
             onClick={(e) => {
               e.stopPropagation();
               setShowMenu(!showMenu);
             }}
             style={{
               padding: '4px',
               color: '#64748b',
               backgroundColor: 'white',
               border: '1px solid #e2e8f0',
               borderRadius: '4px',
               cursor: 'pointer',
               display: 'flex',
               alignItems: 'center'
             }}
           >
             <MoreHorizontal style={{ width: '16px', height: '16px' }} />
           </button>
           
           {showMenu && (
             <div style={{
               position: 'absolute',
               right: 0,
               top: '100%',
               marginTop: '4px',
               backgroundColor: 'white',
               borderRadius: '8px',
               boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
               border: '1px solid #e2e8f0',
               padding: '4px',
               zIndex: 10,
               minWidth: '120px'
             }}>
               <button style={{ width: '100%', padding: '8px 12px', textAlign: 'left', color: '#1e293b', backgroundColor: 'transparent', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                 <Eye style={{ width: '16px', height: '16px' }} />
                 Voir
               </button>
               <button style={{ width: '100%', padding: '8px 12px', textAlign: 'left', color: '#1e293b', backgroundColor: 'transparent', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                 <Download style={{ width: '16px', height: '16px' }} />
                 Télécharger
               </button>
               <button style={{ width: '100%', padding: '8px 12px', textAlign: 'left', color: '#1e293b', backgroundColor: 'transparent', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                 <Share2 style={{ width: '16px', height: '16px' }} />
                 Partager
               </button>
               <button style={{ width: '100%', padding: '8px 12px', textAlign: 'left', color: '#ef4444', backgroundColor: 'transparent', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                 <Trash2 style={{ width: '16px', height: '16px' }} />
                 Supprimer
               </button>
             </div>
           )}
         </div>
       </div>

       <div style={{ marginTop: '24px', marginBottom: '16px' }}>
         {document.type === 'PHOTO' && document.urlThumbnail ? (
           <img
             src={document.urlThumbnail}
             alt={document.nom}
             style={{
               width: '100%',
               height: '120px',
               objectFit: 'cover',
               borderRadius: '8px'
             }}
           />
         ) : (
           <div style={{
             width: '100%',
             height: '120px',
             borderRadius: '8px',
             backgroundColor: typeColors.bg,
             border: `1px solid ${typeColors.border}`,
             display: 'flex',
             alignItems: 'center',
             justifyContent: 'center',
             color: typeColors.text
           }}>
             {getFileIcon(document.type)}
           </div>
         )}
       </div>

       <div>
         <h3 style={{ 
           fontSize: '14px', 
           fontWeight: '500', 
           color: '#1e293b', 
           margin: 0, 
           marginBottom: '8px',
           overflow: 'hidden',
           textOverflow: 'ellipsis',
           whiteSpace: 'nowrap'
         }} title={document.nom}>
           {document.nom}
         </h3>
         
         <div style={{ 
           display: 'flex', 
           justifyContent: 'space-between', 
           alignItems: 'center', 
           fontSize: '12px', 
           color: '#64748b',
           marginBottom: '8px'
         }}>
           <span>{formatFileSize(document.taille)}</span>
           <span style={{
             padding: '4px 8px',
             borderRadius: '4px',
             backgroundColor: typeColors.bg,
             color: typeColors.text,
             border: `1px solid ${typeColors.border}`,
             fontSize: '11px',
             fontWeight: '500'
           }}>
             {document.type}
           </span>
         </div>

         <div style={{ fontSize: '11px', color: '#64748b', lineHeight: '1.4' }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
             <User style={{ width: '12px', height: '12px' }} />
             <span>{document.uploader.name}</span>
           </div>
           
           <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
             <Calendar style={{ width: '12px', height: '12px' }} />
             <span>{formatDate(document.createdAt)}</span>
           </div>

           {document.chantier && (
             <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
               <MapPin style={{ width: '12px', height: '12px' }} />
               <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                 {document.chantier.nom}
               </span>
             </div>
           )}
         </div>

         {document.tags.length > 0 && (
           <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '8px' }}>
             {document.tags.slice(0, 3).map((tag, index) => (
               <span
                 key={index}
                 style={{
                   fontSize: '10px',
                   backgroundColor: '#f1f5f9',
                   color: '#64748b',
                   padding: '2px 6px',
                   borderRadius: '4px',
                   border: '1px solid #e2e8f0'
                 }}
               >
                 {tag}
               </span>
             ))}
             {document.tags.length > 3 && (
               <span style={{ fontSize: '10px', color: '#64748b' }}>
                 +{document.tags.length - 3}
               </span>
             )}
           </div>
         )}
       </div>
     </div>
   </div>
 );
}
