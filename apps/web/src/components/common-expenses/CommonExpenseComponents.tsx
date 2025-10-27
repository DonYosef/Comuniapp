'use client';

import { useState } from 'react';
import { ProrrateMethod, ExpenseStatus } from '@comuniapp/types';

// Componente de Toast Notification
interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  onClose: () => void;
}

export const Toast = ({ message, type, onClose }: ToastProps) => {
  const getToastStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-700 dark:text-green-300';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-700 dark:text-red-300';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-700 dark:text-yellow-300';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-700 dark:text-blue-300';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800 dark:bg-gray-900/20 dark:border-gray-700 dark:text-gray-300';
    }
  };

  const getIconStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-green-100 dark:bg-green-800';
      case 'error':
        return 'bg-red-100 dark:bg-red-800';
      case 'warning':
        return 'bg-yellow-100 dark:bg-yellow-800';
      case 'info':
        return 'bg-blue-100 dark:bg-blue-800';
      default:
        return 'bg-gray-100 dark:bg-gray-800';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-down">
      <div
        className={`rounded-xl shadow-lg border p-4 flex items-center space-x-3 max-w-md ${getToastStyles()}`}
      >
        <div className={`p-1 rounded-full ${getIconStyles()}`}>
          {type === 'success' && (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          )}
          {type === 'error' && (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          )}
          {type === 'warning' && (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          )}
          {type === 'info' && (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          )}
        </div>
        <span className="flex-1 font-medium">{message}</span>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};

// Componente de Modal de Confirmación
interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

export const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  type = 'danger',
}: ConfirmationModalProps) => {
  if (!isOpen) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'danger':
        return {
          iconBg: 'bg-red-100 dark:bg-red-900',
          iconColor: 'text-red-600 dark:text-red-400',
          buttonBg: 'bg-red-600 hover:bg-red-700',
          icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          ),
        };
      case 'warning':
        return {
          iconBg: 'bg-yellow-100 dark:bg-yellow-900',
          iconColor: 'text-yellow-600 dark:text-yellow-400',
          buttonBg: 'bg-yellow-600 hover:bg-yellow-700',
          icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          ),
        };
      case 'info':
        return {
          iconBg: 'bg-blue-100 dark:bg-blue-900',
          iconColor: 'text-blue-600 dark:text-blue-400',
          buttonBg: 'bg-blue-600 hover:bg-blue-700',
          icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          ),
        };
      default:
        return {
          iconBg: 'bg-red-100 dark:bg-red-900',
          iconColor: 'text-red-600 dark:text-red-400',
          buttonBg: 'bg-red-600 hover:bg-red-700',
          icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          ),
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      ></div>
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full mx-4 animate-fade-in-up">
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className={`p-2 rounded-full ${styles.iconBg}`}>
              <div className={styles.iconColor}>{styles.icon}</div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{message}</p>
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
            >
              {cancelText}
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`px-4 py-2 rounded-xl text-white font-medium transition-colors ${styles.buttonBg}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente de Card de Estadísticas
interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'indigo';
  subtitle?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export const StatCard = ({ title, value, icon, color, subtitle, trend }: StatCardProps) => {
  const getColorStyles = () => {
    switch (color) {
      case 'blue':
        return {
          bg: 'from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20',
          iconBg: 'from-blue-500 to-cyan-600',
          text: 'text-blue-600 dark:text-blue-400',
        };
      case 'green':
        return {
          bg: 'from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20',
          iconBg: 'from-green-500 to-emerald-600',
          text: 'text-green-600 dark:text-green-400',
        };
      case 'yellow':
        return {
          bg: 'from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20',
          iconBg: 'from-yellow-500 to-amber-600',
          text: 'text-yellow-600 dark:text-yellow-400',
        };
      case 'red':
        return {
          bg: 'from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20',
          iconBg: 'from-red-500 to-rose-600',
          text: 'text-red-600 dark:text-red-400',
        };
      case 'purple':
        return {
          bg: 'from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20',
          iconBg: 'from-purple-500 to-violet-600',
          text: 'text-purple-600 dark:text-purple-400',
        };
      case 'indigo':
        return {
          bg: 'from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20',
          iconBg: 'from-indigo-500 to-blue-600',
          text: 'text-indigo-600 dark:text-indigo-400',
        };
      default:
        return {
          bg: 'from-gray-50 to-slate-50 dark:from-gray-900/20 dark:to-slate-900/20',
          iconBg: 'from-gray-500 to-slate-600',
          text: 'text-gray-600 dark:text-gray-400',
        };
    }
  };

  const styles = getColorStyles();

  return (
    <div className="group relative bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden transition-all duration-300 hover:-translate-y-1">
      <div
        className={`absolute inset-0 bg-gradient-to-br ${styles.bg} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
      ></div>
      <div className="relative p-4 sm:p-6">
        <div className="flex items-center space-x-3 sm:space-x-4">
          <div
            className={`p-2 sm:p-3 bg-gradient-to-br ${styles.iconBg} rounded-lg sm:rounded-xl shadow-lg`}
          >
            <div className="text-white">{icon}</div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 truncate">
              {title}
            </p>
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
              {value}
            </p>
            {subtitle && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>
            )}
            {trend && (
              <div className="flex items-center mt-1">
                <span
                  className={`text-xs font-medium ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}
                >
                  {trend.isPositive ? '+' : ''}
                  {trend.value}%
                </span>
                <svg
                  className={`w-3 h-3 ml-1 ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d={trend.isPositive ? 'M7 17l9.2-9.2M17 17V7H7' : 'M17 7l-9.2 9.2M7 7v10h10'}
                  />
                </svg>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente de Badge de Estado
interface StatusBadgeProps {
  status: ExpenseStatus;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge = ({ status, size = 'md' }: StatusBadgeProps) => {
  const getStatusStyles = () => {
    switch (status) {
      case ExpenseStatus.PAID:
        return {
          bg: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
          dot: 'bg-green-500',
          text: 'Pagado',
        };
      case ExpenseStatus.PENDING:
        return {
          bg: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
          dot: 'bg-yellow-500',
          text: 'Pendiente',
        };
      case ExpenseStatus.OVERDUE:
        return {
          bg: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
          dot: 'bg-red-500',
          text: 'Vencido',
        };
      case ExpenseStatus.CANCELLED:
        return {
          bg: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
          dot: 'bg-gray-500',
          text: 'Cancelado',
        };
      default:
        return {
          bg: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
          dot: 'bg-gray-500',
          text: status,
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return {
          container: 'px-2 py-1 text-xs',
          dot: 'w-1.5 h-1.5 mr-1.5',
        };
      case 'md':
        return {
          container: 'px-3 py-1 text-sm',
          dot: 'w-2 h-2 mr-2',
        };
      case 'lg':
        return {
          container: 'px-4 py-2 text-base',
          dot: 'w-2.5 h-2.5 mr-2',
        };
      default:
        return {
          container: 'px-3 py-1 text-sm',
          dot: 'w-2 h-2 mr-2',
        };
    }
  };

  const statusStyles = getStatusStyles();
  const sizeStyles = getSizeStyles();

  return (
    <span
      className={`inline-flex items-center rounded-full font-semibold ${statusStyles.bg} ${sizeStyles.container}`}
    >
      <div className={`w-2 h-2 rounded-full mr-2 ${statusStyles.dot}`}></div>
      {statusStyles.text}
    </span>
  );
};

// Componente de Loading Spinner
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  text?: string;
  color?: 'blue' | 'green' | 'gray';
}

export const LoadingSpinner = ({ size = 'md', text, color = 'blue' }: LoadingSpinnerProps) => {
  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return 'h-4 w-4';
      case 'md':
        return 'h-6 w-6';
      case 'lg':
        return 'h-8 w-8';
      case 'xl':
        return 'h-12 w-12';
      default:
        return 'h-6 w-6';
    }
  };

  const getColorStyles = () => {
    switch (color) {
      case 'blue':
        return 'border-blue-600';
      case 'green':
        return 'border-green-600';
      case 'gray':
        return 'border-gray-600';
      default:
        return 'border-blue-600';
    }
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <div
        className={`animate-spin rounded-full border-b-2 ${getSizeStyles()} ${getColorStyles()}`}
      ></div>
      {text && <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{text}</p>}
    </div>
  );
};

// Componente de Empty State
interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const EmptyState = ({ icon, title, description, action }: EmptyStateProps) => {
  return (
    <div className="text-center py-12">
      <div className="mx-auto w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
      <p className="text-gray-500 dark:text-gray-400 mb-6">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
          {action.label}
        </button>
      )}
    </div>
  );
};
