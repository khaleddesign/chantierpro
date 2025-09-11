'use client';

import { useState } from 'react';
import { useEtapes } from '@/hooks/useEtapes';
import { useAuth } from '@/hooks/useAuth';
import EtapeCard from './EtapeCard';
import EtapeForm from './EtapeForm';
import { EtapeChantier, EtapeFormData } from '@/types/etapes';
import { Plus, Calendar, Filter } from 'lucide-react';

interface EtapesListProps {
  chantierId: string;
}

export default function EtapesList({ chantierId }: EtapesListProps) {
  const { user } = useAuth();
  const { etapes, loading, error, actions } = useEtapes({ chantierId });
  const [showForm, setShowForm] = useState(false);
  const [editingEtape, setEditingEtape] = useState<EtapeChantier | undefined>();
  const [statusFilter, setStatusFilter] = useState<string>('TOUS');
  const [submitting, setSubmitting] = useState(false);

  const canEdit = user && ['ADMIN', 'COMMERCIAL'].includes(user.role);

  const filteredEtapes = etapes.filter(etape => 
    statusFilter === 'TOUS' || etape.statut === statusFilter
  );

  const handleSubmit = async (data: EtapeFormData) => {
    if (!user) return;
    
    setSubmitting(true);
    try {
      if (editingEtape) {
        await actions.updateEtape(editingEtape.id, data);
      } else {
        await actions.createEtape({
          ...data,
          chantierId,
          createdById: user.id
        });
      }
      setShowForm(false);
      setEditingEtape(undefined);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (etape: EtapeChantier) => {
       setEditingEtape(etape);
   setShowForm(true);
 };

 const handleDelete = async (id: string) => {
   if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette étape ?')) return;
   
   try {
     await actions.deleteEtape(id);
   } catch (error) {
     console.error('Erreur suppression:', error);
   }
 };

 const handleStatusChange = async (id: string, status: 'A_FAIRE' | 'EN_COURS' | 'TERMINE') => {
   try {
     await actions.updateEtape(id, { statut: status });
   } catch (error) {
     console.error('Erreur changement statut:', error);
   }
 };

 const handleCancel = () => {
   setShowForm(false);
   setEditingEtape(undefined);
 };

 const getStatsCount = (status: string) => {
   return etapes.filter(etape => etape.statut === status).length;
 };

 if (loading) {
   return (
     <div className="bg-white rounded-lg p-6">
       <div className="animate-pulse space-y-4">
         <div className="h-4 bg-gray-200 rounded w-1/4"></div>
         <div className="space-y-3">
           <div className="h-20 bg-gray-200 rounded"></div>
           <div className="h-20 bg-gray-200 rounded"></div>
         </div>
       </div>
     </div>
   );
 }

 if (error) {
   return (
     <div className="bg-white rounded-lg p-6">
       <div className="text-center text-red-600">
         <p>Erreur: {error}</p>
         <button 
           onClick={actions.refresh}
           className="mt-2 text-blue-600 hover:underline"
         >
           Réessayer
         </button>
       </div>
     </div>
   );
 }

 return (
   <div className="bg-white rounded-lg">
     <div className="p-6 border-b border-gray-200">
       <div className="flex items-center justify-between mb-4">
         <div className="flex items-center gap-3">
           <Calendar size={24} className="text-blue-600" />
           <h2 className="text-xl font-semibold">Étapes du chantier</h2>
         </div>
         
         {canEdit && (
           <button
             onClick={() => setShowForm(true)}
             className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
           >
             <Plus size={18} />
             Nouvelle étape
           </button>
         )}
       </div>

       <div className="flex items-center gap-4">
         <div className="flex items-center gap-2">
           <Filter size={16} className="text-gray-500" />
           <select
             value={statusFilter}
             onChange={(e) => setStatusFilter(e.target.value)}
             className="border border-gray-300 rounded px-3 py-1 text-sm"
           >
             <option value="TOUS">Tous ({etapes.length})</option>
             <option value="A_FAIRE">À faire ({getStatsCount('A_FAIRE')})</option>
             <option value="EN_COURS">En cours ({getStatsCount('EN_COURS')})</option>
             <option value="TERMINE">Terminé ({getStatsCount('TERMINE')})</option>
           </select>
         </div>

         <div className="flex gap-4 text-sm">
           <div className="flex items-center gap-1">
             <div className="w-3 h-3 bg-gray-100 rounded"></div>
             <span className="text-gray-600">{getStatsCount('A_FAIRE')} à faire</span>
           </div>
           <div className="flex items-center gap-1">
             <div className="w-3 h-3 bg-blue-100 rounded"></div>
             <span className="text-gray-600">{getStatsCount('EN_COURS')} en cours</span>
           </div>
           <div className="flex items-center gap-1">
             <div className="w-3 h-3 bg-green-100 rounded"></div>
             <span className="text-gray-600">{getStatsCount('TERMINE')} terminé</span>
           </div>
         </div>
       </div>
     </div>

     <div className="p-6">
       {filteredEtapes.length === 0 ? (
         <div className="text-center py-8 text-gray-500">
           <Calendar size={48} className="mx-auto mb-4 text-gray-300" />
           <p className="text-lg font-medium mb-2">
             {statusFilter === 'TOUS' ? 'Aucune étape' : 'Aucune étape avec ce statut'}
           </p>
           <p className="text-sm">
             {canEdit && statusFilter === 'TOUS' && 'Cliquez sur "Nouvelle étape" pour commencer'}
           </p>
         </div>
       ) : (
         <div className="space-y-4">
           {filteredEtapes.map((etape) => (
             <EtapeCard
               key={etape.id}
               etape={etape}
               canEdit={canEdit || false}
               onEdit={canEdit ? handleEdit : undefined}
               onDelete={canEdit ? handleDelete : undefined}
               onStatusChange={canEdit ? handleStatusChange : undefined}
             />
           ))}
         </div>
       )}
     </div>

     {showForm && (
       <EtapeForm
         etape={editingEtape}
         onSubmit={handleSubmit}
         onCancel={handleCancel}
         loading={submitting}
       />
     )}
   </div>
 );
}
