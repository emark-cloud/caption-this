"use client";

import { useEffect, useState } from "react";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastData {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastProps {
  toast: ToastData;
  onDismiss: (id: string) => void;
}

const icons = {
  success: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  error: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  warning: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  info: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

const styles = {
  success: {
    container: "bg-green-50 border-green-200",
    icon: "text-green-500",
    title: "text-green-800",
    message: "text-green-700",
  },
  error: {
    container: "bg-red-50 border-red-200",
    icon: "text-red-500",
    title: "text-red-800",
    message: "text-red-700",
  },
  warning: {
    container: "bg-yellow-50 border-yellow-200",
    icon: "text-yellow-500",
    title: "text-yellow-800",
    message: "text-yellow-700",
  },
  info: {
    container: "bg-blue-50 border-blue-200",
    icon: "text-blue-500",
    title: "text-blue-800",
    message: "text-blue-700",
  },
};

export function Toast({ toast, onDismiss }: ToastProps) {
  const [isExiting, setIsExiting] = useState(false);
  const style = styles[toast.type];

  useEffect(() => {
    const duration = toast.duration ?? 5000;
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => onDismiss(toast.id), 200);
    }, duration);

    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onDismiss]);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => onDismiss(toast.id), 200);
  };

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`
        flex items-start gap-3 p-4 border rounded-lg shadow-lg max-w-sm w-full
        transition-all duration-200
        ${style.container}
        ${isExiting ? "opacity-0 translate-x-4" : "opacity-100 translate-x-0"}
      `}
    >
      <div className={`flex-shrink-0 ${style.icon}`}>{icons[toast.type]}</div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${style.title}`}>{toast.title}</p>
        {toast.message && (
          <p className={`mt-1 text-sm ${style.message}`}>{toast.message}</p>
        )}
        {toast.action && (
          <button
            onClick={toast.action.onClick}
            className={`mt-2 text-sm font-medium ${style.title} hover:underline`}
          >
            {toast.action.label}
          </button>
        )}
      </div>
      <button
        onClick={handleDismiss}
        className={`flex-shrink-0 ${style.icon} hover:opacity-70`}
        aria-label="Dismiss"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

interface ToastContainerProps {
  toasts: ToastData[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  // Only show the 3 most recent toasts
  const visibleToasts = toasts.slice(-3);

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {visibleToasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}
