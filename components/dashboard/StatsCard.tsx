"use client";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: string;
  color: string;
  change?: string;
}

export default function StatsCard({ title, value, icon, color, change }: StatsCardProps) {
  return (
    <div className="card" style={{ padding: '1.5rem', position: 'relative', overflow: 'hidden' }}>
      {/* Background gradient */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '4rem',
          height: '4rem',
          background: `linear-gradient(135deg, var(--${color}))`,
          borderRadius: '50%',
          transform: 'translate(1rem, -1rem)',
          opacity: 0.1
        }}
      />
      
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <p style={{ color: '#64748b', fontSize: '0.875rem', margin: '0 0 0.5rem 0' }}>
            {title}
          </p>
          <p style={{ 
            fontSize: '2rem', 
            fontWeight: 'bold', 
            color: '#1e293b',
            margin: '0 0 0.5rem 0'
          }}>
            {value}
          </p>
          {change && (
            <p style={{ color: '#10b981', fontSize: '0.75rem', margin: 0 }}>
              {change}
            </p>
          )}
        </div>
        <div style={{ fontSize: '2rem', opacity: 0.7 }}>
          {icon}
        </div>
      </div>
    </div>
  );
}