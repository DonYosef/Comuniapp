'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import RoleGuard from '@/components/RoleGuard';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { ExpenseStatus } from '@comuniapp/types';
import {
  Toast,
  StatCard,
  StatusBadge,
  LoadingSpinner,
  EmptyState,
} from '@/components/common-expenses/CommonExpenseComponents';

// Iconos SVG como componentes
const CurrencyDollarIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
    />
  </svg>
);

const CalendarIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
    />
  </svg>
);

const ClockIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const CheckCircleIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const ExclamationTriangleIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const XCircleIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const RefreshIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
    />
  </svg>
);

const CreditCardIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
    />
  </svg>
);

const InfoIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

interface Expense {
  id: string;
  amount: number;
  concept: string;
  description?: string;
  dueDate: string;
  status: ExpenseStatus;
  createdAt: string;
  updatedAt: string;
  communityExpenseId?: string;
}

interface ExpenseStats {
  total: number;
  paid: number;
  pending: number;
  overdue: number;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  overdueAmount: number;
}

export default function MisGastosPage() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'paid' | 'overdue'>('all');
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
  } | null>(null);

  useEffect(() => {
    if (user) {
      fetchMyExpenses();
    }
  }, [user]);

  const fetchMyExpenses = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await api.get<Expense[]>('/residents/my-expenses');
      setExpenses(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar los gastos');
      console.error('Error fetching expenses:', err);
      setToast({
        message: 'Error al cargar los gastos. Por favor, intenta de nuevo.',
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredExpenses = expenses.filter((expense) => {
    if (filter === 'all') return true;
    return expense.status === filter.toUpperCase();
  });

  const stats: ExpenseStats = expenses.reduce(
    (acc, expense) => {
      const amount = Number(expense.amount); // Convertir a número si viene como Decimal o string
      acc.total++;
      acc.totalAmount += amount;

      switch (expense.status) {
        case ExpenseStatus.PAID:
          acc.paid++;
          acc.paidAmount += amount;
          break;
        case ExpenseStatus.PENDING:
          acc.pending++;
          acc.pendingAmount += amount;
          break;
        case ExpenseStatus.OVERDUE:
          acc.overdue++;
          acc.overdueAmount += amount;
          break;
      }

      return acc;
    },
    {
      total: 0,
      paid: 0,
      pending: 0,
      overdue: 0,
      totalAmount: 0,
      paidAmount: 0,
      pendingAmount: 0,
      overdueAmount: 0,
    },
  );

  const getStatusIcon = (status: ExpenseStatus) => {
    switch (status) {
      case ExpenseStatus.PAID:
        return <CheckCircleIcon />;
      case ExpenseStatus.PENDING:
        return <ClockIcon />;
      case ExpenseStatus.OVERDUE:
        return <ExclamationTriangleIcon />;
      case ExpenseStatus.CANCELLED:
        return <XCircleIcon />;
      default:
        return <ClockIcon />;
    }
  };

  const getStatusText = (status: ExpenseStatus) => {
    switch (status) {
      case ExpenseStatus.PAID:
        return 'Pagado';
      case ExpenseStatus.PENDING:
        return 'Pendiente';
      case ExpenseStatus.OVERDUE:
        return 'Vencido';
      case ExpenseStatus.CANCELLED:
        return 'Cancelado';
      default:
        return status;
    }
  };

  const isOverdue = (dueDate: string) => {
    return (
      new Date(dueDate) < new Date() &&
      expenses.find((e) => e.dueDate === dueDate)?.status === ExpenseStatus.PENDING
    );
  };

  const handlePayment = (expenseId: string) => {
    setToast({
      message: 'La funcionalidad de pago en línea estará disponible próximamente.',
      type: 'info',
    });
  };

  const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info') => {
    setToast({ message, type });
  };

  if (isLoading) {
    return (
      <ProtectedRoute>
        <RoleGuard requiredPermission="view_own_expenses">
          <DashboardLayout>
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
              <LoadingSpinner size="xl" text="Cargando tus gastos..." color="blue" />
            </div>
          </DashboardLayout>
        </RoleGuard>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute>
        <RoleGuard requiredPermission="view_own_expenses">
          <DashboardLayout>
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
              <div className="text-center">
                <div className="mx-auto w-24 h-24 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mb-4">
                  <ExclamationTriangleIcon />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Error al cargar
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">
                  {error instanceof Error ? error.message : String(error)}
                </p>
                <button
                  onClick={fetchMyExpenses}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200"
                >
                  <RefreshIcon />
                  <span className="ml-2">Reintentar</span>
                </button>
              </div>
            </div>
          </DashboardLayout>
        </RoleGuard>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <RoleGuard requiredPermission="view_own_expenses">
        <DashboardLayout>
          <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-4 sm:p-6 md:p-8 border border-green-100 dark:border-gray-700 animate-slide-down">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 sm:p-3 bg-green-100 dark:bg-green-900 rounded-xl">
                    <CurrencyDollarIcon />
                  </div>
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                      Mis Gastos
                    </h1>
                    <p className="text-sm sm:text-base lg:text-lg text-gray-600 dark:text-gray-400">
                      Consulta y gestiona tus gastos comunes
                    </p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <button
                    onClick={fetchMyExpenses}
                    className="group relative inline-flex items-center justify-center px-4 py-3 sm:px-6 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300 font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 border border-gray-200 dark:border-gray-600"
                  >
                    <RefreshIcon />
                    <span className="hidden sm:inline ml-2">Actualizar</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Métricas */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 animate-fade-in-up">
              <StatCard
                title="Total Gastos"
                value={stats.total}
                icon={<CurrencyDollarIcon />}
                color="blue"
                subtitle="Todos los períodos"
              />
              <StatCard
                title="Pagados"
                value={stats.paid}
                icon={<CheckCircleIcon />}
                color="green"
                subtitle={`$${Number(stats.paidAmount).toFixed(2)}`}
              />
              <StatCard
                title="Pendientes"
                value={stats.pending}
                icon={<ClockIcon />}
                color="yellow"
                subtitle={`$${Number(stats.pendingAmount).toFixed(2)}`}
              />
              <StatCard
                title="Vencidos"
                value={stats.overdue}
                icon={<ExclamationTriangleIcon />}
                color="red"
                subtitle={`$${Number(stats.overdueAmount).toFixed(2)}`}
              />
            </div>

            {/* Resumen de Montos */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl p-6 border border-indigo-100 dark:border-indigo-800">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-900 rounded-lg mr-3">
                  <CurrencyDollarIcon />
                </div>
                Resumen Financiero
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    ${Number(stats.totalAmount).toFixed(2)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Pagado</p>
                  <p className="text-2xl font-bold text-green-600">
                    ${Number(stats.paidAmount).toFixed(2)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Pendiente</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    ${Number(stats.pendingAmount).toFixed(2)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Vencido</p>
                  <p className="text-2xl font-bold text-red-600">
                    ${Number(stats.overdueAmount).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            {/* Filtros */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Filtros</h3>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    filter === 'all'
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                      : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  Todos ({stats.total})
                </button>
                <button
                  onClick={() => setFilter('pending')}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    filter === 'pending'
                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                      : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  Pendientes ({stats.pending})
                </button>
                <button
                  onClick={() => setFilter('paid')}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    filter === 'paid'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                      : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  Pagados ({stats.paid})
                </button>
                <button
                  onClick={() => setFilter('overdue')}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    filter === 'overdue'
                      ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                      : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  Vencidos ({stats.overdue})
                </button>
              </div>
            </div>

            {/* Lista de Gastos */}
            <div
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden animate-fade-in-up"
              style={{ animationDelay: '0.2s' }}
            >
              <div className="px-8 py-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-green-50 dark:from-gray-900 dark:to-green-900/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                      <CalendarIcon />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        Lista de Gastos
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Tus gastos comunes organizados por período
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {filteredExpenses.length === 0 ? (
                <EmptyState
                  icon={<CurrencyDollarIcon />}
                  title="No hay gastos"
                  description={
                    filter === 'all'
                      ? 'No tienes gastos registrados.'
                      : `No tienes gastos ${filter === 'pending' ? 'pendientes' : filter === 'paid' ? 'pagados' : 'vencidos'}.`
                  }
                />
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredExpenses.map((expense) => (
                    <div
                      key={expense.id}
                      className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="flex-shrink-0">
                            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
                              {getStatusIcon(expense.status)}
                            </div>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center space-x-3">
                              <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                                {expense.concept}
                              </h4>
                              <StatusBadge status={expense.status} size="sm" />
                            </div>
                            <div className="mt-1">
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                Vence: {new Date(expense.dueDate).toLocaleDateString('es-ES')}
                                {isOverdue(expense.dueDate) && (
                                  <span className="ml-2 text-red-600 font-medium">(Vencido)</span>
                                )}
                              </p>
                              {expense.description && (
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                  {expense.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <p className="text-lg font-medium text-gray-900 dark:text-white">
                              ${Number(expense.amount).toFixed(2)}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {new Date(expense.createdAt).toLocaleDateString('es-ES')}
                            </p>
                          </div>
                          {expense.status === ExpenseStatus.PENDING && (
                            <button
                              onClick={() => handlePayment(expense.id)}
                              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl"
                            >
                              <CreditCardIcon />
                              <span className="ml-2">Pagar</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Información de Pago */}
            {stats.pending > 0 && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                      <InfoIcon />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-300 mb-2">
                      Información de Pago
                    </h3>
                    <div className="text-blue-800 dark:text-blue-400">
                      <p className="mb-2">
                        Tienes <span className="font-semibold">{stats.pending}</span> gasto
                        {stats.pending !== 1 ? 's' : ''} pendiente{stats.pending !== 1 ? 's' : ''}{' '}
                        por un total de{' '}
                        <span className="font-semibold">
                          ${Number(stats.pendingAmount).toFixed(2)}
                        </span>
                        .
                      </p>
                      <p className="text-sm">
                        La funcionalidad de pago en línea estará disponible próximamente. Por ahora,
                        puedes realizar tus pagos mediante transferencia bancaria o en efectivo.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Toast Notification */}
            {toast && (
              <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
            )}
          </div>
        </DashboardLayout>
      </RoleGuard>
    </ProtectedRoute>
  );
}
