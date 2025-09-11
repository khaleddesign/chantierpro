'use client';

import { ComponentType, ReactNode } from 'react';
import { useLazyLoad } from '@/hooks/useLazyLoad';
import { LazyWrapper } from '../lazy';

interface SmartLazyComponentProps<T = {}> {
  importFn: () => Promise<{ default: ComponentType<T> }>;
  props?: T;
  children?: ReactNode;
  fallback?: ReactNode;
  className?: string;
  threshold?: number;
  rootMargin?: string;
  enabled?: boolean;
  loadingMessage?: string;
  placeholderHeight?: string | number;
}

export default function SmartLazyComponent<T = {}>({
  importFn,
  props,
  children,
  fallback,
  className = '',
  threshold = 0.1,
  rootMargin = '100px',
  enabled = true,
  loadingMessage = 'Chargement du composant...',
  placeholderHeight = 'auto'
}: SmartLazyComponentProps<T>) {
  const { elementRef, shouldLoad } = useLazyLoad({
    threshold,
    rootMargin,
    enabled
  });

  const containerStyle = {
    minHeight: typeof placeholderHeight === 'number' ? `${placeholderHeight}px` : placeholderHeight
  };

  const defaultFallback = (
    <div className="flex items-center justify-center p-8">
      <div className="flex flex-col items-center space-y-3">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-gray-600">{loadingMessage}</p>
      </div>
    </div>
  );

  const placeholder = (
    <div 
      ref={elementRef as any}
      className={`w-full ${className}`}
      style={containerStyle}
    >
      <div className="flex items-center justify-center h-full min-h-[200px] bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 bg-gray-200 rounded-full animate-pulse"></div>
          <p className="text-sm text-gray-500">Composant en attente de chargement</p>
          <p className="text-xs text-gray-400 mt-1">Scroll pour charger automatiquement</p>
        </div>
      </div>
    </div>
  );

  if (!shouldLoad) {
    return placeholder;
  }

  return (
    <div 
      ref={elementRef as any}
      className={className}
      style={containerStyle}
    >
      <LazyWrapper
        importFn={importFn}
        props={props}
        fallback={fallback || defaultFallback}
      >
        {children}
      </LazyWrapper>
    </div>
  );
}

// Version avec intersection observer pour plusieurs composants
export function SmartLazySection({ 
  children, 
  className = '',
  title,
  description 
}: {
  children: ReactNode;
  className?: string;
  title?: string;
  description?: string;
}) {
  const { elementRef, shouldLoad } = useLazyLoad({
    threshold: 0.05,
    rootMargin: '200px'
  });

  if (!shouldLoad) {
    return (
      <section 
        ref={elementRef as any}
        className={`min-h-[400px] bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 ${className}`}
      >
        <div className="flex items-center justify-center h-full p-8">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-lg animate-pulse"></div>
            {title && <h3 className="text-lg font-medium text-gray-600 mb-2">{title}</h3>}
            {description && <p className="text-sm text-gray-500 mb-4">{description}</p>}
            <div className="flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section ref={elementRef as any} className={className}>
      {children}
    </section>
  );
}