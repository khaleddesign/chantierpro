'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Clock, Users, MapPin } from 'lucide-react';

interface Planning {
  id: string;
  titre: string;
  description?: string;
  type: string;
  dateDebut: string;
  dateFin: string;
  statut: string;
  lieu?: string;
  organisateur: {
    id: string;
    name: string;
    role: string;
  };
  participants?: Array<{
    id: string;
    name: string;
    role: string;
  }>;
  chantier?: {
    id: string;
    nom: string;
  };
}

interface CalendarViewProps {
  plannings: Planning[];
  viewMode: 'jour' | 'semaine' | 'mois';
  currentDate: Date;
  onEventClick: (planning: Planning) => void;
}

export default function CalendarView({ plannings, viewMode, currentDate, onEventClick }: CalendarViewProps) {
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'RDV_CLIENT': return 'bg-blue-500';
      case 'PLANNING_CHANTIER': return 'bg-green-500';
      case 'LIVRAISON': return 'bg-orange-500';
      case 'INSPECTION': return 'bg-purple-500';
      case 'CONGES': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getHourPosition = (date: string) => {
    const hour = new Date(date).getHours();
    const minutes = new Date(date).getMinutes();
    return (hour * 60 + minutes) / 1440 * 100; // Pourcentage de la journée
  };

  const getEventDuration = (debut: string, fin: string) => {
    const startTime = new Date(debut).getTime();
    const endTime = new Date(fin).getTime();
    const durationMs = endTime - startTime;
    const durationHours = durationMs / (1000 * 60 * 60);
    return Math.max(durationHours / 24 * 100, 5); // Minimum 5% de hauteur
  };

  if (viewMode === 'jour') {
    return (
      <div className="bg-white/5 rounded-lg p-6">
        <div className="grid grid-cols-24 gap-px">
          {/* Grille horaire */}
          {Array.from({ length: 24 }, (_, hour) => (
            <div key={hour} className="relative border-r border-white/10 min-h-16">
              <div className="absolute -top-3 -left-2 text-xs text-blue-200 bg-slate-900 px-1 rounded">
                {hour.toString().padStart(2, '0')}:00
              </div>
              
              {/* Événements à cette heure */}
              {plannings
                .filter(p => {
                  const eventHour = new Date(p.dateDebut).getHours();
                  return eventHour === hour;
                })
                .map((planning, index) => (
                  <div
                    key={planning.id}
                    onClick={() => onEventClick(planning)}
                    className={`absolute left-1 right-1 rounded p-2 cursor-pointer hover:opacity-80 transition-opacity ${getTypeColor(planning.type)}`}
                    style={{
                      top: `${(new Date(planning.dateDebut).getMinutes() / 60) * 100}%`,
                      height: `${getEventDuration(planning.dateDebut, planning.dateFin)}%`,
                      zIndex: 10 + index
                    }}
                  >
                    <div className="text-white text-xs font-medium truncate">
                      {planning.titre}
                    </div>
                    <div className="text-white/80 text-xs truncate">
                      {new Date(planning.dateDebut).toLocaleTimeString('fr-FR', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </div>
                  </div>
                ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (viewMode === 'semaine') {
    const weekStart = new Date(currentDate);
    weekStart.setDate(currentDate.getDate() - currentDate.getDay());
    
    const weekDays = Array.from({ length: 7 }, (_, i) => {
      const day = new Date(weekStart);
      day.setDate(weekStart.getDate() + i);
      return day;
    });

    return (
      <div className="bg-white/5 rounded-lg p-6 overflow-x-auto">
        <div className="grid grid-cols-8 gap-2 min-w-full">
          {/* En-tête vide pour la colonne des heures */}
          <div></div>
          
          {/* En-têtes des jours */}
          {weekDays.map((day) => (
            <div key={day.toDateString()} className="text-center p-3 bg-white/10 rounded-lg">
              <div className="text-white font-medium">
                {day.toLocaleDateString('fr-FR', { weekday: 'short' })}
              </div>
              <div className="text-blue-200 text-sm">
                {day.getDate()}
              </div>
            </div>
          ))}

          {/* Grille des heures et événements */}
          {Array.from({ length: 24 }, (_, hour) => (
            <>
              {/* Colonne des heures */}
              <div key={`hour-${hour}`} className="text-right pr-3 py-2">
                <div className="text-blue-200 text-sm">
                  {hour.toString().padStart(2, '0')}:00
                </div>
              </div>
              
              {/* Colonnes des jours */}
              {weekDays.map((day) => {
                const dayPlannings = plannings.filter(p => {
                  const eventDate = new Date(p.dateDebut);
                  const eventHour = eventDate.getHours();
                  return eventDate.toDateString() === day.toDateString() && eventHour === hour;
                });

                return (
                  <div key={`${day.toDateString()}-${hour}`} className="relative border border-white/5 min-h-12 p-1">
                    {dayPlannings.map((planning, index) => (
                      <div
                        key={planning.id}
                        onClick={() => onEventClick(planning)}
                        className={`w-full rounded p-1 cursor-pointer hover:opacity-80 transition-opacity text-xs mb-1 ${getTypeColor(planning.type)}`}
                     >
                       <div className="text-white font-medium truncate">
                         {planning.titre}
                       </div>
                       <div className="text-white/80 truncate">
                         {new Date(planning.dateDebut).toLocaleTimeString('fr-FR', { 
                           hour: '2-digit', 
                           minute: '2-digit' 
                         })}
                       </div>
                     </div>
                   ))}
                 </div>
               );
             })}
           </>
         ))}
       </div>
     </div>
   );
 }

 if (viewMode === 'mois') {
   const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
   const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
   const startDate = new Date(monthStart);
   startDate.setDate(startDate.getDate() - startDate.getDay());
   
   const days = [];
   const currentDay = new Date(startDate);
   
   while (days.length < 42) { // 6 semaines x 7 jours
     days.push(new Date(currentDay));
     currentDay.setDate(currentDay.getDate() + 1);
   }

   return (
     <div className="bg-white/5 rounded-lg p-6">
       {/* En-têtes des jours de la semaine */}
       <div className="grid grid-cols-7 gap-2 mb-4">
         {['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'].map((day) => (
           <div key={day} className="text-center p-2 text-blue-200 font-medium">
             {day}
           </div>
         ))}
       </div>

       {/* Grille du calendrier */}
       <div className="grid grid-cols-7 gap-2">
         {days.map((day) => {
           const isCurrentMonth = day.getMonth() === currentDate.getMonth();
           const isToday = day.toDateString() === new Date().toDateString();
           const dayPlannings = plannings.filter(p => 
             new Date(p.dateDebut).toDateString() === day.toDateString()
           );

           return (
             <div
               key={day.toDateString()}
               className={`min-h-32 p-2 rounded-lg border transition-colors ${
                 isCurrentMonth
                   ? 'bg-white/10 border-white/20'
                   : 'bg-white/5 border-white/10'
               } ${isToday ? 'ring-2 ring-blue-400' : ''}`}
             >
               <div className={`text-sm mb-2 ${
                 isCurrentMonth ? 'text-white' : 'text-blue-300'
               } ${isToday ? 'font-bold' : ''}`}>
                 {day.getDate()}
               </div>
               
               <div className="space-y-1">
                 {dayPlannings.slice(0, 3).map((planning) => (
                   <div
                     key={planning.id}
                     onClick={() => onEventClick(planning)}
                     className={`p-1 rounded text-xs cursor-pointer hover:opacity-80 transition-opacity ${getTypeColor(planning.type)}`}
                   >
                     <div className="text-white font-medium truncate">
                       {planning.titre}
                     </div>
                     <div className="text-white/80 truncate">
                       {new Date(planning.dateDebut).toLocaleTimeString('fr-FR', { 
                         hour: '2-digit', 
                         minute: '2-digit' 
                       })}
                     </div>
                   </div>
                 ))}
                 
                 {dayPlannings.length > 3 && (
                   <div className="text-xs text-blue-200 text-center">
                     +{dayPlannings.length - 3} autre(s)
                   </div>
                 )}
               </div>
             </div>
           );
         })}
       </div>
     </div>
   );
 }

 return null;
}
