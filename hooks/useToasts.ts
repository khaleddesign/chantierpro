"use client";

import { useState, useCallback } from 'react';

interface Toast {
 id: string;
 type: 'success' | 'error' | 'info' | 'warning';
 title: string;
 message: string;
 duration?: number;
 action?: {
   label: string;
   onClick: () => void;
 };
}

export function useToasts() {
 const [toasts, setToasts] = useState<Toast[]>([]);

 const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
   const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
   const newToast = { ...toast, id };
   
   setToasts(prev => [...prev, newToast]);
   
   return id;
 }, []);

 const dismissToast = useCallback((id: string) => {
   setToasts(prev => prev.filter(toast => toast.id !== id));
 }, []);

 const dismissAll = useCallback(() => {
   setToasts([]);
 }, []);

 // Shortcuts pour les différents types
 const success = useCallback((title: string, message: string, options?: Partial<Toast>) => {
   return addToast({ type: 'success', title, message, ...options });
 }, [addToast]);

 const error = useCallback((title: string, message: string, options?: Partial<Toast>) => {
   return addToast({ type: 'error', title, message, duration: 0, ...options });
 }, [addToast]);

 const warning = useCallback((title: string, message: string, options?: Partial<Toast>) => {
   return addToast({ type: 'warning', title, message, ...options });
 }, [addToast]);

 const info = useCallback((title: string, message: string, options?: Partial<Toast>) => {
   return addToast({ type: 'info', title, message, ...options });
 }, [addToast]);

 return {
   toasts,
   addToast,
   dismissToast,
   dismissAll,
   success,
   error,
   warning,
   info
 };
}
