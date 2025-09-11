"use client";

import { useState, useEffect } from 'react';

interface MobileLayoutProps {
  children: React.ReactNode;
  showSidebar: boolean;
  onToggleSidebar: () => void;
}

export default function MobileLayout({ 
  children, 
  showSidebar, 
  onToggleSidebar 
}: MobileLayoutProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  if (!isMobile) {
    return <>{children}</>;
  }

  return (
    <div style={{ 
      position: 'relative',
      height: '100vh',
      overflow: 'hidden'
    }}>
      {/* Overlay pour fermer sidebar */}
      {showSidebar && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 999,
            backdropFilter: 'blur(2px)'
          }}
          onClick={onToggleSidebar}
        />
      )}

      {/* Contenu principal */}
      <div
        style={{
          transform: showSidebar ? 'translateX(300px)' : 'translateX(0)',
          transition: 'transform 0.3s ease',
          height: '100%',
          overflow: 'hidden'
        }}
      >
        {children}
      </div>

      {/* Bouton hamburger flottant */}
      {!showSidebar && (
        <button
          onClick={onToggleSidebar}
          style={{
            position: 'fixed',
            top: '1rem',
            left: '1rem',
            width: '3rem',
            height: '3rem',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #3b82f6, #f97316)',
            border: 'none',
            color: 'white',
            fontSize: '1.25rem',
            cursor: 'pointer',
            zIndex: 998,
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
          }}
        >
          ☰
        </button>
      )}
    </div>
  );
}
