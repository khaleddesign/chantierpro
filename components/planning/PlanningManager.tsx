'use client';

import { useState, useEffect } from 'react';
import GanttChart from './GanttChart';
import TaskForm from './TaskForm';
import TaskDetail from './TaskDetail';

interface PlanningManagerProps {
  projetId: string;
  readOnly?: boolean;
}

export default function PlanningManager({ projetId, readOnly = false }: PlanningManagerProps) {
  const [planning, setPlanning] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'gantt' | 'liste' | 'calendrier'>('gantt');

  useEffect(() => {
    fetchPlanning();
  }, [projetId]);

  const fetchPlanning = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/projets/${projetId}/planning`);
      const data = await response.json();
      
      if (response.ok) {
        setPlanning(data);
      }
    } catch (error) {
      console.error('Erreur chargement planning:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTaskUpdate = async (taskId: string, updates: any) => {
    try {
      const response = await fetch(`/api/taches/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      if (response.ok) {
        await fetchPlanning();
        alert('Tâche mise à jour avec succès');
      } else {
        const error = await response.json();
        alert(error.error || 'Erreur lors de la mise à jour');
      }
    } catch (error) {
      console.error('Erreur mise à jour tâche:', error);
      alert('Erreur lors de la mise à jour');
    }
  };

  const handleTaskCreate = async (taskData: any) => {
    try {
      const response = await fetch(`/api/projets/${projetId}/planning`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData)
      });

      if (response.ok) {
        await fetchPlanning();
        setShowTaskForm(false);
        alert('Tâche créée avec succès');
      } else {
        const error = await response.json();
        alert(error.error || 'Erreur lors de la création');
      }
    } catch (error) {
      console.error('Erreur création tâche:', error);
      alert('Erreur lors de la création');
    }
  };

  const getDelayedTasks = () => {
    if (!planning?.projet?.taches) return [];
    return planning.projet.taches.filter((t: any) => 
      new Date(t.dateFin) < new Date() && t.statut !== 'TERMINE'
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📅</div>
        <div style={{ color: '#64748b' }}>Chargement du planning...</div>
      </div>
    );
  }

  if (!planning) {
    return (
      <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>❌</div>
        <div style={{ color: '#ef4444' }}>Erreur de chargement du planning</div>
      </div>
    );
  }

  const delayedTasks = getDelayedTasks();

  return (
    <div style={{ display: 'grid', gap: '1.5rem' }}>
      {/* En-tête */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <h2 style={{ margin: '0 0 0.5rem 0', color: '#1e293b' }}>
            📅 Planning - {planning.projet.nom}
          </h2>
          <div style={{ color: '#64748b', fontSize: '0.875rem' }}>
            {formatDate(planning.projet.dateDebut)} → {formatDate(planning.projet.dateFin)}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {/* Sélecteur de vue */}
          <div style={{ display: 'flex', gap: '0.25rem' }}>
            {[
              { key: 'gantt', label: '📊 Gantt', icon: '📊' },
              { key: 'liste', label: '📋 Liste', icon: '📋' },
              { key: 'calendrier', label: '📅 Calendrier', icon: '📅' }
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setViewMode(key as any)}
                style={{
                  padding: '0.5rem 1rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  background: viewMode === key ? '#3b82f6' : 'white',
                  color: viewMode === key ? 'white' : '#374151',
                  cursor: 'pointer',
                  fontSize: '0.875rem'
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {!readOnly && (
            <button
              onClick={() => setShowTaskForm(true)}
              className="btn-primary"
            >
              ➕ Nouvelle Tâche
            </button>
          )}
        </div>
      </div>

      {/* Statistiques rapides */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem'
      }}>
        <div className="card" style={{
          padding: '1.5rem',
          textAlign: 'center',
          background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)'
        }}>
          <div style={{ fontSize: '2rem', color: 'white', marginBottom: '0.5rem' }}>
            {planning.stats.totalTaches}
          </div>
          <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.875rem' }}>
            Tâches Total
          </div>
        </div>

        <div className="card" style={{
          padding: '1.5rem',
          textAlign: 'center',
          background: 'linear-gradient(135deg, #10b981, #059669)'
        }}>
          <div style={{ fontSize: '2rem', color: 'white', marginBottom: '0.5rem' }}>
            {planning.stats.tachesTerminees}
          </div>
          <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.875rem' }}>
            Terminées
          </div>
        </div>

        <div className="card" style={{
          padding: '1.5rem',
          textAlign: 'center',
          background: 'linear-gradient(135deg, #f59e0b, #d97706)'
        }}>
          <div style={{ fontSize: '2rem', color: 'white', marginBottom: '0.5rem' }}>
            {planning.stats.tachesEnCours}
          </div>
          <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.875rem' }}>
            En Cours
          </div>
        </div>

        <div className="card" style={{
          padding: '1.5rem',
          textAlign: 'center',
          background: delayedTasks.length > 0 ? 
            'linear-gradient(135deg, #ef4444, #dc2626)' : 
            'linear-gradient(135deg, #64748b, #475569)'
        }}>
          <div style={{ fontSize: '2rem', color: 'white', marginBottom: '0.5rem' }}>
            {delayedTasks.length}
          </div>
          <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.875rem' }}>
            En Retard
          </div>
        </div>
      </div>

      {/* Alertes de retard */}
      {delayedTasks.length > 0 && (
        <div className="card" style={{
          padding: '1rem',
          background: '#fef2f2',
          border: '1px solid #fecaca'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '0.75rem'
          }}>
            <span style={{ fontSize: '1.25rem' }}>⚠️</span>
            <span style={{ fontWeight: '600', color: '#dc2626' }}>
              {delayedTasks.length} tâche{delayedTasks.length > 1 ? 's' : ''} en retard
            </span>
          </div>
          <div style={{ fontSize: '0.875rem', color: '#7f1d1d' }}>
            {delayedTasks.slice(0, 3).map((task: any, index: number) => (
              <div key={task.id}>
                • {task.nom} (fin prévue: {formatDate(task.dateFin)})
              </div>
            ))}
            {delayedTasks.length > 3 && (
              <div>+ {delayedTasks.length - 3} autre{delayedTasks.length - 3 > 1 ? 's' : ''}...</div>
            )}
          </div>
        </div>
      )}

      {/* Vue principale */}
      <div className="card">
        {viewMode === 'gantt' && (
          <GanttChart
            taches={planning.projet.taches || []}
            onTacheClick={setSelectedTask}
            onTacheUpdate={handleTaskUpdate}
            readOnly={readOnly}
          />
        )}

        {viewMode === 'liste' && (
          <TaskListView
            taches={planning.projet.taches || []}
            onTaskClick={setSelectedTask}
            onTaskUpdate={handleTaskUpdate}
            readOnly={readOnly}
          />
        )}

        {viewMode === 'calendrier' && (
          <CalendarView
            taches={planning.projet.taches || []}
            onTaskClick={setSelectedTask}
            readOnly={readOnly}
          />
        )}
      </div>

      {/* Modal formulaire tâche */}
      {showTaskForm && (
        <TaskForm
          projetId={projetId}
          taches={planning.projet.taches || []}
          onSubmit={handleTaskCreate}
          onClose={() => setShowTaskForm(false)}
        />
      )}

      {/* Modal détail tâche */}
      {selectedTask && (
        <TaskDetail
          task={selectedTask}
          onUpdate={handleTaskUpdate}
          onClose={() => setSelectedTask(null)}
          readOnly={readOnly}
        />
      )}
    </div>
  );
}

// Composant Vue Liste des Tâches
function TaskListView({ 
  taches, 
  onTaskClick, 
  onTaskUpdate, 
  readOnly 
}: {
  taches: any[];
  onTaskClick: (task: any) => void;
  onTaskUpdate: (taskId: string, updates: any) => void;
  readOnly: boolean;
}) {
  const [sortBy, setSortBy] = useState<'nom' | 'dateDebut' | 'statut' | 'priorite'>('dateDebut');
  const [filterStatus, setFilterStatus] = useState<string>('TOUS');

  const getStatusColor = (statut: string) => {
    const colors = {
      'EN_ATTENTE': '#94a3b8',
      'EN_COURS': '#3b82f6',
      'TERMINE': '#10b981',
      'EN_RETARD': '#ef4444'
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

  const sortedAndFilteredTasks = taches
    .filter(t => filterStatus === 'TOUS' || t.statut === filterStatus)
    .sort((a, b) => {
      switch (sortBy) {
        case 'nom':
          return a.nom.localeCompare(b.nom);
        case 'dateDebut':
          return new Date(a.dateDebut).getTime() - new Date(b.dateDebut).getTime();
        case 'statut':
          return a.statut.localeCompare(b.statut);
        case 'priorite':
          const priorityOrder = { 'CRITIQUE': 4, 'HAUTE': 3, 'MOYENNE': 2, 'BASSE': 1 };
          return (priorityOrder[b.priorite as keyof typeof priorityOrder] || 0) - 
                 (priorityOrder[a.priorite as keyof typeof priorityOrder] || 0);
        default:
          return 0;
      }
    });

  return (
    <div style={{ padding: '1.5rem' }}>
      {/* Filtres et tri */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.5rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            style={{
              padding: '0.5rem',
              border: '1px solid #d1d5db',
              borderRadius: '0.5rem',
              fontSize: '0.875rem'
            }}
          >
            <option value="dateDebut">Trier par date</option>
            <option value="nom">Trier par nom</option>
            <option value="statut">Trier par statut</option>
            <option value="priorite">Trier par priorité</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{
              padding: '0.5rem',
              border: '1px solid #d1d5db',
              borderRadius: '0.5rem',
              fontSize: '0.875rem'
            }}
          >
            <option value="TOUS">Tous les statuts</option>
            <option value="EN_ATTENTE">En attente</option>
            <option value="EN_COURS">En cours</option>
            <option value="TERMINE">Terminé</option>
          </select>
        </div>

        <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
          {sortedAndFilteredTasks.length} tâche{sortedAndFilteredTasks.length > 1 ? 's' : ''}
        </div>
      </div>

      {/* Liste des tâches */}
      <div style={{ display: 'grid', gap: '1rem' }}>
        {sortedAndFilteredTasks.map((tache) => {
          const isOverdue = new Date(tache.dateFin) < new Date() && tache.statut !== 'TERMINE';
          
          return (
            <div
              key={tache.id}
              onClick={() => onTaskClick(tache)}
              style={{
                padding: '1.5rem',
                border: '1px solid #e2e8f0',
                borderRadius: '0.75rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                background: isOverdue ? '#fef2f2' : 'white'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
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
                      background: getPriorityColor(tache.priorite)
                    }} />
                    
                    <h4 style={{
                      margin: 0,
                      color: isOverdue ? '#dc2626' : '#1e293b',
                      fontSize: '1.125rem',
                      fontWeight: '600'
                    }}>
                      {tache.nom}
                      {isOverdue && <span style={{ marginLeft: '0.5rem' }}>⚠️</span>}
                    </h4>
                  </div>

                  <p style={{
                    margin: '0 0 0.75rem 0',
                    color: '#64748b',
                    fontSize: '0.875rem',
                    lineHeight: '1.4'
                  }}>
                    {tache.description}
                  </p>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    fontSize: '0.875rem',
                    color: '#64748b'
                  }}>
                    <span>📅 {new Date(tache.dateDebut).toLocaleDateString('fr-FR')} → {new Date(tache.dateFin).toLocaleDateString('fr-FR')}</span>
                    <span>⏱️ {tache.dureeJours} jour{tache.dureeJours > 1 ? 's' : ''}</span>
                    <span>🔧 {tache.corpsEtat}</span>
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-end',
                  gap: '0.5rem'
                }}>
                  <div style={{
                    background: getStatusColor(tache.statut),
                    color: 'white',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '1rem',
                    fontSize: '0.75rem',
                    fontWeight: '500'
                  }}>
                    {tache.statut.replace('_', ' ')}
                  </div>

                  {tache.avancement !== undefined && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      <div style={{
                        width: '60px',
                        height: '6px',
                        background: '#e5e7eb',
                        borderRadius: '3px',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          width: `${tache.avancement}%`,
                          height: '100%',
                          background: getStatusColor(tache.statut),
                          borderRadius: '3px'
                        }} />
                      </div>
                      <span style={{
                        fontSize: '0.75rem',
                        color: '#64748b',
                        fontWeight: '500'
                      }}>
                        {tache.avancement}%
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {sortedAndFilteredTasks.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '3rem',
          color: '#64748b'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
          <p>Aucune tâche ne correspond aux filtres sélectionnés</p>
        </div>
      )}
    </div>
  );
}

// Composant Vue Calendrier (simplifié)
function CalendarView({ 
  taches, 
  onTaskClick, 
  readOnly 
}: {
  taches: any[];
  onTaskClick: (task: any) => void;
  readOnly: boolean;
}) {
  return (
    <div style={{ padding: '1.5rem', textAlign: 'center' }}>
      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📅</div>
      <h3 style={{ color: '#1e293b', marginBottom: '0.5rem' }}>
        Vue Calendrier
      </h3>
      <p style={{ color: '#64748b' }}>
        Fonctionnalité en cours de développement
      </p>
      <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
        Cette vue affichera un calendrier mensuel avec les tâches positionnées sur leurs dates respectives.
      </p>
    </div>
  );
}
