import React from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info' | 'outline' | 'status-inprogress' | 'status-completed' | 'status-delayed' | 'status-planned' | 'priority-high' | 'priority-medium' | 'priority-low';
  size?: 'sm' | 'default' | 'lg';
  className?: string;
}

const variantStyles = {
  'default': 'bg-gray-100 text-gray-800 border border-gray-200',
  'primary': 'bg-blue-100 text-blue-800 border border-blue-200',
  'secondary': 'bg-gray-100 text-gray-800 border border-gray-200',
  'success': 'bg-green-100 text-green-800 border border-green-200',
  'warning': 'bg-yellow-100 text-yellow-800 border border-yellow-200',
  'danger': 'bg-red-100 text-red-800 border border-red-200',
  'info': 'bg-cyan-100 text-cyan-800 border border-cyan-200',
  'outline': 'bg-transparent text-gray-800 border border-gray-300',
  'status-inprogress': 'bg-yellow-100 text-yellow-800 border border-yellow-200',
  'status-completed': 'bg-green-100 text-green-800 border border-green-200',
  'status-delayed': 'bg-red-100 text-red-800 border border-red-200',
  'status-planned': 'bg-blue-100 text-blue-800 border border-blue-200',
  'priority-high': 'bg-red-100 text-red-800 border border-red-200',
  'priority-medium': 'bg-yellow-100 text-yellow-800 border border-yellow-200',
  'priority-low': 'bg-green-100 text-green-800 border border-green-200'
};

const sizeStyles = {
  'sm': 'px-2 py-0.5 text-xs',
  'default': 'px-3 py-1 text-sm',
  'lg': 'px-4 py-1.5 text-base'
};

export function Badge({ 
  children, 
  variant = 'default',
  size = 'default',
  className = '' 
}: BadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1 rounded-full font-medium transition-colors',
      variantStyles[variant],
      sizeStyles[size],
      className
    )}>
      {children}
    </span>
  );
}

// Utilitaires pour les statuts de projet
export function StatusBadge({ status }: { status: string }) {
  const statusMap: Record<string, { variant: BadgeProps['variant'], text: string }> = {
    'EN_COURS': { variant: 'status-inprogress', text: 'En cours' },
    'TERMINE': { variant: 'status-completed', text: 'Terminé' },
    'EN_RETARD': { variant: 'status-delayed', text: 'En retard' },
    'PLANIFIE': { variant: 'status-planned', text: 'Planifié' },
    'EN_ATTENTE': { variant: 'status-delayed', text: 'En attente' },
    'ANNULE': { variant: 'status-delayed', text: 'Annulé' }
  };

  const statusInfo = statusMap[status] || { variant: 'default', text: status };
  
  return (
    <Badge variant={statusInfo.variant}>
      {statusInfo.text}
    </Badge>
  );
}

// Badge pour les priorités
export function PriorityBadge({ priority }: { priority: 'high' | 'medium' | 'low' | string }) {
  const priorityMap: Record<string, { variant: BadgeProps['variant'], text: string }> = {
    'high': { variant: 'priority-high', text: 'Haute' },
    'medium': { variant: 'priority-medium', text: 'Moyenne' },
    'low': { variant: 'priority-low', text: 'Basse' }
  };

  const priorityInfo = priorityMap[priority] || { variant: 'priority-medium', text: priority };
  
  return (
    <Badge variant={priorityInfo.variant}>
      {priorityInfo.text}
    </Badge>
  );
}