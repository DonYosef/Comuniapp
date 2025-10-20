'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

interface ToastContextType {
  toasts: Toast[];
  showToast: (message: string, type: Toast['type']) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string, type: Toast['type']) => {
    console.log('🎯 ToastContext showToast llamado:', { message, type });
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => {
      const newToasts = [...prev, { id, message, type }];
      console.log('🎯 ToastContext toasts actualizados:', newToasts.length);
      return newToasts;
    });
  };

  const removeToast = (id: string) => {
    console.log('🎯 ToastContext removeToast llamado:', id);
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toasts, showToast, removeToast }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
