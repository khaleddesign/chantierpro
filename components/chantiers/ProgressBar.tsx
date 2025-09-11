"use client";

import { useEffect, useState } from "react";

interface ProgressBarProps {
  progression: number;
  showPercentage?: boolean;
  height?: string;
  animated?: boolean;
}

export default function ProgressBar({ 
  progression, 
  showPercentage = true, 
  height = '8px',
  animated = true
}: ProgressBarProps) {
  const [animatedProgress, setAnimatedProgress] = useState(0);

  useEffect(() => {
    if (animated) {
      const timer = setTimeout(() => {
        setAnimatedProgress(progression);
      }, 200);
      return () => clearTimeout(timer);
    } else {
      setAnimatedProgress(progression);
    }
  }, [progression, animated]);

  const getProgressColor = (progress: number) => {
    if (progress < 25) return 'linear-gradient(90deg, #ef4444, #f97316)';
    if (progress < 50) return 'linear-gradient(90deg, #f59e0b, #f97316)';
    if (progress < 75) return 'linear-gradient(90deg, #3b82f6, #06b6d4)';
    return 'linear-gradient(90deg, #10b981, #059669)';
  };

  return (
    <div style={{ width: '100%' }}>
      {showPercentage && (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '0.5rem'
        }}>
          <span style={{ 
            color: 'white', 
            fontSize: '0.875rem', 
            fontWeight: '500',
            textShadow: '0 1px 2px rgba(0,0,0,0.3)'
          }}>
            Progression
          </span>
          <span style={{ 
            color: 'white', 
            fontSize: '0.875rem', 
            fontWeight: '600',
            textShadow: '0 1px 2px rgba(0,0,0,0.3)'
          }}>
            {progression}%
          </span>
        </div>
      )}
      
      <div
        style={{
          width: '100%',
          height,
          backgroundColor: 'rgba(255, 255, 255, 0.2)',
          borderRadius: '4px',
          overflow: 'hidden',
          backdropFilter: 'blur(4px)',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${animatedProgress}%`,
            background: getProgressColor(progression),
            borderRadius: '4px',
            transition: animated ? 'width 1s ease-out' : 'none',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: '-100%',
              width: '100%',
              height: '100%',
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
              animation: animated ? 'shine 2s infinite' : 'none'
            }}
          />
        </div>
      </div>

      <style jsx>{`
        @keyframes shine {
          0% { left: -100%; }
          100% { left: 100%; }
        }
      `}</style>
    </div>
  );
}
