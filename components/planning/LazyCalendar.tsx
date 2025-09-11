'use client';

import { lazy, Suspense } from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';

const Calendar = lazy(() => import('./Calendar'));

interface LazyCalendarProps {
  onEventClick?: (event: any) => void;
  onDateClick?: (date: Date) => void;
  onNewEvent?: () => void;
}

function CalendarLoadingSpinner() {
  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
            <div className="w-20 h-8 bg-gray-200 rounded animate-pulse"></div>
            <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="w-32 h-6 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-32 h-8 bg-gray-200 rounded animate-pulse"></div>
          <div className="w-40 h-8 bg-blue-200 rounded animate-pulse"></div>
        </div>
      </div>
      
      <div className="p-4">
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <CalendarIcon className="w-12 h-12 text-blue-500 animate-pulse" />
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full animate-ping"></div>
            </div>
            <div className="text-center">
              <p className="text-lg font-medium text-gray-900">Chargement du calendrier</p>
              <p className="text-sm text-gray-500">Préparation de la vue planning...</p>
            </div>
            <div className="w-64 bg-gray-200 rounded-full h-2 overflow-hidden">
              <div className="h-full bg-blue-500 animate-pulse"></div>
            </div>
          </div>
        </div>
        
        {/* Grille de simulation du calendrier */}
        <div className="grid grid-cols-7 gap-2 mt-8">
          {Array.from({ length: 35 }, (_, i) => (
            <div key={i} className="h-20 bg-gray-100 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function LazyCalendar(props: LazyCalendarProps) {
  return (
    <Suspense fallback={<CalendarLoadingSpinner />}>
      <Calendar {...props} />
    </Suspense>
  );
}