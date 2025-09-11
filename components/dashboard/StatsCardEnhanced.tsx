"use client";

import { useEffect, useState } from 'react';
import NotificationBadge from '@/components/layout/NotificationBadge';
import { useMessages } from '@/hooks/useMessages';

interface StatsCardEnhancedProps {
  title: string;
  value: string | number;
  icon: string;
  color: string;
  change?: string;
  type?: 'messages' | 'tasks' | 'alerts' | 'default';
  href?: string;
  onClick?: () => void;
}

export default function StatsCardEnhanced({ 
  title, 
  value, 
  icon, 
  color, 
  change, 
  type = 'default',
  href,
  onClick
}: StatsCardEnhancedProps) {
  const [animatedValue, setAnimatedValue] = useState(0);
  const { totalUnreadCount } = useMessages();

  // Animation du compteur
  useEffect(() => {
    const numValue = typeof value === 'string' ? parseInt(value) || 0 : value;
    const increment = numValue / 20;
    let current = 0;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= numValue) {
        setAnimatedValue(numValue);
        clearInterval(timer);
      } else {
        setAnimatedValue(Math.floor(current));
      }
    }, 50);

    return () => clearInterval(timer);
  }, [value]);

  // Déterminer le nombre de notifications selon le type
  const getNotificationCount = () => {
    switch (type) {
      case 'messages':
        return totalUnreadCount;
      case 'tasks':
        return 2; // Exemple : 2 tâches urgentes
      case 'alerts':
        return 1; // Exemple : 1 alerte
      default:
        return 0;
    }
  };

  const notificationCount = getNotificationCount();
  const displayValue = typeof value === 'string' && value.includes('k€') 
    ? `${animatedValue}k€` 
    : animatedValue;

  const CardContent = () => (
    <div 
      className="card" 
      style={{ 
        padding: '1.5rem', 
        position: 'relative', 
        overflow: 'hidden',
        cursor: href || onClick ? 'pointer' : 'default',
        transition: 'all 0.3s ease',
        border: notificationCount > 0 ? '2px solid rgba(239, 68, 68, 0.3)' : 'none'
      }}
      onClick={onClick}
      onMouseEnter={(e) => {
        if (href || onClick) {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 8px 15px rgba(0,0,0,0.1)';
        }
      }}
      onMouseLeave={(e) => {
        if (href || onClick) {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.05)';
        }
      }}
    >
      {/* Badge de notification */}
      {notificationCount > 0 && (
        <NotificationBadge 
          count={notificationCount}
          size="sm"
          position="top-right"
          animate={true}
        />
      )}

      {/* Background gradient */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '4rem',
          height: '4rem',
          background: `linear-gradient(135deg, ${color === 'blue' ? '#3b82f6, #1e40af' : 
                                                 color === 'orange' ? '#f97316, #ea580c' :
                                                 color === 'green' ? '#10b981, #059669' :
                                                 '#7c3aed, #5b21b6'})`,
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
            {displayValue}
          </p>
          {change && (
            <p style={{ 
              color: change.startsWith('+') ? '#10b981' : '#ef4444', 
              fontSize: '0.75rem', 
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem'
            }}>
              {change.startsWith('+') ? '📈' : '📉'} {change}
            </p>
          )}
          {notificationCount > 0 && (
            <p style={{ 
              color: '#ef4444', 
              fontSize: '0.75rem', 
              margin: '0.25rem 0 0 0',
              fontWeight: '600'
            }}>
              🔔 {notificationCount} nouveau{notificationCount > 1 ? 'x' : ''}
            </p>
          )}
        </div>
        <div style={{ fontSize: '2rem', opacity: 0.7 }}>
          {icon}
        </div>
      </div>
    </div>
  );

  if (href) {
    return (
      <a href={href} style={{ textDecoration: 'none' }}>
        <CardContent />
      </a>
    );
  }

  return <CardContent />;
}
