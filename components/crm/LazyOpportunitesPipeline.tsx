'use client';

import { lazy, Suspense } from 'react';
import { Target, TrendingUp } from 'lucide-react';

const OpportunitesPipeline = lazy(() => import('./OpportunitesPipeline'));

interface LazyOpportunitesPipelineProps {
  clientId: string;
}

function OpportunitesPipelineLoadingSpinner() {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Target className="w-5 h-5 text-blue-500 animate-pulse" />
          Pipeline Commercial
        </h4>
        <div className="w-40 h-9 bg-blue-200 rounded animate-pulse"></div>
      </div>

      {/* KPIs simulés */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
            <div className="flex flex-col items-center space-y-2">
              <div className="w-8 h-8 bg-blue-300 rounded animate-pulse"></div>
              <div className="w-16 h-4 bg-blue-300 rounded animate-pulse"></div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-center py-12 bg-gray-50 rounded-lg">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <TrendingUp className="w-12 h-12 text-blue-500 animate-pulse" />
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full animate-ping"></div>
          </div>
          <div className="text-center">
            <p className="text-lg font-medium text-gray-900">Chargement du pipeline</p>
            <p className="text-sm text-gray-500">Analyse des opportunités commerciales...</p>
          </div>
          <div className="w-64 bg-gray-200 rounded-full h-2 overflow-hidden">
            <div className="h-full bg-blue-500 animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Opportunités simulées */}
      <div className="space-y-4 mt-6">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="animate-pulse">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="h-6 bg-gray-300 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-full mb-4"></div>
                  <div className="flex items-center gap-4">
                    <div className="h-5 bg-green-200 rounded w-20"></div>
                    <div className="h-3 bg-orange-200 rounded w-16"></div>
                    <div className="h-3 bg-gray-200 rounded w-24"></div>
                  </div>
                </div>
                <div className="h-8 bg-blue-200 rounded w-32"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function LazyOpportunitesPipeline(props: LazyOpportunitesPipelineProps) {
  return (
    <Suspense fallback={<OpportunitesPipelineLoadingSpinner />}>
      <OpportunitesPipeline {...props} />
    </Suspense>
  );
}