"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { Toast, ToastContainer } from "@/components/ui/Toast";

interface ToastContextType {
  toasts: Toast[];
  addToast: (type: Toast["type"], title: string, description?: string, duration?: number) => string;
  removeToast: (id: string) => void;
  success: (title: string, description?: string) => string;
  error: (title: string, description?: string) => string;
  warning: (title: string, description?: string) => string;
  info: (title: string, description?: string) => string;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (type: Toast["type"], title: string, description?: string, duration?: number) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: Toast = { id, type, title, description, duration };
    setToasts(prev => [...prev, newToast]);

    setTimeout(() => {
      removeToast(id);
    }, duration || 5000);
    
    return id;
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const contextValue: ToastContextType = {
    toasts,
    addToast,
    removeToast,
    success: (title: string, description?: string) => {
      return addToast("success", title, description);
    },
    error: (title: string, description?: string) => {
      return addToast("error", title, description);
    },
    warning: (title: string, description?: string) => {
      return addToast("warning", title, description);
    },
    info: (title: string, description?: string) => {
      return addToast("info", title, description);
    }
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToastContext() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    // Instead of throwing an error, return a fallback implementation
    return {
      toasts: [],
      addToast: () => '',
      removeToast: () => {},
      success: (title: string, description?: string) => {
        alert(`✅ ${title}: ${description || ''}`);
        return '';
      },
      error: (title: string, description?: string) => {
        alert(`❌ ${title}: ${description || ''}`);
        return '';
      },
      warning: (title: string, description?: string) => {
        alert(`⚠️ ${title}: ${description || ''}`);
        return '';
      },
      info: (title: string, description?: string) => {
        alert(`ℹ️ ${title}: ${description || ''}`);
        return '';
      }
    };
  }
  return context;
}