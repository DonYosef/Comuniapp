'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import RoleGuard from '@/components/RoleGuard';
import DashboardLayout from '@/components/layout/DashboardLayout';
import {
  useCommonExpenses,
  useCreateCommonExpense,
  useCommonExpenseForm,
} from '@/hooks/useCommonExpenses';
import { CommonExpenseService } from '@/services/commonExpenseService';
import { CommunityService } from '@/services/communityService';
import { ProrrateMethod, ExpenseStatus } from '@comuniapp/types';
import {
  Toast,
  ConfirmationModal,
  StatCard,
  StatusBadge,
  LoadingSpinner,
  EmptyState,
} from '@/components/common-expenses/CommonExpenseComponents';

// Iconos SVG como componentes
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

const PlusIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
    />
  </svg>
);

const EyeIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
    />
  </svg>
);

const TrashIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
    />
  </svg>
);

const BuildingIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
    />
  </svg>
);

const UsersIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
    />
  </svg>
);

export default function GastosComunesPage() {
  const params = useParams();
  const router = useRouter();
  const communityId = params.id as string;

  const [community, setCommunity] = useState<any>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<any>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
  } | null>(null);

  const { expenses, isLoading, error, refetch } = useCommonExpenses(communityId);
  const { isLoading: isCreating, createExpense } = useCreateCommonExpense();

  // Cargar información de la comunidad
  useEffect(() => {
    const fetchCommunity = async () => {
      try {
        const data = await CommunityService.getCommunityById(communityId);
        setCommunity(data);
      } catch (error) {
        console.error('Error al cargar la comunidad:', error);
        setToast({
          message: 'Error al cargar la información de la comunidad',
          type: 'error',
        });
      }
    };

    if (communityId) {
      fetchCommunity();
    }
  }, [communityId]);

  const handleCreateExpense = async (formData: any) => {
    const result = await createExpense({
      communityId,
      ...formData,
    });

    if (result) {
      setShowCreateForm(false);
      refetch();
      setToast({
        message: 'Gasto común creado exitosamente ✅',
        type: 'success',
      });
    } else {
      setToast({
        message: 'Error al crear el gasto común',
        type: 'error',
      });
    }
  };

  const handleDeleteExpense = async () => {
    if (!selectedExpense) return;

    try {
      // TODO: Implementar eliminación de gasto común
      setToast({
        message: 'Funcionalidad de eliminación próximamente disponible',
        type: 'info',
      });
      setSelectedExpense(null);
    } catch (error) {
      setToast({
        message: 'Error al eliminar el gasto común',
        type: 'error',
      });
    }
  };

  const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info') => {
    setToast({ message, type });
  };

  // Calcular estadísticas
  const stats = expenses.reduce(
    (acc, expense) => {
      const expenseStats = CommonExpenseService.calculateStats(expense);
      acc.totalAmount += expenseStats.totalAmount;
      acc.paidAmount += expenseStats.paidAmount;
      acc.pendingAmount += expenseStats.pendingAmount;
      acc.overdueAmount += expenseStats.overdueAmount;
      acc.totalUnits += expenseStats.totalUnits;
      acc.paidUnits += expenseStats.paidUnits;
      acc.pendingUnits += expenseStats.pendingUnits;
      acc.overdueUnits += expenseStats.overdueUnits;
      return acc;
    },
    {
      totalAmount: 0,
      paidAmount: 0,
      pendingAmount: 0,
      overdueAmount: 0,
      totalUnits: 0,
      paidUnits: 0,
      pendingUnits: 0,
      overdueUnits: 0,
    },
  );

  const paymentPercentage = stats.totalUnits > 0 ? (stats.paidUnits / stats.totalUnits) * 100 : 0;

  if (isLoading) {
    return (
      <ProtectedRoute>
        <RoleGuard requiredPermission="manage_community_expenses">
          <DashboardLayout>
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
              <LoadingSpinner size="xl" text="Cargando gastos comunes..." color="blue" />
            </div>
          </DashboardLayout>
        </RoleGuard>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute>
        <RoleGuard requiredPermission="manage_community_expenses">
          <DashboardLayout>
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
              <div className="text-center">
                <div className="mx-auto w-24 h-24 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mb-4">
                  <svg
                    className="w-12 h-12 text-red-600 dark:text-red-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Error al cargar
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">{error}</p>
                <button
                  onClick={refetch}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200"
                >
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  Reintentar
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
      <RoleGuard requiredPermission="manage_community_expenses">
        <DashboardLayout>
          <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-4 sm:p-6 md:p-8 border border-blue-100 dark:border-gray-700 animate-slide-down">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 sm:p-3 bg-blue-100 dark:bg-blue-900 rounded-xl">
                    <CurrencyDollarIcon />
                  </div>
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                      Gastos Comunes
                    </h1>
                    <p className="text-sm sm:text-base lg:text-lg text-gray-600 dark:text-gray-400">
                      {community?.name
                        ? `Gestión de gastos para ${community.name}`
                        : 'Gestiona los gastos comunes mensuales'}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <button
                    onClick={refetch}
                    className="group relative inline-flex items-center justify-center px-4 py-3 sm:px-6 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300 font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 border border-gray-200 dark:border-gray-600"
                  >
                    <svg
                      className="w-5 h-5 mr-2 group-hover:rotate-180 transition-transform duration-200"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                    <span className="hidden sm:inline">Actualizar</span>
                  </button>
                  <button
                    onClick={() => setShowCreateForm(true)}
                    className="group relative inline-flex items-center justify-center px-4 py-3 sm:px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                  >
                    <PlusIcon />
                    <span className="hidden sm:inline ml-2">
                      {isCreating ? 'Creando...' : '+ Nuevo Gasto Común'}
                    </span>
                    <span className="sm:hidden ml-2">{isCreating ? 'Creando...' : '+ Nuevo'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Métricas */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 animate-fade-in-up">
              <StatCard
                title="Total Períodos"
                value={expenses.length}
                icon={<CalendarIcon />}
                color="blue"
                subtitle="Ciclos creados"
              />
              <StatCard
                title="Total Recaudado"
                value={`$${stats.paidAmount.toFixed(2)}`}
                icon={<CurrencyDollarIcon />}
                color="green"
                subtitle={`${paymentPercentage.toFixed(1)}% pagado`}
                trend={{
                  value: paymentPercentage,
                  isPositive: paymentPercentage > 50,
                }}
              />
              <StatCard
                title="Pendiente"
                value={`$${stats.pendingAmount.toFixed(2)}`}
                icon={<CurrencyDollarIcon />}
                color="yellow"
                subtitle={`${stats.pendingUnits} unidades`}
              />
              <StatCard
                title="Vencido"
                value={`$${stats.overdueAmount.toFixed(2)}`}
                icon={<CurrencyDollarIcon />}
                color="red"
                subtitle={`${stats.overdueUnits} unidades`}
              />
            </div>

            {/* Resumen de Montos */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl p-6 border border-indigo-100 dark:border-indigo-800">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-900 rounded-lg mr-3">
                  <BuildingIcon />
                </div>
                Resumen Financiero
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Generado</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    ${stats.totalAmount.toFixed(2)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Recaudado</p>
                  <p className="text-2xl font-bold text-green-600">
                    ${stats.paidAmount.toFixed(2)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Pendiente</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    ${stats.pendingAmount.toFixed(2)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Vencido</p>
                  <p className="text-2xl font-bold text-red-600">
                    ${stats.overdueAmount.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            {/* Lista de Gastos Comunes */}
            <div
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden animate-fade-in-up"
              style={{ animationDelay: '0.2s' }}
            >
              <div className="px-8 py-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-900/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                      <CalendarIcon />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        Historial de Gastos Comunes
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Lista de todos los períodos de facturación generados
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {expenses.length === 0 ? (
                <EmptyState
                  icon={<CalendarIcon />}
                  title="No hay gastos comunes"
                  description="Comienza creando el primer gasto común para esta comunidad."
                  action={{
                    label: 'Crear Primer Gasto Común',
                    onClick: () => setShowCreateForm(true),
                  }}
                />
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {expenses.map((expense) => {
                    const expenseStats = CommonExpenseService.calculateStats(expense);
                    return (
                      <div
                        key={expense.id}
                        className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="flex-shrink-0">
                              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                                <CalendarIcon />
                              </div>
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center space-x-3">
                                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                                  Período {expense.period}
                                </h4>
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                                  {expense.totalUnits} unidades
                                </span>
                              </div>
                              <div className="mt-1">
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  Vence: {new Date(expense.dueDate).toLocaleDateString('es-ES')} |
                                  Total: ${expense.totalAmount.toFixed(2)} | Pagado:{' '}
                                  {expense.paidUnits} ({expenseStats.paymentPercentage.toFixed(1)}%)
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                            <div className="text-right">
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                ${expenseStats.paidAmount.toFixed(2)}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">Recaudado</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                ${expenseStats.pendingAmount.toFixed(2)}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">Pendiente</p>
                            </div>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => {
                                  // TODO: Implementar vista de detalles
                                  setToast({
                                    message: 'Vista de detalles próximamente disponible',
                                    type: 'info',
                                  });
                                }}
                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all duration-200 group"
                                title="Ver detalles"
                              >
                                <EyeIcon />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedExpense(expense);
                                  setShowDeleteModal(true);
                                }}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200 group"
                                title="Eliminar"
                              >
                                <TrashIcon />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal de Creación */}
            {showCreateForm && (
              <CreateExpenseFormModal
                communityId={communityId}
                communityName={community?.name}
                onClose={() => setShowCreateForm(false)}
                onSubmit={handleCreateExpense}
                isLoading={isCreating}
              />
            )}

            {/* Modal de Confirmación de Eliminación */}
            <ConfirmationModal
              isOpen={showDeleteModal}
              onClose={() => {
                setShowDeleteModal(false);
                setSelectedExpense(null);
              }}
              onConfirm={handleDeleteExpense}
              title="Eliminar Gasto Común"
              message={`¿Estás seguro de que quieres eliminar el gasto común del período ${selectedExpense?.period}? Esta acción no se puede deshacer.`}
              confirmText="Eliminar"
              cancelText="Cancelar"
              type="danger"
            />

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

// Componente del formulario de creación
function CreateExpenseFormModal({
  communityId,
  communityName,
  onClose,
  onSubmit,
  isLoading,
}: {
  communityId: string;
  communityName?: string;
  onClose: () => void;
  onSubmit: (data: any) => void;
  isLoading: boolean;
}) {
  const {
    formData,
    errors,
    updateFormData,
    addItem,
    removeItem,
    updateItem,
    validateForm,
    getTotalAmount,
    resetForm,
  } = useCommonExpenseForm(communityId);

  const [showPreview, setShowPreview] = useState(false);
  const [units, setUnits] = useState<any[]>([]);

  // Cargar unidades para previsualización
  useEffect(() => {
    const fetchUnits = async () => {
      try {
        const data = await CommunityService.getCommunityUnits(communityId);
        setUnits(data);
      } catch (error) {
        console.error('Error al cargar unidades:', error);
      }
    };
    fetchUnits();
  }, [communityId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    onSubmit(formData);
  };

  const handlePreview = () => {
    if (validateForm()) {
      setShowPreview(true);
    }
  };

  const prorratePreview =
    units.length > 0
      ? CommonExpenseService.calculateProrratePreview(
          units.map((u) => ({ id: u.id, number: u.number, coefficient: u.coefficient || 1 })),
          getTotalAmount(),
          formData.prorrateMethod,
        )
      : [];

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-6xl shadow-lg rounded-md bg-white dark:bg-gray-800">
        <div className="mt-3">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                Crear Nuevo Gasto Común
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {communityName ? `Para ${communityName}` : 'Configuración del gasto mensual'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Información Básica */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Información Básica
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Período *
                  </label>
                  <input
                    type="text"
                    value={formData.period}
                    onChange={(e) => updateFormData({ period: e.target.value })}
                    placeholder="YYYY-MM"
                    className={`w-full px-4 py-3 border-2 rounded-xl text-base transition-all duration-200 ${
                      errors.period
                        ? 'border-red-400 dark:border-red-500 bg-red-50 dark:bg-red-900/20'
                        : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30'
                    } text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500`}
                  />
                  {errors.period && (
                    <p className="text-red-500 text-sm mt-2 flex items-center">
                      <svg
                        className="w-4 h-4 mr-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      {errors.period}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Fecha de Vencimiento *
                  </label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => updateFormData({ dueDate: e.target.value })}
                    className={`w-full px-4 py-3 border-2 rounded-xl text-base transition-all duration-200 ${
                      errors.dueDate
                        ? 'border-red-400 dark:border-red-500 bg-red-50 dark:bg-red-900/20'
                        : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30'
                    } text-gray-900 dark:text-white`}
                  />
                  {errors.dueDate && (
                    <p className="text-red-500 text-sm mt-2 flex items-center">
                      <svg
                        className="w-4 h-4 mr-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      {errors.dueDate}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Método de Prorrateo *
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label
                    className={`relative flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                      formData.prorrateMethod === ProrrateMethod.EQUAL
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                    }`}
                  >
                    <input
                      type="radio"
                      name="prorrateMethod"
                      value={ProrrateMethod.EQUAL}
                      checked={formData.prorrateMethod === ProrrateMethod.EQUAL}
                      onChange={(e) =>
                        updateFormData({ prorrateMethod: e.target.value as ProrrateMethod })
                      }
                      className="sr-only"
                    />
                    <div className="flex items-center">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg mr-3">
                        <UsersIcon />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">Igualitario</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          División equitativa entre todas las unidades
                        </p>
                      </div>
                    </div>
                  </label>

                  <label
                    className={`relative flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                      formData.prorrateMethod === ProrrateMethod.COEFFICIENT
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                    }`}
                  >
                    <input
                      type="radio"
                      name="prorrateMethod"
                      value={ProrrateMethod.COEFFICIENT}
                      checked={formData.prorrateMethod === ProrrateMethod.COEFFICIENT}
                      onChange={(e) =>
                        updateFormData({ prorrateMethod: e.target.value as ProrrateMethod })
                      }
                      className="sr-only"
                    />
                    <div className="flex items-center">
                      <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg mr-3">
                        <BuildingIcon />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">Por Coeficiente</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Distribución según coeficiente de cada unidad
                        </p>
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Ítems del Gasto */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Ítems del Gasto
                </h4>
                <button
                  type="button"
                  onClick={addItem}
                  className="inline-flex items-center px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors duration-200"
                >
                  <PlusIcon />
                  <span className="ml-1">Agregar Ítem</span>
                </button>
              </div>

              <div className="space-y-4">
                {formData.items.map((item, index) => (
                  <div
                    key={index}
                    className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Nombre *
                        </label>
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => updateItem(index, 'name', e.target.value)}
                          placeholder="Ej: Mantenimiento ascensor"
                          className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Monto *
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.amount}
                          onChange={(e) =>
                            updateItem(index, 'amount', parseFloat(e.target.value) || 0)
                          }
                          placeholder="0.00"
                          className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div className="flex items-end">
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Descripción
                          </label>
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) => updateItem(index, 'description', e.target.value)}
                            placeholder="Descripción opcional"
                            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        {formData.items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeItem(index)}
                            className="ml-2 p-2 text-red-600 hover:text-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors duration-200"
                          >
                            <TrashIcon />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {errors.items && (
                <p className="text-red-500 text-sm mt-2 flex items-center">
                  <svg
                    className="w-4 h-4 mr-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  {errors.items}
                </p>
              )}
            </div>

            {/* Total y Previsualización */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-6 border border-green-100 dark:border-green-800">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Resumen</h4>
                <button
                  type="button"
                  onClick={handlePreview}
                  className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors duration-200"
                >
                  <EyeIcon />
                  <span className="ml-1">Previsualizar Prorrateo</span>
                </button>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-lg font-medium text-gray-900 dark:text-white">
                  Total del Gasto:
                </span>
                <span className="text-3xl font-bold text-green-600">
                  ${getTotalAmount().toFixed(2)}
                </span>
              </div>
            </div>

            {/* Previsualización del Prorrateo */}
            {showPreview && prorratePreview.length > 0 && (
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-100 dark:border-blue-800">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Previsualización del Prorrateo
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-64 overflow-y-auto">
                  {prorratePreview.map((preview) => (
                    <div
                      key={preview.unitId}
                      className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-600"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            Unidad {preview.unitNumber}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Coef: {preview.coefficient}
                          </p>
                        </div>
                        <p className="text-lg font-bold text-blue-600">
                          ${preview.amount.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Botones */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl flex items-center"
              >
                {isLoading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Creando...
                  </>
                ) : (
                  <>
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Crear Gasto Común
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
