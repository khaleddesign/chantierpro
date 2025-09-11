'use client';

import { lazy, Suspense } from 'react';
import { Calendar } from 'lucide-react';

const GanttChart = lazy(() => import('./GanttChart'));

interface LazyGanttChartProps {
  taches: any[];
  onTacheClick?: (tache: any) => void;
  onTacheUpdate?: (tacheId: string, updates: any) => void;
  readOnly?: boolean;
}

function GanttLoadingSpinner() {
  return (
    <div className="flex items-center justify-center p-12 bg-white rounded-lg border">
      <div className="flex flex-col items-center space-y-4">
        <div className="relative">
          <Calendar className="w-12 h-12 text-blue-500 animate-pulse" />
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full animate-ping"></div>
        </div>
        <div className="text-center">
          <p className="text-lg font-medium text-gray-900">Chargement du Gantt</p>
          <p className="text-sm text-gray-500">Préparation de la vue planning...</p>
        </div>
        <div className="w-64 bg-gray-200 rounded-full h-2 overflow-hidden">
          <div className="h-full bg-blue-500 animate-pulse"></div>
        </div>
      </div>
    </div>
  );
}

export default function LazyGanttChart(props: LazyGanttChartProps) {
  return (
    <Suspense fallback={<GanttLoadingSpinner />}>
      <GanttChart {...props} />
    </Suspense>
  );
}