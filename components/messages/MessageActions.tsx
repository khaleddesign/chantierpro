"use client";

import { useState, useRef, useEffect } from 'react';

interface MessageActionsProps {
 messageId: string;
 isOwn: boolean;
 canEdit: boolean;
 canDelete: boolean;
 onReply: (messageId: string) => void;
 onEdit: (messageId: string) => void;
 onDelete: (messageId: string) => void;
 onCopy: (messageId: string) => void;
 onPin: (messageId: string) => void;
 onReport?: (messageId: string) => void;
}

export default function MessageActions({
 messageId,
 isOwn,
 canEdit,
 canDelete,
 onReply,
 onEdit,
 onDelete,
 onCopy,
 onPin,
 onReport
}: MessageActionsProps) {
 const [isOpen, setIsOpen] = useState(false);
 const [position, setPosition] = useState({ x: 0, y: 0 });
 const menuRef = useRef<HTMLDivElement>(null);
 const triggerRef = useRef<HTMLButtonElement>(null);

 useEffect(() => {
   const handleClickOutside = (event: MouseEvent) => {
     if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
       setIsOpen(false);
     }
   };

   const handleKeyDown = (event: KeyboardEvent) => {
     if (event.key === 'Escape') {
       setIsOpen(false);
     }
   };

   if (isOpen) {
     document.addEventListener('mousedown', handleClickOutside);
     document.addEventListener('keydown', handleKeyDown);
   }

   return () => {
     document.removeEventListener('mousedown', handleClickOutside);
     document.removeEventListener('keydown', handleKeyDown);
   };
 }, [isOpen]);

 const handleContextMenu = (e: React.MouseEvent) => {
   e.preventDefault();
   const rect = e.currentTarget.getBoundingClientRect();
   setPosition({
     x: e.clientX,
     y: e.clientY
   });
   setIsOpen(true);
 };

 const handleClick = (e: React.MouseEvent) => {
   e.stopPropagation();
   const rect = e.currentTarget.getBoundingClientRect();
   setPosition({
     x: rect.right - 200,
     y: rect.bottom + 8
   });
   setIsOpen(!isOpen);
 };

 const handleAction = (action: () => void) => {
   action();
   setIsOpen(false);
 };

 const actions = [
   {
     key: 'reply',
     label: 'Répondre',
     icon: '↩️',
     shortcut: 'R',
     onClick: () => handleAction(() => onReply(messageId)),
     show: true
   },
   {
     key: 'copy',
     label: 'Copier',
     icon: '📋',
     shortcut: '⌘C',
     onClick: () => handleAction(() => onCopy(messageId)),
     show: true
   },
   {
     key: 'pin',
     label: 'Épingler',
     icon: '📌',
     shortcut: 'P',
     onClick: () => handleAction(() => onPin(messageId)),
     show: true
   },
   {
     key: 'edit',
     label: 'Modifier',
     icon: '✏️',
     shortcut: 'E',
     onClick: () => handleAction(() => onEdit(messageId)),
     show: isOwn && canEdit,
     separator: true
   },
   {
     key: 'delete',
     label: 'Supprimer',
     icon: '🗑️',
     shortcut: '⌫',
     onClick: () => handleAction(() => onDelete(messageId)),
     show: isOwn && canDelete,
     dangerous: true
   },
   {
     key: 'report',
     label: 'Signaler',
     icon: '⚠️',
     shortcut: '!',
     onClick: () => handleAction(() => onReport?.(messageId)),
     show: !isOwn && onReport,
     dangerous: true
   }
 ];

 const visibleActions = actions.filter(action => action.show);

 return (
   <>
     <button
       ref={triggerRef}
       onClick={handleClick}
       onContextMenu={handleContextMenu}
       style={{
         background: 'transparent',
         border: 'none',
         cursor: 'pointer',
         padding: '0.25rem',
         borderRadius: '0.25rem',
         color: '#64748b',
         opacity: 0.7,
         transition: 'all 0.2s ease'
       }}
       onMouseEnter={(e) => {
         e.currentTarget.style.opacity = '1';
         e.currentTarget.style.background = 'rgba(0,0,0,0.05)';
       }}
       onMouseLeave={(e) => {
         e.currentTarget.style.opacity = '0.7';
         e.currentTarget.style.background = 'transparent';
       }}
     >
       ⋮
     </button>

     {isOpen && (
       <>
         <div
           style={{
             position: 'fixed',
             top: 0,
             left: 0,
             right: 0,
             bottom: 0,
             zIndex: 998,
             background: 'transparent'
           }}
         />
         
         <div
           ref={menuRef}
           style={{
             position: 'fixed',
             left: Math.min(position.x, window.innerWidth - 220),
             top: Math.min(position.y, window.innerHeight - (visibleActions.length * 40 + 16)),
             zIndex: 999,
             background: 'white',
             borderRadius: '0.75rem',
             boxShadow: '0 20px 25px rgba(0, 0, 0, 0.1), 0 10px 10px rgba(0, 0, 0, 0.04)',
             border: '1px solid #e5e7eb',
             minWidth: '200px',
             padding: '0.5rem',
             animation: 'slideInScale 0.2s ease-out'
           }}
         >
           {visibleActions.map((action, index) => (
             <div key={action.key}>
               {action.separator && index > 0 && (
                 <div
                   style={{
                     height: '1px',
                     background: '#e5e7eb',
                     margin: '0.5rem 0'
                   }}
                 />
               )}
               <button
                 onClick={action.onClick}
                 style={{
                   width: '100%',
                   display: 'flex',
                   alignItems: 'center',
                   justifyContent: 'space-between',
                   padding: '0.5rem 0.75rem',
                   background: 'transparent',
                   border: 'none',
                   borderRadius: '0.5rem',
                   cursor: 'pointer',
                   fontSize: '0.875rem',
                   color: action.dangerous ? '#ef4444' : '#374151',
                   transition: 'all 0.2s ease',
                   textAlign: 'left'
                 }}
                 onMouseEnter={(e) => {
                   e.currentTarget.style.background = action.dangerous ? '#fee2e2' : '#f9fafb';
                 }}
                 onMouseLeave={(e) => {
                   e.currentTarget.style.background = 'transparent';
                 }}
               >
                 <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                   <span>{action.icon}</span>
                   <span>{action.label}</span>
                 </div>
                 <kbd style={{
                   background: '#f1f5f9',
                   color: '#64748b',
                   padding: '0.125rem 0.25rem',
                   borderRadius: '0.25rem',
                   fontSize: '0.75rem',
                   fontFamily: 'monospace'
                 }}>
                   {action.shortcut}
                 </kbd>
               </button>
             </div>
           ))}
         </div>
       </>
     )}

     <style jsx>{`
       @keyframes slideInScale {
         from {
           opacity: 0;
           transform: scale(0.95) translateY(-10px);
         }
         to {
           opacity: 1;
           transform: scale(1) translateY(0);
         }
       }
     `}</style>
   </>
 );
}
