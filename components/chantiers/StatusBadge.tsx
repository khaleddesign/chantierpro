"use client";

import React from 'react';
import { ChantierStatus } from '@prisma/client';
import { cn } from '@/lib/utils';
import { STATUS_COLORS, STATUS_LABELS } from '@/types/chantier';

export interface StatusBadgeProps {
  statut: ChantierStatus | string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function StatusBadge({ statut, size = 'md', className = '' }: StatusBadgeProps) {
  const statusKey = statut as ChantierStatus;
  const config = STATUS_COLORS[statusKey] || STATUS_COLORS.PLANIFIE;
  const label = STATUS_LABELS[statusKey] || STATUS_LABELS.PLANIFIE; // Fallback vers Planifié pour statuts invalides
  
  const sizeStyles = {
    sm: { padding: '0.25rem 0.5rem' },
    md: { padding: '0.5rem 0.75rem' },
    lg: { padding: '0.75rem 1rem' }
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-medium rounded-full border',
        config.bg,
        config.text,
        'transition-all duration-200',
        className
      )}
      style={sizeStyles[size]}
    >
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
      {label}
    </span>
  );
}
