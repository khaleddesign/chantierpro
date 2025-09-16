'use client';

import { lazy, Suspense, ComponentType, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

interface LazyWrapperProps<T = {}> {
  importFn: () => Promise<{ default: ComponentType<T> }>;
  fallback?: ReactNode;
  props?: T;
  children?: ReactNode;
  className?: string;
}

interface DefaultLoadingProps {
  message?: string;
  className?: string;
}

function DefaultLoading({ message = "Chargement du composant...", className }: DefaultLoadingProps) {
  return (
    <div className={`flex items-center justify-center p-8 ${className || ''}`}>
      <div className="flex flex-col items-center space-y-3">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        <p className="text-sm text-gray-600">{message}</p>
      </div>
    </div>
  );
}

export default function LazyWrapper<T = {}>({
  importFn,
  fallback,
  props,
  children,
  className
}: LazyWrapperProps<T>) {
  const LazyComponent = lazy(importFn);

  const defaultFallback = <DefaultLoading className={className} />;

  return (
    <Suspense fallback={fallback || defaultFallback}>
      <LazyComponent {...props as any}>
        {children}
      </LazyComponent>
    </Suspense>
  );
}

// Hook utilitaire pour créer des composants lazy avec loading personnalisé
export function createLazyComponent<T = Record<string, any>>(
  importFn: () => Promise<{ default: ComponentType<T> }>,
  fallbackComponent?: ComponentType<any>
) {
  const LazyComponent = lazy(importFn);
  
  return function LazyComponentWrapper(props: T) {
    const FallbackComponent = fallbackComponent || DefaultLoading;
    
    return (
      <Suspense fallback={<FallbackComponent />}>
        <LazyComponent {...(props as any)} />
      </Suspense>
    );
  };
}