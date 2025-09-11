'use client';

import { useState } from 'react';
import { Folder, FolderOpen, FileText, ChevronRight, ChevronDown } from 'lucide-react';

interface FolderTreeProps {
 documents: Array<{
   id: string;
   nom: string;
   type: string;
   dossier?: string;
 }>;
 selectedDossier: string | null;
 onDossierSelect: (dossier: string | null) => void;
}

export default function FolderTree({ documents, selectedDossier, onDossierSelect }: FolderTreeProps) {
 const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['root']));

 const toggleFolder = (folderName: string) => {
   const newExpanded = new Set(expandedFolders);
   if (newExpanded.has(folderName)) {
     newExpanded.delete(folderName);
   } else {
     newExpanded.add(folderName);
   }
   setExpandedFolders(newExpanded);
 };

 const getFolderStructure = () => {
   const structure: Record<string, Array<{ id: string; nom: string; type: string }>> = {
     'Documents': [],
     'Photos avant travaux': [],
     'Photos pendant travaux': [],
     'Photos finition': [],
     'Plans techniques': [],
     'Factures': [],
     'Contrats': []
   };

   documents.forEach(doc => {
     const folder = doc.dossier || 'Documents';
     if (!structure[folder]) {
       structure[folder] = [];
     }
     structure[folder].push(doc);
   });

   return structure;
 };

 const folderStructure = getFolderStructure();

 const getTypeIcon = (type: string) => {
   switch (type) {
     case 'PHOTO':
       return '📷';
     case 'PDF':
       return '📄';
     case 'PLAN':
       return '📐';
     case 'FACTURE':
       return '🧾';
     case 'CONTRAT':
       return '📋';
     default:
       return '📄';
   }
 };

 return (
   <div className="card">
     <h3 style={{ 
       fontSize: '16px', 
       fontWeight: '600', 
       color: '#1e293b', 
       marginBottom: '1rem',
       display: 'flex',
       alignItems: 'center',
       gap: '8px'
     }}>
       <Folder style={{ width: '20px', height: '20px' }} />
       Organisation
     </h3>

     <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
       <button
         onClick={() => onDossierSelect(null)}
         style={{
           width: '100%',
           textAlign: 'left',
           padding: '12px',
           borderRadius: '8px',
           border: 'none',
           cursor: 'pointer',
           display: 'flex',
           alignItems: 'center',
           gap: '8px',
           fontSize: '14px',
           fontWeight: '500',
           backgroundColor: selectedDossier === null ? '#eff6ff' : 'transparent',
           color: selectedDossier === null ? '#1e40af' : '#64748b',
           transition: 'all 0.2s ease'
         }}
         onMouseEnter={(e) => {
           if (selectedDossier !== null) {
             e.currentTarget.style.backgroundColor = '#f8fafc';
           }
         }}
         onMouseLeave={(e) => {
           if (selectedDossier !== null) {
             e.currentTarget.style.backgroundColor = 'transparent';
           }
         }}
       >
         <FolderOpen style={{ width: '16px', height: '16px' }} />
         <span style={{ flex: 1 }}>Tous les documents</span>
         <span style={{
           fontSize: '12px',
           backgroundColor: '#f1f5f9',
           color: '#64748b',
           padding: '2px 6px',
           borderRadius: '4px'
         }}>
           {documents.length}
         </span>
       </button>

       {Object.entries(folderStructure).map(([folderName, folderDocs]) => (
         <div key={folderName}>
           <button
             onClick={() => {
               toggleFolder(folderName);
               onDossierSelect(folderName);
             }}
             style={{
               width: '100%',
               textAlign: 'left',
               padding: '12px',
               borderRadius: '8px',
               border: 'none',
               cursor: 'pointer',
               display: 'flex',
               alignItems: 'center',
               gap: '8px',
               fontSize: '14px',
               fontWeight: '500',
               backgroundColor: selectedDossier === folderName ? '#eff6ff' : 'transparent',
               color: selectedDossier === folderName ? '#1e40af' : '#64748b',
               transition: 'all 0.2s ease'
             }}
             onMouseEnter={(e) => {
               if (selectedDossier !== folderName) {
                 e.currentTarget.style.backgroundColor = '#f8fafc';
               }
             }}
             onMouseLeave={(e) => {
               if (selectedDossier !== folderName) {
                 e.currentTarget.style.backgroundColor = 'transparent';
               }
             }}
           >
             {expandedFolders.has(folderName) ? (
               <ChevronDown style={{ width: '16px', height: '16px' }} />
             ) : (
               <ChevronRight style={{ width: '16px', height: '16px' }} />
             )}
             {expandedFolders.has(folderName) ? (
               <FolderOpen style={{ width: '16px', height: '16px' }} />
             ) : (
               <Folder style={{ width: '16px', height: '16px' }} />
             )}
             <span style={{ flex: 1 }}>{folderName}</span>
             {folderDocs.length > 0 && (
               <span style={{
                 fontSize: '12px',
                 backgroundColor: '#f1f5f9',
                 color: '#64748b',
                 padding: '2px 6px',
                 borderRadius: '4px'
               }}>
                 {folderDocs.length}
               </span>
             )}
           </button>

           {expandedFolders.has(folderName) && folderDocs.length > 0 && (
             <div style={{ marginLeft: '24px', marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
               {folderDocs.slice(0, 5).map((doc) => (
                 <div
                   key={doc.id}
                   style={{
                     display: 'flex',
                     alignItems: 'center',
                     gap: '8px',
                     padding: '8px',
                     fontSize: '13px',
                     color: '#64748b',
                     cursor: 'pointer',
                     borderRadius: '6px',
                     transition: 'background-color 0.2s ease'
                   }}
                   onClick={() => window.location.href = `/dashboard/documents/${doc.id}`}
                   onMouseEnter={(e) => {
                     e.currentTarget.style.backgroundColor = '#f8fafc';
                   }}
                   onMouseLeave={(e) => {
                     e.currentTarget.style.backgroundColor = 'transparent';
                   }}
                 >
                   <span style={{ fontSize: '12px' }}>{getTypeIcon(doc.type)}</span>
                   <span style={{ 
                     flex: 1, 
                     overflow: 'hidden', 
                     textOverflow: 'ellipsis', 
                     whiteSpace: 'nowrap' 
                   }} title={doc.nom}>
                     {doc.nom}
                   </span>
                 </div>
               ))}
               {folderDocs.length > 5 && (
                 <div style={{ 
                   fontSize: '12px', 
                   color: '#94a3b8', 
                   paddingLeft: '24px',
                   paddingTop: '4px'
                 }}>
                   +{folderDocs.length - 5} autres fichiers
                 </div>
               )}
             </div>
           )}
         </div>
       ))}
     </div>
   </div>
 );
}
