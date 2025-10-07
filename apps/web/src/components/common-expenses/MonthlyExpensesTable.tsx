'use client';

import React, { useState, useEffect } from 'react';
import {
  ExpenseCategoriesService,
  ExpenseCategory,
} from '@/services/api/expense-categories.service';
import { CommonExpensesService, CommonExpense } from '@/services/api/common-expenses.service';

// Las interfaces ya están importadas desde los servicios

interface MonthlyExpensesTableProps {
  communityId: string;
}

type ExpenseType = 'expenses' | 'income';

export default function MonthlyExpensesTable({ communityId }: MonthlyExpensesTableProps) {
  const [expenseType, setExpenseType] = useState<ExpenseType>('expenses');
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [expenseValues, setExpenseValues] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Cargar datos al montar el componente
  useEffect(() => {
    loadData();
  }, [communityId]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // TODO: Implementar llamadas a la API
      // const categoriesData = await ExpenseCategoryService.getCategories(communityId);
      // const expensesData = await ExpenseService.getExpenses(communityId);

      // Datos de ejemplo por ahora
      const categoriesData = [
        {
          id: '1',
          name: 'Servicios Básicos',
          description: 'Agua, luz, gas, internet',
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '2',
          name: 'Mantenimiento',
          description: 'Gastos de mantenimiento general del edificio',
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '3',
          name: 'Remuneraciones',
          description: 'Salarios y honorarios del personal',
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      const expensesData = [
        {
          id: '1',
          title: 'Factura de Agua',
          amount: 0,
          description: 'Consumo mensual de agua',
          categoryId: '1',
          date: new Date().toISOString(),
          status: 'PENDING' as const,
          createdAt: new Date().toISOString(),
        },
        {
          id: '2',
          title: 'Factura de Luz',
          amount: 0,
          description: 'Consumo mensual de electricidad',
          categoryId: '1',
          date: new Date().toISOString(),
          status: 'PENDING' as const,
          createdAt: new Date().toISOString(),
        },
        {
          id: '3',
          title: 'Reparación Ascensor',
          amount: 0,
          description: 'Mantenimiento preventivo del ascensor',
          categoryId: '2',
          date: new Date().toISOString(),
          status: 'PENDING' as const,
          createdAt: new Date().toISOString(),
        },
        {
          id: '4',
          title: 'Salario Conserje',
          amount: 0,
          description: 'Salario mensual del conserje',
          categoryId: '3',
          date: new Date().toISOString(),
          status: 'PENDING' as const,
          createdAt: new Date().toISOString(),
        },
      ];

      setCategories(categoriesData);
      setExpenses(expensesData);

      // Inicializar valores en 0
      const initialValues: Record<string, number> = {};
      expensesData.forEach((expense) => {
        initialValues[expense.id] = expense.amount;
      });
      setExpenseValues(initialValues);
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setIsLoading(false);
    }
  };

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
      // TODO: Implementar llamada a la API para guardar valores
      // await ExpenseService.updateExpenseValues(communityId, expenseValues);

      // Simular guardado
      console.log('Guardando valores:', expenseValues);

      // Actualizar el estado local
      setExpenses((prev) =>
        prev.map((expense) => ({
          ...expense,
          amount: expenseValues[expense.id] || 0,
        })),
      );

      alert('Valores guardados exitosamente');
    } catch (error) {
      console.error('Error al guardar:', error);
      alert('Error al guardar los valores');
    } finally {
      setIsSaving(false);
    }
  };

  // Obtener gastos por categoría
  const getExpensesByCategory = (categoryId: string) => {
    return expenses.filter((expense) => expense.categoryId === categoryId);
  };

  // Obtener el mes actual
  const getCurrentMonth = () => {
    const now = new Date();
    return now.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
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
          <div className="flex items-center space-x-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg mr-3">
                <svg
                  className="w-6 h-6 text-blue-600 dark:text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              Gastos Recientes - {getCurrentMonth()}
            </h3>

            {/* Selector de tipo */}
            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setExpenseType('expenses')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                  expenseType === 'expenses'
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                Egresos
              </button>
              <button
                onClick={() => setExpenseType('income')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                  expenseType === 'income'
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                Ingresos
              </button>
            </div>
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
