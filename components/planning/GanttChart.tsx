'use client';

import { useState, useEffect, useRef } from 'react';
import { ReactNode } from 'react';

interface GanttChartProps {
  taches: any[];
  onTacheClick?: (tache: any) => void;
  onTacheUpdate?: (tacheId: string, updates: any) => void;
  readOnly?: boolean;
}

export default function GanttChart({ 
  taches, 
  onTacheClick, 
  onTacheUpdate, 
  readOnly = false 
}: GanttChartProps) {
  const [viewMode, setViewMode] = useState<'jours' | 'semaines' | 'mois'>('jours');
  const [draggedTask, setDraggedTask] = useState<string | null>(null);
  const [resizingTask, setResizingTask] = useState<string | null>(null);
  const [timelineStart, setTimelineStart] = useState<Date>(new Date());
  const [timelineEnd, setTimelineEnd] = useState<Date>(new Date());
  const ganttRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    calculateTimeline();
  }, [taches, viewMode]);

  const calculateTimeline = () => {
    if (taches.length === 0) return;

    const dates = taches.flatMap(t => [
      new Date(t.dateDebut),
      new Date(t.dateFin)
    ]);

    const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));

    // Ajouter une marge
    const marge = 7 * 24 * 60 * 60 * 1000; // 7 jours
    setTimelineStart(new Date(minDate.getTime() - marge));
    setTimelineEnd(new Date(maxDate.getTime() + marge));
  };

  const getTimelineUnits = () => {
    const units = [];
    const current = new Date(timelineStart);
    
    while (current <= timelineEnd) {
      units.push(new Date(current));
      
      switch (viewMode) {
        case 'jours':
          current.setDate(current.getDate() + 1);
          break;
        case 'semaines':
          current.setDate(current.getDate() + 7);
          break;
        case 'mois':
          current.setMonth(current.getMonth() + 1);
          break;
      }
    }
    
    return units;
  };

  const formatTimeUnit = (date: Date) => {
    switch (viewMode) {
      case 'jours':
        return date.toLocaleDateString('fr-FR', { 
          day: 'numeric', 
          month: 'short' 
        });
      case 'semaines':
        return `S${getWeekNumber(date)}`;
      case 'mois':
        return date.toLocaleDateString('fr-FR', { 
          month: 'short', 
          year: '2-digit' 
        });
      default:
        return '';
    }
  };

  const getWeekNumber = (date: Date) => {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  };

  const getTaskPosition = (tache: any) => {
    const totalDuration = timelineEnd.getTime() - timelineStart.getTime();
    const taskStart = new Date(tache.dateDebut).getTime() - timelineStart.getTime();
    const taskDuration = new Date(tache.dateFin).getTime() - new Date(tache.dateDebut).getTime();
    
    const left = (taskStart / totalDuration) * 100;
    const width = (taskDuration / totalDuration) * 100;
    
    return { left: `${Math.max(0, left)}%`, width: `${Math.max(1, width)}%` };
  };

  const getStatusColor = (statut: string) => {
    const colors = {
      'EN_ATTENTE': '#94a3b8',
      'EN_COURS': '#3b82f6',
      'TERMINE': '#10b981',
      'EN_RETARD': '#ef4444',
      'SUSPENDU': '#f59e0b'
    };
    return colors[statut as keyof typeof colors] || '#64748b';
  };

  const getPriorityColor = (priorite: string) => {
    const colors = {
      'BASSE': '#10b981',
      'MOYENNE': '#f59e0b',
      'HAUTE': '#ef4444',
      'CRITIQUE': '#7c2d12'
    };
    return colors[priorite as keyof typeof colors] || '#64748b';
  };

  const getDependencyLines = () => {
    const lines: ReactNode[] = [];
    
    taches.forEach((tache, index) => {
      if (tache.dependances && tache.dependances.length > 0) {
        tache.dependances.forEach((depId: string) => {
          const depTask = taches.find(t => t.id === depId);
          if (depTask) {
            const depIndex = taches.findIndex(t => t.id === depId);
            if (depIndex !== -1) {
              lines.push(
                <line
                  key={`${depId}-${tache.id}`}
                  x1="100%"
                  y1={depIndex * 60 + 30}
                  x2="0%"
                  y2={index * 60 + 30}
                  stroke="#64748b"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                  markerEnd="url(#arrowhead)"
                />
              );
            }
          }
        });
      }
    });

    return lines;
  };

  const timelineUnits = getTimelineUnits();

  return (
    <div className="gantt-container" style={{ width: '100%', overflow: 'auto' }}>
      {/* Contrôles de vue */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1rem',
        background: '#f8fafc',
        borderBottom: '1px solid #e2e8f0'
      }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {(['jours', 'semaines', 'mois'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              style={{
                padding: '0.5rem 1rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.5rem',
                background: viewMode === mode ? '#3b82f6' : 'white',
                color: viewMode === mode ? 'white' : '#374151',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500',
                textTransform: 'capitalize'
              }}
            >
              {mode}
            </button>
          ))}
        </div>
        
        <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
          {timelineStart.toLocaleDateString('fr-FR')} → {timelineEnd.toLocaleDateString('fr-FR')}
        </div>
      </div>

      {/* Gantt Chart */}
      <div ref={ganttRef} style={{ position: 'relative', minWidth: '800px' }}>
        {/* En-tête timeline */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '300px 1fr',
          background: '#f1f5f9',
          borderBottom: '1px solid #e2e8f0',
          position: 'sticky',
          top: 0,
          zIndex: 10
        }}>
          <div style={{
            padding: '1rem',
            fontWeight: '600',
            color: '#374151',
            borderRight: '1px solid #e2e8f0'
          }}>
            Tâches
          </div>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${timelineUnits.length}, 1fr)`,
            borderRight: '1px solid #e2e8f0'
          }}>
            {timelineUnits.map((unit, index) => (
              <div key={index} style={{
                padding: '0.5rem',
                textAlign: 'center',
                fontSize: '0.75rem',
                fontWeight: '500',
                color: '#64748b',
                borderRight: index < timelineUnits.length - 1 ? '1px solid #e5e7eb' : 'none'
              }}>
                {formatTimeUnit(unit)}
              </div>
            ))}
          </div>
        </div>

        {/* Corps du Gantt */}
        <div style={{ position: 'relative' }}>
          {/* Grille de fond */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: '300px',
            right: 0,
            bottom: 0,
            display: 'grid',
            gridTemplateColumns: `repeat(${timelineUnits.length}, 1fr)`,
            zIndex: 1
          }}>
            {timelineUnits.map((_, index) => (
              <div key={index} style={{
                borderRight: index < timelineUnits.length - 1 ? '1px solid #f1f5f9' : 'none',
                background: index % 2 === 0 ? '#fafafa' : 'transparent'
              }} />
            ))}
          </div>

          {/* Ligne aujourd'hui */}
          <div style={{
            position: 'absolute',
            left: '300px',
            right: 0,
            top: 0,
            bottom: 0,
            pointerEvents: 'none',
            zIndex: 5
          }}>
            {(() => {
              const today = new Date();
              if (today >= timelineStart && today <= timelineEnd) {
                const totalDuration = timelineEnd.getTime() - timelineStart.getTime();
                const todayPosition = (today.getTime() - timelineStart.getTime()) / totalDuration * 100;
                
                return (
                  <div style={{
                    position: 'absolute',
                    left: `${todayPosition}%`,
                    top: 0,
                    bottom: 0,
                    width: '2px',
                    background: '#ef4444',
                    zIndex: 10
                  }}>
                    <div style={{
                      position: 'absolute',
                      top: '-20px',
                      left: '-30px',
                      background: '#ef4444',
                      color: 'white',
                      padding: '2px 6px',
                      borderRadius: '3px',
                      fontSize: '0.75rem',
                      fontWeight: '500'
                    }}>
                      Aujourd'hui
                    </div>
                  </div>
                );
              }
              return null;
            })()}
          </div>

          {/* Tâches */}
          {taches.map((tache, index) => {
            const position = getTaskPosition(tache);
            const isOverdue = new Date(tache.dateFin) < new Date() && tache.statut !== 'TERMINE';
            
            return (
              <div key={tache.id} style={{
                display: 'grid',
                gridTemplateColumns: '300px 1fr',
                minHeight: '60px',
                borderBottom: '1px solid #f1f5f9',
                position: 'relative',
                zIndex: 2
              }}>
                {/* Info tâche */}
                <div style={{
                  padding: '0.75rem',
                  borderRight: '1px solid #e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem'
                }}>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: getPriorityColor(tache.priorite),
                    flexShrink: 0
                  }} />
                  
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontWeight: '500',
                      color: '#1e293b',
                      fontSize: '0.875rem',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {tache.nom}
                    </div>
                    <div style={{
                      fontSize: '0.75rem',
                      color: '#64748b',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      marginTop: '0.25rem'
                    }}>
                      <span>{tache.corpsEtat}</span>
                      <span>•</span>
                      <span>{tache.dureeJours}j</span>
                      {tache.avancement !== undefined && (
                        <>
                          <span>•</span>
                          <span>{tache.avancement}%</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Barre de tâche */}
                <div style={{
                  position: 'relative',
                  padding: '1rem 0',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  <div
                    onClick={() => onTacheClick?.(tache)}
                    style={{
                      position: 'absolute',
                      left: position.left,
                      width: position.width,
                      height: '24px',
                      background: isOverdue ? '#fecaca' : getStatusColor(tache.statut),
                      borderRadius: '4px',
                      cursor: readOnly ? 'default' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                      transition: 'all 0.2s ease',
                      overflow: 'hidden'
                    }}
                    onMouseEnter={(e) => {
                      if (!readOnly) {
                        e.currentTarget.style.transform = 'translateY(-1px)';
                        e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
                      }
                    }}
                    onMouseLeave={(e
) => {
                     if (!readOnly) {
                       e.currentTarget.style.transform = 'translateY(0)';
                       e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                     }
                   }}
                 >
                   {/* Barre de progression */}
                   {tache.avancement > 0 && (
                     <div style={{
                       position: 'absolute',
                       left: 0,
                       top: 0,
                       bottom: 0,
                       width: `${tache.avancement}%`,
                       background: 'linear-gradient(90deg, rgba(255,255,255,0.3), rgba(255,255,255,0.1))',
                       borderRadius: '4px 0 0 4px'
                     }} />
                   )}
                   
                   {/* Texte de la tâche */}
                   <div style={{
                     position: 'relative',
                     padding: '0 8px',
                     color: isOverdue ? '#7f1d1d' : 'white',
                     fontSize: '0.75rem',
                     fontWeight: '500',
                     overflow: 'hidden',
                     textOverflow: 'ellipsis',
                     whiteSpace: 'nowrap',
                     width: '100%'
                   }}>
                     {tache.nom}
                   </div>

                   {/* Indicateur de retard */}
                   {isOverdue && (
                     <div style={{
                       position: 'absolute',
                       right: '4px',
                       top: '50%',
                       transform: 'translateY(-50%)',
                       fontSize: '0.75rem'
                     }}>
                       ⚠️
                     </div>
                   )}
                 </div>

                 {/* Points de redimensionnement */}
                 {!readOnly && (
                   <>
                     <div
                       style={{
                         position: 'absolute',
                         left: position.left,
                         width: '6px',
                         height: '24px',
                         cursor: 'ew-resize',
                         background: 'transparent'
                       }}
                       onMouseDown={(e) => {
                         e.stopPropagation();
                         setResizingTask(tache.id);
                       }}
                     />
                     <div
                       style={{
                         position: 'absolute',
                         left: `calc(${position.left} + ${position.width} - 6px)`,
                         width: '6px',
                         height: '24px',
                         cursor: 'ew-resize',
                         background: 'transparent'
                       }}
                       onMouseDown={(e) => {
                         e.stopPropagation();
                         setResizingTask(tache.id);
                       }}
                     />
                   </>
                 )}
               </div>
             </div>
           );
         })}

         {/* Lignes de dépendance */}
         <svg
           style={{
             position: 'absolute',
             top: 0,
             left: '300px',
             width: 'calc(100% - 300px)',
             height: `${taches.length * 60}px`,
             pointerEvents: 'none',
             zIndex: 3
           }}
         >
           <defs>
             <marker
               id="arrowhead"
               markerWidth="10"
               markerHeight="7"
               refX="9"
               refY="3.5"
               orient="auto"
             >
               <polygon
                 points="0 0, 10 3.5, 0 7"
                 fill="#64748b"
               />
             </marker>
           </defs>
           {getDependencyLines()}
         </svg>
       </div>
     </div>

     {/* Légende */}
     <div style={{
       padding: '1rem',
       background: '#f8fafc',
       borderTop: '1px solid #e2e8f0',
       display: 'flex',
       justifyContent: 'space-between',
       alignItems: 'center',
       flexWrap: 'wrap',
       gap: '1rem'
     }}>
       <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
         <span style={{ fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>
           Statuts:
         </span>
         {[
           { key: 'EN_ATTENTE', label: 'En attente', color: '#94a3b8' },
           { key: 'EN_COURS', label: 'En cours', color: '#3b82f6' },
           { key: 'TERMINE', label: 'Terminé', color: '#10b981' },
           { key: 'EN_RETARD', label: 'En retard', color: '#ef4444' }
         ].map(({ key, label, color }) => (
           <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
             <div style={{
               width: '12px',
               height: '12px',
               background: color,
               borderRadius: '2px'
             }} />
             <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{label}</span>
           </div>
         ))}
       </div>

       <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
         <span style={{ fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>
           Priorités:
         </span>
         {[
           { key: 'BASSE', label: 'Basse', color: '#10b981' },
           { key: 'MOYENNE', label: 'Moyenne', color: '#f59e0b' },
           { key: 'HAUTE', label: 'Haute', color: '#ef4444' }
         ].map(({ key, label, color }) => (
           <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
             <div style={{
               width: '8px',
               height: '8px',
               background: color,
               borderRadius: '50%'
             }} />
             <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{label}</span>
           </div>
         ))}
       </div>
     </div>
   </div>
 );
}
