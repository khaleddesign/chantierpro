"use client";

import { useEffect, useState } from 'react';

interface TypingIndicatorProps {
  users: Array<{
    id: string;
    name: string;
  }>;
  visible: boolean;
}

export default function TypingIndicator({ users, visible }: TypingIndicatorProps) {
  const [dots, setDots] = useState('');

  useEffect(() => {
    if (!visible) {
      setDots('');
      return;
    }

    const interval = setInterval(() => {
      setDots(prev => {
        if (prev === '...') return '';
        return prev + '.';
      });
    }, 500);

    return () => clearInterval(interval);
  }, [visible]);

  if (!visible || users.length === 0) return null;

  const formatUsers = () => {
    if (users.length === 1) {
      return `${users[0].name} est en train d'écrire`;
    } else if (users.length === 2) {
      return `${users[0].name} et ${users[1].name} sont en train d'écrire`;
    } else {
      return `${users[0].name} et ${users.length - 1} autres sont en train d'écrire`;
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      padding: '0.5rem 1rem',
      color: '#64748b',
      fontSize: '0.875rem',
      fontStyle: 'italic'
    }}>
      <div style={{
        display: 'flex',
        gap: '0.125rem'
      }}>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              width: '0.25rem',
              height: '0.25rem',
              borderRadius: '50%',
              background: '#64748b',
              animation: `typing-dot 1.5s infinite ${(i - 1) * 0.2}s`
            }}
          />
        ))}
      </div>
      <span>{formatUsers()}{dots}</span>

      <style jsx>{`
        @keyframes typing-dot {
          0%, 60%, 100% {
            opacity: 0.3;
            transform: scale(0.8);
          }
          30% {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}
