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
  const label = STATUS_LABELS[statusKey] || statusKey;
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-0.5',
    lg: 'text-base px-3 py-1'
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-medium rounded-full border',
        config.bg,
        config.text,
        sizeClasses[size],
        'transition-all duration-200',
        className
      )}
    >
      <span className="text-xs">{config.icon}</span>
      {label}
    </span>
  );
}
