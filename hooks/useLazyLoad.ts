'use client';

import { useEffect, useRef, useState } from 'react';

interface UseLazyLoadOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
  enabled?: boolean;
}

export function useLazyLoad({
  threshold = 0.1,
  rootMargin = '50px',
  triggerOnce = true,
  enabled = true
}: UseLazyLoadOptions = {}) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const elementRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!enabled || !elementRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsIntersecting(true);
          if (triggerOnce) {
            setHasLoaded(true);
            observer.disconnect();
          }
        } else if (!triggerOnce) {
          setIsIntersecting(false);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(elementRef.current);

    return () => observer.disconnect();
  }, [threshold, rootMargin, triggerOnce, enabled]);

  const shouldLoad = enabled && (isIntersecting || hasLoaded);

  return { elementRef, isIntersecting, shouldLoad, hasLoaded };
}

// Hook pour lazy loading avec délai
export function useLazyLoadWithDelay({
  delay = 0,
  ...options
}: UseLazyLoadOptions & { delay?: number } = {}) {
  const { shouldLoad: shouldLoadImmediate, ...rest } = useLazyLoad(options);
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    if (shouldLoadImmediate && !shouldLoad) {
      const timer = setTimeout(() => {
        setShouldLoad(true);
      }, delay);

      return () => clearTimeout(timer);
    }
  }, [shouldLoadImmediate, shouldLoad, delay]);

  return { ...rest, shouldLoad };
}

// Hook pour pre-loading des composants
export function usePreloadComponent(importFn: () => Promise<any>, shouldPreload = true) {
  const [isPreloaded, setIsPreloaded] = useState(false);

  useEffect(() => {
    if (shouldPreload && !isPreloaded) {
      importFn().then(() => {
        setIsPreloaded(true);
      }).catch(console.error);
    }
  }, [shouldPreload, isPreloaded, importFn]);

  return isPreloaded;
}

// Hook combiné pour lazy loading intelligent
export function useSmartLazyLoad(
  importFn: () => Promise<any>,
  options: UseLazyLoadOptions & { 
    preloadOnHover?: boolean;
    preloadDelay?: number;
  } = {}
) {
  const { preloadOnHover = false, preloadDelay = 1000, ...lazyOptions } = options;
  const { elementRef, shouldLoad } = useLazyLoad(lazyOptions);
  const [isPreloaded, setIsPreloaded] = useState(false);

  const handleMouseEnter = () => {
    if (preloadOnHover && !isPreloaded && !shouldLoad) {
      setTimeout(() => {
        importFn().then(() => setIsPreloaded(true)).catch(console.error);
      }, preloadDelay);
    }
  };

  useEffect(() => {
    const element = elementRef.current;
    if (preloadOnHover && element) {
      element.addEventListener('mouseenter', handleMouseEnter);
      return () => element.removeEventListener('mouseenter', handleMouseEnter);
    }
  }, [preloadOnHover]);

  return { 
    elementRef, 
    shouldLoad: shouldLoad || isPreloaded,
    isPreloaded 
  };
}