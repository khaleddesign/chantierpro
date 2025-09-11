"use client";

import { createContext, useContext, useState, ReactNode } from "react";

export interface Toast {
  id: string;
  type: "success" | "error" | "warning" | "info";
  title: string;
  description?: string;
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => string;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (toast: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast = { ...toast, id };
    setToasts(prev => [...prev, newToast]);

    setTimeout(() => {
      removeToast(id);
    }, toast.duration || 5000);
    
    return id;
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

export const showSuccessToast = (addToast: ToastContextType["addToast"]) => 
  (title: string, description?: string) => {
    addToast({ type: "success", title, description });
  };

export const showErrorToast = (addToast: ToastContextType["addToast"]) => 
  (title: string, description?: string) => {
    addToast({ type: "error", title, description });
  };

export const showWarningToast = (addToast: ToastContextType["addToast"]) => 
  (title: string, description?: string) => {
    addToast({ type: "warning", title, description });
  };

export function ToastContainer({ 
  toasts, 
  onRemove 
}: { 
  toasts: Toast[]; 
  onRemove: (id: string) => void;
}) {
  return (
    <div style={{
      position: "fixed",
      top: "1rem",
      right: "1rem",
      zIndex: 9999,
      display: "flex",
      flexDirection: "column",
      gap: "0.5rem"
    }}>
      {toasts.map((toast) => (
        <div
          key={toast.id}
          style={{
            background: getBackgroundColor(toast.type),
            color: getTextColor(toast.type),
            padding: "1rem",
            borderRadius: "0.5rem",
            border: `1px solid ${getBorderColor(toast.type)}`,
            minWidth: "300px",
            maxWidth: "400px",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)"
          }}
        >
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start"
          }}>
            <div>
              <div style={{
                fontWeight: "600",
                marginBottom: toast.description ? "0.25rem" : "0"
              }}>
                {getIcon(toast.type)} {toast.title}
              </div>
              {toast.description && (
                <div style={{ fontSize: "0.875rem", opacity: 0.9 }}>
                  {toast.description}
                </div>
              )}
            </div>
            <button
              onClick={() => onRemove(toast.id)}
              style={{
                background: "none",
                border: "none",
                color: "inherit",
                cursor: "pointer",
                fontSize: "1.25rem",
                lineHeight: 1,
                opacity: 0.7,
                marginLeft: "0.5rem"
              }}
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function getBackgroundColor(type: Toast["type"]) {
  switch (type) {
    case "success": return "#ecfdf5";
    case "error": return "#fef2f2";
    case "warning": return "#fefce8";
    case "info": return "#f0f9ff";
    default: return "#f9fafb";
  }
}

function getTextColor(type: Toast["type"]) {
  switch (type) {
    case "success": return "#065f46";
    case "error": return "#991b1b";
    case "warning": return "#92400e";
    case "info": return "#1e40af";
    default: return "#374151";
  }
}

function getBorderColor(type: Toast["type"]) {
  switch (type) {
    case "success": return "#10b981";
    case "error": return "#ef4444";
    case "warning": return "#f59e0b";
    case "info": return "#3b82f6";
    default: return "#d1d5db";
  }
}

function getIcon(type: Toast["type"]) {
  switch (type) {
    case "success": return "✅";
    case "error": return "❌";
    case "warning": return "⚠️";
    case "info": return "ℹ️";
    default: return "";
  }
}
