"use client";

import { CSSProperties } from 'react';

interface NotificationBadgeProps {
  count: number;
  maxCount?: number;
  color?: string;
  backgroundColor?: string;
  size?: 'sm' | 'md' | 'lg';
  animate?: boolean;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  className?: string;
  style?: CSSProperties;
}

export default function NotificationBadge({ 
  count, 
  maxCount = 99, 
  color = '#ffffff',
  backgroundColor = '#ef4444',
  size = 'md',
  animate = true,
  position = 'top-right',
  className = '',
  style = {}
}: NotificationBadgeProps) {
  if (count <= 0) return null;

  const sizeConfig = {
    sm: { 
      fontSize: '0.625rem', 
      minWidth: '1rem', 
      height: '1rem',
      padding: '0 0.25rem'
    },
    md: { 
      fontSize: '0.75rem', 
      minWidth: '1.25rem', 
      height: '1.25rem',
      padding: '0 0.375rem'
    },
    lg: { 
      fontSize: '0.875rem', 
      minWidth: '1.5rem', 
      height: '1.5rem',
      padding: '0 0.5rem'
    }
  };

  const positionConfig = {
    'top-right': { top: '-6px', right: '-6px' },
    'top-left': { top: '-6px', left: '-6px' },
    'bottom-right': { bottom: '-6px', right: '-6px' },
    'bottom-left': { bottom: '-6px', left: '-6px' }
  };

  const displayCount = count > maxCount ? `${maxCount}+` : count.toString();

  const badgeStyle: CSSProperties = {
    position: 'absolute',
    background: backgroundColor,
    color,
    fontWeight: 'bold',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
    border: '2px solid white',
    zIndex: 10,
    fontFamily: 'system-ui, -apple-system, sans-serif',
    lineHeight: 1,
    whiteSpace: 'nowrap',
    ...sizeConfig[size],
    ...positionConfig[position],
    ...style
  };

  return (
    <>
      <div 
        className={className}
        style={{
          ...badgeStyle,
          animation: animate ? 'notification-pulse 2s infinite' : 'none'
        }}
      >
        {displayCount}
      </div>

      {animate && (
        <style jsx>{`
          @keyframes notification-pulse {
            0%, 100% { 
              transform: scale(1); 
              box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            }
            50% { 
              transform: scale(1.1); 
              box-shadow: 0 4px 8px rgba(0,0,0,0.3);
            }
          }
        `}</style>
      )}
    </>
  );
}
