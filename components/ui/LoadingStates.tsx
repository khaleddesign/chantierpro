import React from 'react';

export const ChantierSkeleton = () => (
  <div className="animate-pulse space-y-4">
    <div className="h-6 bg-gray-200 rounded w-1/4"></div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-gray-200">
          <div className="h-48 bg-gray-200 rounded-t-xl"></div>
          <div className="p-5 space-y-3">
            <div className="h-5 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export const ErrorState = ({ message, onRetry }: { message: string; onRetry?: () => void }) => (
  <div className="text-center py-12">
    <div className="text-red-500 text-5xl mb-4">⚠️</div>
    <h3 className="text-xl font-semibold text-gray-900 mb-2">Erreur</h3>
    <p className="text-gray-500 mb-4">{message}</p>
    {onRetry && (
      <button
        onClick={onRetry}
        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
      >
        Réessayer
      </button>
    )}
  </div>
);

export const EmptyState = ({ message, action }: { message: string; action?: React.ReactNode }) => (
  <div className="text-center py-12">
    <div className="text-gray-400 text-5xl mb-4">📋</div>
    <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucun chantier</h3>
    <p className="text-gray-500 mb-4">{message}</p>
    {action}
  </div>
);

export const LoadingSpinner = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <div className={`${sizeClasses[size]} border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin`}></div>
  );
};

export const LoadingButton = ({ 
  loading, 
  children, 
  ...props 
}: { 
  loading: boolean; 
  children: React.ReactNode; 
} & React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button 
    {...props} 
    disabled={loading || props.disabled}
    className={`${props.className} ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
  >
    {loading ? (
      <div className="flex items-center justify-center">
        <LoadingSpinner size="sm" />
        <span className="ml-2">Chargement...</span>
      </div>
    ) : (
      children
    )}
  </button>
);
