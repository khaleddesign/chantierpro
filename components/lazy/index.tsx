import React, { Suspense, lazy, ComponentType } from 'react';

// Utility function pour créer des composants lazy avec fallback
export function createLazyComponent<T = Record<string, any>>(
  importFn: () => Promise<{ default: ComponentType<T> }>,
  FallbackComponent: ComponentType = () => <div>Loading...</div>
) {
  const LazyComponent = lazy(importFn);

  const WrappedComponent = (props: T) => (
    <Suspense fallback={<FallbackComponent />}>
      <LazyComponent {...(props as any)} />
    </Suspense>
  );
  
  WrappedComponent.displayName = 'LazyWrappedComponent';
  
  return WrappedComponent;
}

// Composants de planning lazy-loaded
export { default as LazyGanttChart } from '../planning/LazyGanttChart';
export { default as LazyCalendar } from '../planning/LazyCalendar';

// Composants de documents lazy-loaded
export { default as LazyMediaViewer } from '../documents/LazyMediaViewer';

// Composants CRM lazy-loaded
export { default as LazyOpportunitesPipeline } from '../crm/LazyOpportunitesPipeline';

// Utilitaires pour lazy loading
export { default as LazyWrapper } from '../ui/LazyWrapper';

// Types pour lazy loading
export interface LazyComponentProps {
  fallbackMessage?: string;
  className?: string;
}

// Configuration des composants lazy par catégorie
export const LAZY_COMPONENTS = {
  planning: {
    GanttChart: () => import('../planning/GanttChart'),
    Calendar: () => import('../planning/Calendar'),
  },
  documents: {
    MediaViewer: () => import('../documents/MediaViewer'),
  },
  crm: {
    OpportunitesPipeline: () => import('../crm/OpportunitesPipeline'),
  },
  messages: {
    ConversationList: () => import('../messages/ConversationList'),
    MessageThread: () => import('../messages/MessageThread'),
  },
  devis: {
    DevisForm: () => import('../devis/DevisForm'),
    DevisPrintView: () => import('../devis/DevisPrintView'),
  }
} as const;

// Helper pour créer des composants lazy à la volée
export function createLazyComponentFromPath<T = Record<string, any>>(
  componentPath: string, 
  fallbackMessage?: string
) {
  const FallbackComponent = () => (
    <div className="flex items-center justify-center p-8">
      <div className="flex flex-col items-center space-y-3">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-gray-600">{fallbackMessage || "Chargement..."}</p>
      </div>
    </div>
  );
  
  FallbackComponent.displayName = 'FallbackComponent';

  return createLazyComponent<T extends React.ComponentType<any> ? React.ComponentProps<T> : T>(
    () => import(componentPath),
    FallbackComponent
  );
}