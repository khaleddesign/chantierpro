'use client';

interface ProgressionTrackerProps {
  totalInitial: number;
  situations: any[];
  avancementGlobal: number;
}

export default function ProgressionTracker({
  totalInitial,
  situations,
  avancementGlobal
}: ProgressionTrackerProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const totalFacture = situations.reduce((sum, sit) => sum + (sit.totalTTC || 0), 0);
  const pourcentageFacture = totalInitial > 0 ? (totalFacture / totalInitial) * 100 : 0;

  return (
    <div style={{
      background: '#f0f9ff',
      border: '1px solid #0ea5e9',
      borderRadius: '0.75rem',
      padding: '1.5rem'
    }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '1.5rem'
      }}>
        {/* Avancement physique */}
        <div>
          <h4 style={{
            margin: '0 0 1rem 0',
            color: '#0369a1',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            🔨 Avancement Physique
          </h4>
          
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '0.5rem'
          }}>
            <span style={{ fontSize: '0.875rem', color: '#0369a1' }}>
              Progression globale
            </span>
            <span style={{
              fontSize: '1.25rem',
              fontWeight: 'bold',
              color: avancementGlobal >= 100 ? '#10b981' : '#0369a1'
            }}>
              {Math.round(avancementGlobal)}%
            </span>
          </div>
          
          <div style={{
            width: '100%',
            height: '1rem',
            background: 'rgba(59, 130, 246, 0.1)',
            borderRadius: '0.5rem',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${Math.min(avancementGlobal, 100)}%`,
              height: '100%',
              background: avancementGlobal >= 100 ? 
                         'linear-gradient(90deg, #10b981, #059669)' : 
                         'linear-gradient(90deg, #3b82f6, #1d4ed8)',
              borderRadius: '0.5rem',
              transition: 'width 0.5s ease'
            }} />
          </div>
          
          <div style={{
            fontSize: '0.75rem',
            color: '#0369a1',
            marginTop: '0.5rem'
          }}>
            {situations.length} situation{situations.length > 1 ? 's' : ''} créée{situations.length > 1 ? 's' : ''}
          </div>
        </div>

        {/* Avancement financier */}
        <div

       >
         <h4 style={{
           margin: '0 0 1rem 0',
           color: '#0369a1',
           display: 'flex',
           alignItems: 'center',
           gap: '0.5rem'
         }}>
           💰 Avancement Financier
         </h4>
         
         <div style={{
           display: 'flex',
           justifyContent: 'space-between',
           alignItems: 'center',
           marginBottom: '0.5rem'
         }}>
           <span style={{ fontSize: '0.875rem', color: '#0369a1' }}>
             Facturation
           </span>
           <span style={{
             fontSize: '1.25rem',
             fontWeight: 'bold',
             color: pourcentageFacture >= 100 ? '#10b981' : '#0369a1'
           }}>
             {Math.round(pourcentageFacture)}%
           </span>
         </div>
         
         <div style={{
           width: '100%',
           height: '1rem',
           background: 'rgba(59, 130, 246, 0.1)',
           borderRadius: '0.5rem',
           overflow: 'hidden'
         }}>
           <div style={{
             width: `${Math.min(pourcentageFacture, 100)}%`,
             height: '100%',
             background: pourcentageFacture >= 100 ? 
                        'linear-gradient(90deg, #10b981, #059669)' : 
                        'linear-gradient(90deg, #f59e0b, #d97706)',
             borderRadius: '0.5rem',
             transition: 'width 0.5s ease'
           }} />
         </div>
         
         <div style={{
           fontSize: '0.75rem',
           color: '#0369a1',
           marginTop: '0.5rem'
         }}>
           {formatCurrency(totalFacture)} / {formatCurrency(totalInitial)}
         </div>
       </div>
     </div>

     {/* Alerte si déséquilibre */}
     {Math.abs(avancementGlobal - pourcentageFacture) > 10 && (
       <div style={{
         marginTop: '1rem',
         padding: '0.75rem',
         background: '#fef3c7',
         border: '1px solid #f59e0b',
         borderRadius: '0.5rem',
         display: 'flex',
         alignItems: 'center',
         gap: '0.5rem'
       }}>
         <span style={{ fontSize: '1.25rem' }}>⚠️</span>
         <div>
           <div style={{ fontSize: '0.875rem', fontWeight: '500', color: '#92400e' }}>
             Déséquilibre détecté
           </div>
           <div style={{ fontSize: '0.75rem', color: '#92400e' }}>
             {avancementGlobal > pourcentageFacture ? 
               'Sous-facturation par rapport à l\'avancement physique' :
               'Sur-facturation par rapport à l\'avancement physique'
             }
           </div>
         </div>
       </div>
     )}
   </div>
 );
}
