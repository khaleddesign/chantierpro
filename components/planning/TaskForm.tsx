'use client';

import { useState, useEffect } from 'react';

interface TaskFormProps {
  projetId: string;
  taches: any[];
  task?: any;
  onSubmit: (taskData: any) => void;
  onClose: () => void;
}

export default function TaskForm({
  projetId,
  taches,
  task,
  onSubmit,
  onClose
}: TaskFormProps) {
  const [formData, setFormData] = useState({
    nom: '',
    description: '',
    dateDebut: '',
    dateFin: '',
    statut: 'EN_ATTENTE',
    priorite: 'MOYENNE',
    corpsEtat: '',
    dependances: [] as string[],
    assignations: [] as string[]
  });

  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    if (task) {
      setFormData({
        nom: task.nom || '',
        description: task.description || '',
        dateDebut: task.dateDebut ? task.dateDebut.split('T')[0] : '',
        dateFin: task.dateFin ? task.dateFin.split('T')[0] : '',
        statut: task.statut || 'EN_ATTENTE',
        priorite: task.priorite || 'MOYENNE',
        corpsEtat: task.corpsEtat || '',
       dependances: task.dependances || [],
       assignations: task.assignations?.map((a: any) => a.userId) || []
     });
   }
   fetchUsers();
 }, [task]);

 const fetchUsers = async () => {
   try {
     setLoadingUsers(true);
     // Simulation - En production, récupérer les utilisateurs via API
     const mockUsers = [
       { id: '1', name: 'Jean Dupont', email: 'jean.dupont@entreprise.com', role: 'MANAGER' },
       { id: '2', name: 'Marie Martin', email: 'marie.martin@entreprise.com', role: 'ARTISAN' },
       { id: '3', name: 'Pierre Durand', email: 'pierre.durand@entreprise.com', role: 'ARTISAN' },
       { id: '4', name: 'Sophie Laurent', email: 'sophie.laurent@entreprise.com', role: 'ARTISAN' }
     ];
     setUsers(mockUsers);
   } catch (error) {
     console.error('Erreur chargement utilisateurs:', error);
   } finally {
     setLoadingUsers(false);
   }
 };

 const handleSubmit = (e: React.FormEvent) => {
   e.preventDefault();
   
   // Validation
   if (!formData.nom.trim()) {
     alert('Le nom de la tâche est requis');
     return;
   }
   
   if (!formData.dateDebut || !formData.dateFin) {
     alert('Les dates de début et de fin sont requises');
     return;
   }
   
   const dateDebut = new Date(formData.dateDebut);
   const dateFin = new Date(formData.dateFin);
   
   if (dateFin <= dateDebut) {
     alert('La date de fin doit être postérieure à la date de début');
     return;
   }

   // Calculer la durée
   const dureeJours = Math.ceil((dateFin.getTime() - dateDebut.getTime()) / (1000 * 60 * 60 * 24));

   onSubmit({
     ...formData,
     dureeJours,
     avancement: task?.avancement || 0
   });
 };

 const getAvailableDependencies = () => {
   return taches.filter(t => t.id !== task?.id);
 };

 const corpsEtatOptions = [
   'Démolition', 'Gros œuvre', 'Maçonnerie', 'Charpente', 'Couverture',
   'Zinguerie', 'Étanchéité', 'Isolation', 'Cloisons', 'Électricité',
   'Plomberie', 'Chauffage', 'Ventilation', 'Menuiserie', 'Serrurerie',
   'Carrelage', 'Revêtements', 'Peinture', 'Finitions', 'Nettoyage'
 ];

 return (
   <div style={{
     position: 'fixed',
     top: 0,
     left: 0,
     right: 0,
     bottom: 0,
     background: 'rgba(0,0,0,0.5)',
     display: 'flex',
     alignItems: 'center',
     justifyContent: 'center',
     zIndex: 1000,
     padding: '1rem'
   }}>
     <div style={{
       background: 'white',
       borderRadius: '1rem',
       width: '100%',
       maxWidth: '800px',
       maxHeight: '90vh',
       overflow: 'auto'
     }}>
       <div style={{
         padding: '1.5rem',
         borderBottom: '1px solid #e2e8f0',
         display: 'flex',
         justifyContent: 'space-between',
         alignItems: 'center'
       }}>
         <h3 style={{ margin: 0, color: '#1e293b' }}>
           {task ? '✏️ Modifier la Tâche' : '➕ Nouvelle Tâche'}
         </h3>
         <button
           onClick={onClose}
           style={{
             padding: '0.5rem',
             border: 'none',
             background: '#f1f5f9',
             borderRadius: '0.5rem',
             cursor: 'pointer',
             color: '#64748b'
           }}
         >
           ✕
         </button>
       </div>

       <form onSubmit={handleSubmit} style={{ padding: '1.5rem' }}>
         {/* Informations de base */}
         <div style={{
           display: 'grid',
           gridTemplateColumns: 'repeat(2, 1fr)',
           gap: '1rem',
           marginBottom: '1.5rem'
         }}>
           <div style={{ gridColumn: '1 / -1' }}>
             <label style={{
               display: 'block',
               marginBottom: '0.5rem',
               fontWeight: '500',
               color: '#374151'
             }}>
               Nom de la tâche *
             </label>
             <input
               type="text"
               value={formData.nom}
               onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
               placeholder="Ex: Installation électrique salon"
               style={{
                 width: '100%',
                 padding: '0.75rem',
                 border: '1px solid #d1d5db',
                 borderRadius: '0.5rem'
               }}
             />
           </div>

           <div>
             <label style={{
               display: 'block',
               marginBottom: '0.5rem',
               fontWeight: '500',
               color: '#374151'
             }}>
               Corps d'état
             </label>
             <select
               value={formData.corpsEtat}
               onChange={(e) => setFormData({ ...formData, corpsEtat: e.target.value })}
               style={{
                 width: '100%',
                 padding: '0.75rem',
                 border: '1px solid #d1d5db',
                 borderRadius: '0.5rem'
               }}
             >
               <option value="">Sélectionner...</option>
               {corpsEtatOptions.map(corps => (
                 <option key={corps} value={corps}>{corps}</option>
               ))}
             </select>
           </div>

           <div>
             <label style={{
               display: 'block',
               marginBottom: '0.5rem',
               fontWeight: '500',
               color: '#374151'
             }}>
               Priorité
             </label>
             <select
               value={formData.priorite}
               onChange={(e) => setFormData({ ...formData, priorite: e.target.value })}
               style={{
                 width: '100%',
                 padding: '0.75rem',
                 border: '1px solid #d1d5db',
                 borderRadius: '0.5rem'
               }}
             >
               <option value="BASSE">🟢 Basse</option>
               <option value="MOYENNE">🟡 Moyenne</option>
               <option value="HAUTE">🟠 Haute</option>
               <option value="CRITIQUE">🔴 Critique</option>
             </select>
           </div>
         </div>

         {/* Description */}
         <div style={{ marginBottom: '1.5rem' }}>
           <label style={{
             display: 'block',
             marginBottom: '0.5rem',
             fontWeight: '500',
             color: '#374151'
           }}>
             Description
           </label>
           <textarea
             value={formData.description}
             onChange={(e) => setFormData({ ...formData, description: e.target.value })}
             placeholder="Description détaillée de la tâche..."
             rows={3}
             style={{
               width: '100%',
               padding: '0.75rem',
               border: '1px solid #d1d5db',
               borderRadius: '0.5rem',
               resize: 'vertical'
             }}
           />
         </div>

         {/* Dates */}
         <div style={{
           display: 'grid',
           gridTemplateColumns: 'repeat(3, 1fr)',
           gap: '1rem',
           marginBottom: '1.5rem'
         }}>
           <div>
             <label style={{
               display: 'block',
               marginBottom: '0.5rem',
               fontWeight: '500',
               color: '#374151'
             }}>
               Date de début *
             </label>
             <input
               type="date"
               value={formData.dateDebut}
               onChange={(e) => setFormData({ ...formData, dateDebut: e.target.value })}
               style={{
                 width: '100%',
                 padding: '0.75rem',
                 border: '1px solid #d1d5db',
                 borderRadius: '0.5rem'
               }}
             />
           </div>

           <div>
             <label style={{
               display: 'block',
               marginBottom: '0.5rem',
               fontWeight: '500',
               color: '#374151'
             }}>
               Date de fin *
             </label>
             <input
               type="date"
               value={formData.dateFin}
               onChange={(e) => setFormData({ ...formData, dateFin: e.target.value })}
               style={{
                 width: '100%',
                 padding: '0.75rem',
                 border: '1px solid #d1d5db',
                 borderRadius: '0.5rem'
               }}
             />
           </div>

           <div>
             <label style={{
               display: 'block',
               marginBottom: '0.5rem',
               fontWeight: '500',
               color: '#374151'
             }}>
               Statut
             </label>
             <select
               value={formData.statut}
               onChange={(e) => setFormData({ ...formData, statut: e.target.value })}
               style={{
                 width: '100%',
                 padding: '0.75rem',
                 border: '1px solid #d1d5db',
                 borderRadius: '0.5rem'
               }}
             >
               <option value="EN_ATTENTE">⏳ En attente</option>
               <option value="EN_COURS">🔄 En cours</option>
               <option value="TERMINE">✅ Terminé</option>
               <option value="SUSPENDU">⏸️ Suspendu</option>
             </select>
           </div>
         </div>

         {/* Durée calculée */}
         {formData.dateDebut && formData.dateFin && (
           <div style={{
             background: '#f0f9ff',
             border: '1px solid #0ea5e9',
             borderRadius: '0.5rem',
             padding: '0.75rem',
             marginBottom: '1.5rem'
           }}>
             <div style={{ fontSize: '0.875rem', color: '#0369a1' }}>
               ⏱️ Durée calculée: {Math.ceil(
                 (new Date(formData.dateFin).getTime() - new Date(formData.dateDebut).getTime()) 
                 / (1000 * 60 * 60 * 24)
               )} jour{Math.ceil((new Date(formData.dateFin).getTime() - new Date(formData.dateDebut).getTime()) / (1000 * 60 * 60 * 24)) > 1 ? 's' : ''}
             </div>
           </div>
         )}

         {/* Dépendances */}
         {getAvailableDependencies().length > 0 && (
           <div style={{ marginBottom: '1.5rem' }}>
             <label style={{
               display: 'block',
               marginBottom: '0.5rem',
               fontWeight: '500',
               color: '#374151'
             }}>
               Dépendances (tâches à terminer avant)
             </label>
             <div style={{
               border: '1px solid #d1d5db',
               borderRadius: '0.5rem',
               padding: '0.75rem',
               maxHeight: '120px',
               overflow: 'auto'
             }}>
               {getAvailableDependencies().map(tache => (
                 <label key={tache.id} style={{
                   display: 'flex',
                   alignItems: 'center',
                   gap: '0.5rem',
                   padding: '0.25rem 0',
                   cursor: 'pointer'
                 }}>
                   <input
                     type="checkbox"
                     checked={formData.dependances.includes(tache.id)}
                     onChange={(e) => {
                       if (e.target.checked) {
                         setFormData({
                           ...formData,
                           dependances: [...formData.dependances, tache.id]
                         });
                       } else {
                         setFormData({
                           ...formData,
                           dependances: formData.dependances.filter(id => id !== tache.id)
                         });
                       }
                     }}
                   />
                   <span style={{ fontSize: '0.875rem' }}>
                     {tache.nom} ({tache.corpsEtat})
                   </span>
                 </label>
               ))}
             </div>
           </div>
         )}

         {/* Assignations */}
         <div style={{ marginBottom: '2rem' }}>
           <label style={{
             display: 'block',
             marginBottom: '0.5rem',
             fontWeight: '500',
             color: '#374151'
           }}>
             Assignations
           </label>
           {loadingUsers ? (
             <div style={{ 
               padding: '1rem', 
               textAlign: 'center', 
               color: '#64748b',
               fontSize: '0.875rem' 
             }}>
               Chargement des utilisateurs...
             </div>
           ) : (
             <div style={{
               border: '1px solid #d1d5db',
               borderRadius: '0.5rem',
               padding: '0.75rem',
               maxHeight: '120px',
               overflow: 'auto'
             }}>
               {users.map(user => (
                 <label key={user.id} style={{
                   display: 'flex',
                   alignItems: 'center',
                   justifyContent: 'space-between',
                   padding: '0.5rem 0',
                   cursor: 'pointer',
                   borderBottom: '1px solid #f1f5f9'
                 }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                     <input
                       type="checkbox"
                       checked={formData.assignations.includes(user.id)}
                       onChange={(e) => {
                         if (e.target.checked) {
                           setFormData({
                             ...formData,
                             assignations: [...formData.assignations, user.id]
                           });
                         } else {
                           setFormData({
                             ...formData,
                             assignations: formData.assignations.filter(id => id !== user.id)
                           });
                         }
                       }}
                     />
                     <div>
                       <div style={{ fontSize: '0.875rem', fontWeight: '500' }}>
                         {user.name}
                       </div>
                       <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                         {user.email}
                       </div>
                     </div>
                   </div>
                   <div style={{
                     background: user.role === 'MANAGER' ? '#3b82f6' : '#10b981',
                     color: 'white',
                     padding: '0.125rem 0.5rem',
                     borderRadius: '0.5rem',
                     fontSize: '0.75rem'
                   }}>
                     {user.role}
                   </div>
                 </label>
               ))}
             </div>
           )}
         </div>

         {/* Actions */}
         <div style={{
           display: 'flex',
           justifyContent: 'flex-end',
           gap: '1rem',
           paddingTop: '1rem',
           borderTop: '1px solid #e2e8f0'
         }}>
           <button
             type="button"
             onClick={onClose}
             style={{
               padding: '0.75rem 1.5rem',
               border: '1px solid #d1d5db',
               borderRadius: '0.5rem',
               background: 'white',
               color: '#374151',
               cursor: 'pointer'
             }}
           >
             Annuler
           </button>
           <button
             type="submit"
             className="btn-primary"
             disabled={!formData.nom || !formData.dateDebut || !formData.dateFin}
             style={{
               opacity: (!formData.nom || !formData.dateDebut || !formData.dateFin) ? 0.5 : 1,
               cursor: (!formData.nom || !formData.dateDebut || !formData.dateFin) ? 'not-allowed' : 'pointer'
             }}
           >
             {task ? '💾 Mettre à jour' : '➕ Créer la tâche'}
           </button>
         </div>
       </form>
     </div>
   </div>
 );
}
