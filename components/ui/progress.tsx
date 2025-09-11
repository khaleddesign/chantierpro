import React from 'react';
import { cn } from '@/lib/utils';

interface ProgressProps {
  value: number;
  max?: number;
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
  color?: 'blue' | 'green' | 'yellow' | 'red';
}

export function Progress({ 
  value, 
  max = 100, 
  className = '',
  showText = false,
  size = 'md',
  color = 'blue'
}: ProgressProps) {
  const percentage = Math.min((value / max) * 100, 100);
  
  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2', 
    lg: 'h-3'
  };

  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500'
  };

  return (
    <div className={cn('w-full', className)}>
      <div className={cn('progress-bar', sizeClasses[size])}>
        <div 
          className={cn('progress-fill', colorClasses[color])}
          style={{ 
            width: `${percentage}%`,
            background: color === 'blue' 
              ? 'linear-gradient(90deg, var(--accent-blue), var(--accent-purple))'
              : undefined
          }}
        />
      </div>
      {showText && (
        <div className="progress-text">
          {Math.round(percentage)}%
        </div>
      )}
    </div>
  );
}

// Barre de progression avec label
interface LabeledProgressProps extends ProgressProps {
  label: string;
}

export function LabeledProgress({ 
  label, 
  value, 
  max = 100,
  className = '',
  ...props 
}: LabeledProgressProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-primary">{label}</span>
        <span className="text-sm text-secondary">{value}/{max}</span>
      </div>
      <Progress value={value} max={max} {...props} />
    </div>
  );
}

// Barre de progression circulaire
interface CircularProgressProps {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  showText?: boolean;
}

export function CircularProgress({
  value,
  max = 100,
  size = 80,
  strokeWidth = 8,
  className = '',
  showText = true
}: CircularProgressProps) {
  const percentage = Math.min((value / max) * 100, 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Cercle de fond */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="var(--bg-secondary)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Cercle de progression */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#gradient)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-300 ease-in-out"
        />
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--accent-blue)" />
            <stop offset="100%" stopColor="var(--accent-purple)" />
          </linearGradient>
        </defs>
      </svg>
      {showText && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-semibold text-primary">
            {Math.round(percentage)}%
          </span>
        </div>
      )}
    </div>
  );
}