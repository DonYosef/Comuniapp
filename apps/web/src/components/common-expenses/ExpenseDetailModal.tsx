'use client';

import { useState, useEffect } from 'react';
import { useCommonExpense } from '@/hooks/useCommonExpenses';
import { ExpenseStatus, ProrrateMethod } from '@comuniapp/types';
import {
  Toast,
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

const DownloadIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
    />
  </svg>
);

const PrinterIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
    />
  </svg>
);

interface ExpenseDetailModalProps {
  expenseId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function ExpenseDetailModal({
  expenseId,
  isOpen,
  onClose,
}: ExpenseDetailModalProps) {
  const { expense, isLoading, error } = useCommonExpense(expenseId);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
  } | null>(null);

  const handleDownload = () => {
    setToast({
      message: 'Funcionalidad de descarga próximamente disponible',
      type: 'info',
    });
  };

  const handlePrint = () => {
    setToast({
      message: 'Funcionalidad de impresión próximamente disponible',
      type: 'info',
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      ></div>
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto animate-fade-in-up">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                Detalles del Gasto Común
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Información completa del período de facturación
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleDownload}
                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all duration-200"
                title="Descargar reporte"
              >
                <DownloadIcon />
              </button>
              <button
                onClick={handlePrint}
                className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-all duration-200"
                title="Imprimir"
              >
                <PrinterIcon />
              </button>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg transition-all duration-200"
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
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="lg" text="Cargando detalles..." color="blue" />
            </div>
          ) : error ? (
            <EmptyState
              icon={<ExclamationTriangleIcon />}
              title="Error al cargar"
              description={error}
            />
          ) : expense ? (
            <div className="space-y-6">
              {/* Información General */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-blue-100 dark:border-blue-800">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg mr-3">
                    <CalendarIcon />
                  </div>
                  Información General
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Período</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {expense.period}
                    </p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Comunidad
                    </p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {expense.communityName}
                    </p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Fecha de Vencimiento
                    </p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {new Date(expense.dueDate).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Método de Prorrateo
                    </p>
                    <div className="flex items-center mt-1">
                      {expense.prorrateMethod === ProrrateMethod.EQUAL ? (
                        <>
                          <UsersIcon />
                          <span className="ml-2 text-lg font-semibold text-gray-900 dark:text-white">
                            Igualitario
                          </span>
                        </>
                      ) : (
                        <>
                          <BuildingIcon />
                          <span className="ml-2 text-lg font-semibold text-gray-900 dark:text-white">
                            Por Coeficiente
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Total del Gasto
                    </p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      ${expense.totalAmount.toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Fecha de Creación
                    </p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {new Date(expense.createdAt).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Ítems del Gasto */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-green-50 dark:from-gray-900 dark:to-green-900/20">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                    <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg mr-3">
                      <CurrencyDollarIcon />
                    </div>
                    Ítems del Gasto
                  </h4>
                </div>
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {expense.items.map((item) => (
                    <div key={item.id} className="p-6">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h5 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {item.name}
                          </h5>
                          {item.description && (
                            <p className="text-gray-600 dark:text-gray-400 mt-1">
                              {item.description}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-green-600">
                            ${item.amount.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Gastos por Unidad */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-purple-50 dark:from-gray-900 dark:to-purple-900/20">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg mr-3">
                      <BuildingIcon />
                    </div>
                    Gastos por Unidad
                  </h4>
                </div>
                <div className="divide-y divide-gray-200 dark:divide-gray-700 max-h-64 overflow-y-auto">
                  {expense.unitExpenses.map((unitExpense) => (
                    <div key={unitExpense.id} className="p-4">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg">
                              <span className="text-sm font-bold text-white">
                                {unitExpense.unitNumber}
                              </span>
                            </div>
                          </div>
                          <div>
                            <h5 className="text-sm font-semibold text-gray-900 dark:text-white">
                              Unidad {unitExpense.unitNumber}
                            </h5>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {unitExpense.concept}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="text-right">
                            <p className="text-lg font-semibold text-gray-900 dark:text-white">
                              ${unitExpense.amount.toFixed(2)}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Vence: {new Date(unitExpense.dueDate).toLocaleDateString('es-ES')}
                            </p>
                          </div>
                          <StatusBadge status={unitExpense.status} size="sm" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Estadísticas de Pago */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-6 border border-green-100 dark:border-green-800">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg mr-3">
                    <CheckCircleIcon />
                  </div>
                  Estadísticas de Pago
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Unidades</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {expense.unitExpenses.length}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Pagadas</p>
                    <p className="text-2xl font-bold text-green-600">
                      {expense.unitExpenses.filter((e) => e.status === ExpenseStatus.PAID).length}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Pendientes</p>
                    <p className="text-2xl font-bold text-yellow-600">
                      {
                        expense.unitExpenses.filter((e) => e.status === ExpenseStatus.PENDING)
                          .length
                      }
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Vencidas</p>
                    <p className="text-2xl font-bold text-red-600">
                      {
                        expense.unitExpenses.filter((e) => e.status === ExpenseStatus.OVERDUE)
                          .length
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <EmptyState
              icon={<CalendarIcon />}
              title="Gasto no encontrado"
              description="El gasto común solicitado no existe o no tienes permisos para verlo."
            />
          )}

          {/* Toast Notification */}
          {toast && (
            <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
          )}
        </div>
      </div>
    </div>
  );
}
