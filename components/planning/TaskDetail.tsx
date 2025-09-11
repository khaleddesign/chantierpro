'use client';

import { useState } from 'react';

interface TaskDetailProps {
  task: any;
  onUpdate: (taskId: string, updates: any) => void;
  onClose: () => void;
  readOnly?: boolean;
}

export default function TaskDetail({ task, onUpdate, onClose, readOnly = false }: TaskDetailProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'progress' | 'history'>('details');
  const [avancement, setAvancement] = useState(task.avancement || 0);
  const [commentaire, setCommentaire] = useState('');

  const updateAvancement = async () => {
    try {
      await onUpdate(task.id, { avancement });
      alert('Avancement mis à jour avec succès');
    } catch (error) {
      alert('Erreur lors de la mise à jour');
    }
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

  const getPriorityLabel = (priorite: string) => {
    const labels = {
      'BASSE': '🟢 Basse',
      'MOYENNE': '🟡 Moyenne',
      'HAUTE': '🟠 Haute',
      'CRITIQUE': '🔴 Critique'
    };
    return labels[priorite as keyof typeof labels] || priorite;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const isOverdue = new Date(task.dateFin) < new Date() && task.statut !== 'TERMINE';
  const remainingDays = Math.ceil((new Date(task.dateFin).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

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
        maxWidth: '900px',
        maxHeight: '90vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* En-tête */}
        <div style={{
          padding: '1.5rem',
          borderBottom: '1px solid #e2e8f0',
          background: isOverdue ? '#fef2f2' : '#f8fafc'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '1rem'
          }}>
            <div style={{ flex: 1 }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                marginBottom: '0.5rem'
              }}>
                <div style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: getPriorityColor(task.priorite)
                }} />
                <h2 style={{
                  margin: 0,
                  color: isOverdue ? '#dc2626' : '#1e293b',
                  fontSize: '1.5rem'
                }}>
                  {task.nom}
                  {isOverdue && <span style={{ marginLeft: '0.5rem' }}>⚠️</span>}
                </h2>
              </div>
              
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                fontSize: '0.875rem',
                color: '#64748b'
              }}>
                <span>{getPriorityLabel(task.priorite)}</span>
                <span>•</span>
                <span>🔧 {task.corpsEtat}</span>
                <span>•</span>
                <span>⏱️ {task.dureeJours} jour{task.dureeJours > 1 ? 's' : ''}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <div style={{
                background: getStatusColor(task.statut),
                color: 'white',
                padding: '0.5rem 1rem',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: '500'
              }}>
                {task.statut.replace('_', ' ')}
              </div>
              
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
          </div>

          {/* Alertes */}
          {isOverdue && (
            <div style={{
              background: '#fecaca',
              border: '1px solid #f87171',
              borderRadius: '0.5rem',
              padding: '0.75rem',
              fontSize: '0.875rem',
              color: '#7f1d1d'
            }}>
              ⚠️ <strong>Tâche en retard</strong> - Échéance dépassée de {Math.abs(remainingDays)} jour{Math.abs(remainingDays) > 1 ? 's' : ''}
            </div>
          )}

          {!isOverdue && remainingDays <= 3 && remainingDays > 0 && (
            <div style={{
              background: '#fef3c7',
              border: '1px solid #f59e0b',
              borderRadius: '0.5rem',
              padding: '0.75rem',
              fontSize: '0.875rem',
              color: '#92400e'
            }}>
              ⏰ <strong>Échéance proche</strong> - {remainingDays} jour{remainingDays > 1 ? 's' : ''} restant{remainingDays > 1 ? 's' : ''}
            </div>
          )}
        </div>

        {/* Navigation onglets */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid #e2e8f0'
        }}>
          {[
            { key: 'details', label: '📋 Détails', icon: '📋' },
            { key: 'progress', label: '📊 Progression', icon: '📊' },
            { key: 'history', label: '📝 Historique', icon: '📝' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              style={{
                padding: '1rem 1.5rem',
                border: 'none',
                background: 'transparent',
                color: activeTab === tab.key ? '#3b82f6' : '#64748b',
                borderBottom: activeTab === tab.key ? '2px solid #3b82f6' : '2px solid transparent',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Contenu scrollable */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: '1.5rem'
        }}>
          {activeTab === 'details' && (
            <div style={{ display: 'grid', gap: '2rem' }}>
              {/* Informations principales */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '1.5rem'
              }}>
                <div>
                  <h4 style={{ margin: '0 0 1rem 0', color: '#374151' }}>
                    📅 Planification
                  </h4>
                  <div style={{ display: 'grid', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b' }}>Début:</span>
                      <span style={{ fontWeight: '500' }}>{formatDate(task.dateDebut)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b' }}>Fin:</span>
                      <span style={{ fontWeight: '500' }}>{formatDate(task.dateFin)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b' }}>Durée:</span>
                      <span style={{ fontWeight: '500' }}>{task.dureeJours} jour{task.dureeJours > 1 ? 's' : ''}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 style={{ margin: '0 0 1rem 0', color: '#374151' }}>
                    📊 Avancement
                  </h4>
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '0.5rem'
                    }}>
                      <span style={{ color: '#64748b' }}>Progression</span>
                      <span style={{ fontWeight: '600', fontSize: '1.125rem' }}>
                        {task.avancement || 0}%
                      </span>
                    </div>
                    <div style={{
                      width: '100%',
                      height: '8px',
                      background: '#e5e7eb',
                      borderRadius: '4px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${task.avancement || 0}%`,
                        height: '100%',
                        background: getStatusColor(task.statut),
                        borderRadius: '4px',
                        transition: 'width 0.5s ease'
                      }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              {task.description && (
                <div>
                  <h4 style={{ margin: '0 0 1rem 0', color: '#374151' }}>
                    📝 Description
                  </h4>
                  <div style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '0.5rem',
                    padding: '1rem',
                    fontSize: '0.875rem',
                    lineHeight: '1.5',
                    color: '#374151'
                  }}>
                    {task.description}
                  </div>
                </div>
              )}

              {/* Dépendances */}
              {task.dependances && task.dependances.length > 0 && (
                <div>
                  <h4 style={{ margin: '0 0 1rem 0', color: '#374151' }}>
                    🔗 Dépendances
                  </h4>
                  <div style={{
                    background: '#fef3c7',
                    border: '1px solid #f59e0b',
                    borderRadius: '0.5rem',
                    padding: '1rem'
                  }}>
                    <div style={{ fontSize: '0.875rem', color: '#92400e' }}>
                      Cette tâche dépend de {task.dependances.length} autre{task.dependances.length > 1 ? 's' : ''} tâche{task.dependances.length > 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
              )}

              {/* Assignations */} {task.assignations && task.assignations.length > 0 && (
               <div>
                 <h4 style={{ margin: '0 0 1rem 0', color: '#374151' }}>
                   👥 Assignations
                 </h4>
                 <div style={{ display: 'grid', gap: '0.5rem' }}>
                   {task.assignations.map((assignation: any, index: number) => (
                     <div key={index} style={{
                       display: 'flex',
                       alignItems: 'center',
                       gap: '0.75rem',
                       padding: '0.75rem',
                       background: '#f0f9ff',
                       border: '1px solid #0ea5e9',
                       borderRadius: '0.5rem'
                     }}>
                       <div style={{
                         width: '2.5rem',
                         height: '2.5rem',
                         borderRadius: '50%',
                         background: '#3b82f6',
                         display: 'flex',
                         alignItems: 'center',
                         justifyContent: 'center',
                         color: 'white',
                         fontSize: '0.875rem',
                         fontWeight: '600'
                       }}>
                         {assignation.user?.name?.split(' ').map((n: string) => n[0]).join('') || '?'}
                       </div>
                       <div style={{ flex: 1 }}>
                         <div style={{
                           fontWeight: '500',
                           color: '#0369a1',
                           fontSize: '0.875rem'
                         }}>
                           {assignation.user?.name || 'Utilisateur inconnu'}
                         </div>
                         <div style={{
                           fontSize: '0.75rem',
                           color: '#0369a1',
                           opacity: 0.8
                         }}>
                           {assignation.user?.email || ''}
                         </div>
                       </div>
                     </div>
                   ))}
                 </div>
               </div>
             )}
           </div>
         )}

         {activeTab === 'progress' && (
           <div style={{ display: 'grid', gap: '2rem' }}>
             {/* Mise à jour de l'avancement */}
             {!readOnly && (
               <div style={{
                 background: '#f0f9ff',
                 border: '1px solid #0ea5e9',
                 borderRadius: '0.75rem',
                 padding: '1.5rem'
               }}>
                 <h4 style={{ margin: '0 0 1rem 0', color: '#0369a1' }}>
                   📊 Mettre à jour l'avancement
                 </h4>
                 
                 <div style={{ marginBottom: '1rem' }}>
                   <div style={{
                     display: 'flex',
                     justifyContent: 'space-between',
                     alignItems: 'center',
                     marginBottom: '0.5rem'
                   }}>
                     <label style={{ fontWeight: '500', color: '#0369a1' }}>
                       Pourcentage d'avancement
                     </label>
                     <span style={{
                       fontSize: '1.25rem',
                       fontWeight: 'bold',
                       color: '#0369a1'
                     }}>
                       {avancement}%
                     </span>
                   </div>
                   
                   <input
                     type="range"
                     min="0"
                     max="100"
                     value={avancement}
                     onChange={(e) => setAvancement(parseInt(e.target.value))}
                     style={{ width: '100%', marginBottom: '1rem' }}
                   />
                   
                   <div style={{
                     display: 'flex',
                     justifyContent: 'space-between',
                     fontSize: '0.75rem',
                     color: '#64748b'
                   }}>
                     <span>0%</span>
                     <span>25%</span>
                     <span>50%</span>
                     <span>75%</span>
                     <span>100%</span>
                   </div>
                 </div>

                 <div style={{ marginBottom: '1rem' }}>
                   <label style={{
                     display: 'block',
                     marginBottom: '0.5rem',
                     fontWeight: '500',
                     color: '#0369a1'
                   }}>
                     Commentaire (optionnel)
                   </label>
                   <textarea
                     value={commentaire}
                     onChange={(e) => setCommentaire(e.target.value)}
                     placeholder="Ajoutez un commentaire sur l'avancement..."
                     rows={3}
                     style={{
                       width: '100%',
                       padding: '0.75rem',
                       border: '1px solid #0ea5e9',
                       borderRadius: '0.5rem',
                       resize: 'vertical'
                     }}
                   />
                 </div>

                 <button
                   onClick={updateAvancement}
                   className="btn-primary"
                   disabled={avancement === (task.avancement || 0)}
                   style={{
                     opacity: avancement === (task.avancement || 0) ? 0.5 : 1,
                     cursor: avancement === (task.avancement || 0) ? 'not-allowed' : 'pointer'
                   }}
                 >
                   💾 Mettre à jour ({avancement}%)
                 </button>
               </div>
             )}

             {/* Graphique de progression */}
             <div style={{
               background: '#f8fafc',
               border: '1px solid #e2e8f0',
               borderRadius: '0.75rem',
               padding: '1.5rem'
             }}>
               <h4 style={{ margin: '0 0 1rem 0', color: '#374151' }}>
                 📈 Évolution de l'avancement
               </h4>
               
               <div style={{ textAlign: 'center', padding: '2rem' }}>
                 <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📊</div>
                 <div style={{ color: '#64748b', fontSize: '0.875rem' }}>
                   Graphique d'évolution en cours de développement
                 </div>
                 <div style={{
                   marginTop: '1rem',
                   padding: '1rem',
                   background: '#ecfdf5',
                   border: '1px solid #10b981',
                   borderRadius: '0.5rem',
                   fontSize: '0.875rem',
                   color: '#065f46'
                 }}>
                   Actuellement : {task.avancement || 0}% completé<br/>
                   {avancement !== (task.avancement || 0) && (
                     <>Nouveau : {avancement}% (+{avancement - (task.avancement || 0)}%)</>
                   )}
                 </div>
               </div>
             </div>

             {/* Jalons */}
             <div style={{
               background: '#fffbeb',
               border: '1px solid #f59e0b',
               borderRadius: '0.75rem',
               padding: '1.5rem'
             }}>
               <h4 style={{ margin: '0 0 1rem 0', color: '#d97706' }}>
                 🎯 Jalons de progression
               </h4>
               
               <div style={{ display: 'grid', gap: '0.75rem' }}>
                 {[
                   { seuil: 0, label: 'Démarrage', icon: '🚀', completed: (task.avancement || 0) >= 0 },
                   { seuil: 25, label: 'Premier quart', icon: '🌱', completed: (task.avancement || 0) >= 25 },
                   { seuil: 50, label: 'Mi-parcours', icon: '⚡', completed: (task.avancement || 0) >= 50 },
                   { seuil: 75, label: 'Trois quarts', icon: '🔥', completed: (task.avancement || 0) >= 75 },
                   { seuil: 100, label: 'Terminé', icon: '🎉', completed: (task.avancement || 0) >= 100 }
                 ].map((jalon) => (
                   <div key={jalon.seuil} style={{
                     display: 'flex',
                     alignItems: 'center',
                     gap: '0.75rem',
                     padding: '0.75rem',
                     borderRadius: '0.5rem',
                     background: jalon.completed ? '#ecfdf5' : '#f9fafb',
                     border: jalon.completed ? '1px solid #10b981' : '1px solid #e5e7eb'
                   }}>
                     <div style={{
                       fontSize: '1.25rem',
                       opacity: jalon.completed ? 1 : 0.5
                     }}>
                       {jalon.completed ? '✅' : jalon.icon}
                     </div>
                     <div style={{ flex: 1 }}>
                       <div style={{
                         fontWeight: '500',
                         color: jalon.completed ? '#059669' : '#64748b',
                         fontSize: '0.875rem'
                       }}>
                         {jalon.label}
                       </div>
                     </div>
                     <div style={{
                       fontSize: '0.75rem',
                       color: jalon.completed ? '#059669' : '#9ca3af',
                       fontWeight: '600'
                     }}>
                       {jalon.seuil}%
                     </div>
                   </div>
                 ))}
               </div>
             </div>
           </div>
         )}

         {activeTab === 'history' && (
           <div style={{ display: 'grid', gap: '2rem' }}>
             {/* Timeline factice */}
             <div style={{
               background: '#f8fafc',
               border: '1px solid #e2e8f0',
               borderRadius: '0.75rem',
               padding: '1.5rem'
             }}>
               <h4 style={{ margin: '0 0 1rem 0', color: '#374151' }}>
                 📝 Historique des modifications
               </h4>
               
               <div style={{ position: 'relative' }}>
                 {/* Ligne de timeline */}
                 <div style={{
                   position: 'absolute',
                   left: '1rem',
                   top: '0.5rem',
                   bottom: '0.5rem',
                   width: '2px',
                   background: '#e2e8f0'
                 }} />
                 
                 {/* Événements simulés */}
                 {[
                   {
                     date: new Date().toISOString(),
                     type: 'creation',
                     description: 'Tâche créée',
                     user: 'Jean Dupont'
                   },
                   {
                     date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                     type: 'update',
                     description: 'Avancement mis à jour (0% → 30%)',
                     user: 'Marie Martin'
                   },
                   {
                     date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
                     type: 'assignment',
                     description: 'Assigné à Marie Martin',
                     user: 'Jean Dupont'
                   }
                 ].map((event, index) => (
                   <div key={index} style={{
                     position: 'relative',
                     paddingLeft: '3rem',
                     paddingBottom: index < 2 ? '1.5rem' : '0'
                   }}>
                     {/* Icône de l'événement */}
                     <div style={{
                       position: 'absolute',
                       left: '0.5rem',
                       top: '0',
                       width: '2rem',
                       height: '2rem',
                       borderRadius: '50%',
                       background: event.type === 'creation' ? '#10b981' : 
                                  event.type === 'update' ? '#3b82f6' : '#f59e0b',
                       display: 'flex',
                       alignItems: 'center',
                       justifyContent: 'center',
                       fontSize: '0.875rem',
                       zIndex: 1
                     }}>
                       {event.type === 'creation' ? '🚀' : 
                        event.type === 'update' ? '📊' : '👥'}
                     </div>
                     
                     {/* Contenu de l'événement */}
                     <div style={{
                       background: 'white',
                       padding: '0.75rem',
                       borderRadius: '0.5rem',
                       border: '1px solid #e2e8f0'
                     }}>
                       <div style={{
                         fontSize: '0.875rem',
                         fontWeight: '500',
                         color: '#1e293b',
                         marginBottom: '0.25rem'
                       }}>
                         {event.description}
                       </div>
                       <div style={{
                         fontSize: '0.75rem',
                         color: '#64748b'
                       }}>
                         Par {event.user} • {new Date(event.date).toLocaleDateString('fr-FR')} à {new Date(event.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                       </div>
                     </div>
                   </div>
                 ))}
               </div>
             </div>

             {/* Commentaires */}
             <div style={{
               background: '#f0f9ff',
               border: '1px solid #0ea5e9',
               borderRadius: '0.75rem',
               padding: '1.5rem'
             }}>
               <h4 style={{ margin: '0 0 1rem 0', color: '#0369a1' }}>
                 💬 Commentaires
               </h4>
               
               <div style={{
                 textAlign: 'center',
                 padding: '2rem',
                 color: '#64748b'
               }}>
                 <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💬</div>
                 <p>Fonctionnalité de commentaires en cours de développement</p>
                 <p style={{ fontSize: '0.875rem' }}>
                   Les utilisateurs pourront bientôt ajouter des commentaires et discuter sur les tâches.
                 </p>
               </div>
             </div>
           </div>
         )}
       </div>

       {/* Actions en bas */}
       {!readOnly && (
         <div style={{
           padding: '1rem 1.5rem',
           borderTop: '1px solid #e2e8f0',
           background: '#f8fafc',
           display: 'flex',
           justifyContent: 'space-between',
           alignItems: 'center'
         }}>
           <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
             Dernière modification : {new Date().toLocaleDateString('fr-FR')}
           </div>
           
           <div style={{ display: 'flex', gap: '0.5rem' }}>
             <button
               onClick={() => onUpdate(task.id, { statut: task.statut === 'SUSPENDU' ? 'EN_COURS' : 'SUSPENDU' })}
               style={{
                 padding: '0.5rem 1rem',
                 border: '1px solid #d1d5db',
                 borderRadius: '0.5rem',
                 background: 'white',
                 color: '#374151',
                 cursor: 'pointer',
                 fontSize: '0.875rem'
               }}
             >
               {task.statut === 'SUSPENDU' ? '▶️ Reprendre' : '⏸️ Suspendre'}
             </button>
             
             {task.statut !== 'TERMINE' && (
               <button
                 onClick={() => onUpdate(task.id, { statut: 'TERMINE', avancement: 100 })}
                 style={{
                   padding: '0.5rem 1rem',
                   border: '1px solid #10b981',
                   borderRadius: '0.5rem',
                   background: '#ecfdf5',
                   color: '#059669',
                   cursor: 'pointer',
                   fontSize: '0.875rem',
                   fontWeight: '500'
                 }}
               >
                 ✅ Marquer terminé
               </button>
             )}
           </div>
         </div>
       )}
     </div>
   </div>
 );
}
