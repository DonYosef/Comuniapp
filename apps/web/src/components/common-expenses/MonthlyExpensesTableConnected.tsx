'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useExpenseData } from '@/hooks/useExpenseData';
import ExpenseTableSkeleton from './ExpenseTableSkeleton';

interface MonthlyExpensesTableProps {
  communityId: string;
  onDataChange?: () => void; // Callback para notificar cambios
}

export default function MonthlyExpensesTable({
  communityId,
  onDataChange,
}: MonthlyExpensesTableProps) {
  const [expenseType, setExpenseType] = useState<'expenses' | 'income'>('expenses');
  const [expenseValues, setExpenseValues] = useState<Record<string, number>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Usar el hook personalizado para manejar los datos
  const { categories, expenses, isLoading, error, refreshData } = useExpenseData(communityId);

  // Función para refrescar datos cuando se notifica un cambio
  const handleDataChange = useCallback(async () => {
    await refreshData();
    onDataChange?.();
  }, [refreshData, onDataChange]);

  // Exponer la función de actualización para uso externo
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).refreshExpenseData = handleDataChange;
    }
  }, [handleDataChange]);

  const handleValueChange = (expenseId: string, value: string) => {
    const numericValue = parseFloat(value) || 0;
    setExpenseValues((prev) => ({
      ...prev,
      [expenseId]: numericValue,
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // TODO: Implementar guardado de valores en la API
      console.log('Guardando valores:', expenseValues);

      // Simular guardado
      await new Promise((resolve) => setTimeout(resolve, 1000));

      alert('Valores guardados exitosamente');
    } catch (error) {
      console.error('Error saving values:', error);
      alert('Error al guardar los valores');
    } finally {
      setIsSaving(false);
    }
  };

  const getExpensesByCategory = (categoryId: string) => {
    const filtered = expenses.filter((expense) => expense.categoryId === categoryId);
    console.log(`🔍 [MonthlyExpensesTable] Gastos para categoría ${categoryId}:`, filtered.length);
    return filtered;
  };

  const getExpensesWithoutCategory = () => {
    const filtered = expenses.filter((expense) => !expense.categoryId || expense.categoryId === '');
    console.log('🔍 [MonthlyExpensesTable] Gastos sin categoría:', filtered.length);
    return filtered;
  };

  const getCurrentMonth = () => {
    const now = new Date();
    const monthNames = [
      'Enero',
      'Febrero',
      'Marzo',
      'Abril',
      'Mayo',
      'Junio',
      'Julio',
      'Agosto',
      'Septiembre',
      'Octubre',
      'Noviembre',
      'Diciembre',
    ];
    return `${monthNames[now.getMonth()]} ${now.getFullYear()}`;
  };

  if (isLoading) {
    return <ExpenseTableSkeleton />;
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-900/20">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg mr-3">
                <svg
                  className="w-5 h-5 text-blue-600 dark:text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
              Gastos Recientes - {getCurrentMonth()}
            </h3>
          </div>
        </div>
        <div className="p-6">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-center">
              <svg
                className="w-5 h-5 text-red-400 mr-2"
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
              <p className="text-red-800 dark:text-red-300 text-sm">{error}</p>
            </div>
            <button
              onClick={handleDataChange}
              className="mt-3 text-sm bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded transition-colors duration-200"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-900/20">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg mr-3">
              <svg
                className="w-5 h-5 text-blue-600 dark:text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            Gastos Recientes - {getCurrentMonth()}
          </h3>

          {/* Selector de tipo */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setExpenseType('expenses')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                expenseType === 'expenses'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm border border-gray-200 dark:border-gray-600'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Egresos
            </button>
            <button
              onClick={() => setExpenseType('income')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                expenseType === 'income'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm border border-gray-200 dark:border-gray-600'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Ingresos
            </button>
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div>
        {categories.length === 0 ? (
          <div className="text-center py-8 px-6">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              No hay categorías configuradas
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Configura las categorías desde el botón de configuración.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Tabla unificada */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Concepto
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Descripción
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Valor
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {categories.map((category) => {
                      const categoryExpenses = getExpensesByCategory(category.id);

                      if (categoryExpenses.length === 0) return null;

                      return (
                        <React.Fragment key={category.id}>
                          {/* Fila de categoría como separador */}
                          <tr className="bg-gray-50 dark:bg-gray-700">
                            <td colSpan={3} className="px-4 py-3">
                              <div className="flex items-center">
                                <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                                  {category.name}
                                </h4>
                                {category.description && (
                                  <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                                    - {category.description}
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>

                          {/* Filas de gastos de esta categoría */}
                          {categoryExpenses.map((expense) => (
                            <tr
                              key={expense.id}
                              className="hover:bg-gray-50 dark:hover:bg-gray-800"
                            >
                              <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                                {expense.title}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                                {expense.description || '-'}
                              </td>
                              <td className="px-4 py-3 text-right">
                                <div className="flex items-center justify-end space-x-2">
                                  <span className="text-sm text-gray-500 dark:text-gray-400">
                                    $
                                  </span>
                                  <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={expenseValues[expense.id] || 0}
                                    onChange={(e) => handleValueChange(expense.id, e.target.value)}
                                    className="w-24 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="0.00"
                                  />
                                </div>
                              </td>
                            </tr>
                          ))}
                        </React.Fragment>
                      );
                    })}

                    {/* Gastos sin categoría */}
                    {(() => {
                      const expensesWithoutCategory = getExpensesWithoutCategory();
                      if (expensesWithoutCategory.length === 0) return null;

                      return (
                        <React.Fragment>
                          {/* Fila de categoría "Sin categoría" */}
                          <tr className="bg-gray-50 dark:bg-gray-700">
                            <td colSpan={3} className="px-4 py-3">
                              <div className="flex items-center">
                                <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                                  Sin categoría
                                </h4>
                                <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                                  - Gastos sin categoría asignada
                                </span>
                              </div>
                            </td>
                          </tr>

                          {/* Filas de gastos sin categoría */}
                          {expensesWithoutCategory.map((expense) => (
                            <tr
                              key={expense.id}
                              className="hover:bg-gray-50 dark:hover:bg-gray-800"
                            >
                              <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                                {expense.title}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                                {expense.description || '-'}
                              </td>
                              <td className="px-4 py-3 text-right">
                                <div className="flex items-center justify-end space-x-2">
                                  <span className="text-sm text-gray-500 dark:text-gray-400">
                                    $
                                  </span>
                                  <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={expenseValues[expense.id] || 0}
                                    onChange={(e) => handleValueChange(expense.id, e.target.value)}
                                    className="w-24 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="0.00"
                                  />
                                </div>
                              </td>
                            </tr>
                          ))}
                        </React.Fragment>
                      );
                    })()}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Botón de guardar */}
            <div className="flex justify-end pt-4 px-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="inline-flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Guardando...
                  </>
                ) : (
                  <>
                    <svg
                      className="w-4 h-4 mr-2"
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
                    Guardar
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
