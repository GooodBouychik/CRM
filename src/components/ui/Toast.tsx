'use client';

import { useState, useEffect, createContext, useContext, useCallback, ReactNode, useRef } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
  undoAction?: () => void;
  undoLabel?: string;
}

export interface ToastOptions {
  type?: ToastType;
  duration?: number;
  undoAction?: () => void;
  undoLabel?: string;
}

interface ToastContextType {
  showToast: (message: string, options?: ToastOptions) => string;
  hideToast: (id: string) => void;
  success: (message: string, options?: Omit<ToastOptions, 'type'>) => string;
  error: (message: string, options?: Omit<ToastOptions, 'type'>) => string;
  info: (message: string, options?: Omit<ToastOptions, 'type'>) => string;
  warning: (message: string, options?: Omit<ToastOptions, 'type'>) => string;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, options: ToastOptions = {}): string => {
    const id = Math.random().toString(36).substring(7);
    const toast: Toast = {
      id,
      message,
      type: options.type || 'info',
      duration: options.duration ?? 4000,
      undoAction: options.undoAction,
      undoLabel: options.undoLabel || 'Отменить',
    };
    setToasts((prev) => [...prev, toast]);
    return id;
  }, []);

  const hideToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const success = useCallback(
    (message: string, options?: Omit<ToastOptions, 'type'>) => showToast(message, { ...options, type: 'success' }),
    [showToast]
  );

  const error = useCallback(
    (message: string, options?: Omit<ToastOptions, 'type'>) => showToast(message, { ...options, type: 'error' }),
    [showToast]
  );

  const info = useCallback(
    (message: string, options?: Omit<ToastOptions, 'type'>) => showToast(message, { ...options, type: 'info' }),
    [showToast]
  );

  const warning = useCallback(
    (message: string, options?: Omit<ToastOptions, 'type'>) => showToast(message, { ...options, type: 'warning' }),
    [showToast]
  );

  return (
    <ToastContext.Provider value={{ showToast, hideToast, success, error, info, warning }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onClose={() => hideToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const [isExiting, setIsExiting] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Simple auto-close timer
  useEffect(() => {
    const duration = toast.duration;
    if (!duration || duration <= 0) return;

    timerRef.current = setTimeout(() => {
      setIsExiting(true);
      setTimeout(onClose, 200);
    }, duration);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [toast.id, toast.duration, onClose]);

  const handleClose = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    setIsExiting(true);
    setTimeout(onClose, 200);
  };

  const handleUndo = () => {
    if (toast.undoAction) {
      toast.undoAction();
    }
    handleClose();
  };

  const config = {
    success: {
      bg: 'bg-green-500 dark:bg-green-600',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ),
    },
    error: {
      bg: 'bg-red-500 dark:bg-red-600',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      ),
    },
    warning: {
      bg: 'bg-amber-500 dark:bg-amber-600',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      ),
    },
    info: {
      bg: 'bg-blue-500 dark:bg-blue-600',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
  };

  const { bg, icon } = config[toast.type];

  return (
    <div
      className={`
        ${bg} text-white rounded-lg shadow-lg overflow-hidden pointer-events-auto
        transform transition-all duration-200 ease-out
        ${isExiting ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100 animate-slide-in'}
      `}
      role="alert"
    >
      <div className="px-4 py-3 flex items-start gap-3">
        <span className="flex-shrink-0 mt-0.5">{icon}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">{toast.message}</p>
          {toast.undoAction && (
            <button
              onClick={handleUndo}
              className="mt-1 text-sm font-medium underline underline-offset-2 hover:no-underline opacity-90 hover:opacity-100 transition-opacity"
            >
              {toast.undoLabel}
            </button>
          )}
        </div>
        <button
          onClick={handleClose}
          className="flex-shrink-0 p-1 rounded hover:bg-white/20 transition-colors"
          aria-label="Закрыть"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default ToastProvider;
