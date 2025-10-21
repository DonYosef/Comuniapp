'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useExpenseData } from '@/hooks/useExpenseData';
import { useIncomeData } from '@/hooks/useIncomeData';
import ExpenseTableSkeleton from './ExpenseTableSkeleton';
import { eventBus, EVENTS } from '@/utils/eventBus';
import { formatCurrency, parseCurrency, formatInputValue } from '@/utils/currencyFormatter';
import { CommonExpensesService } from '@/services/api/common-expenses.service';
import { CommunityIncomeService } from '@/services/communityIncomeService';
import { useToast } from '@/contexts/ToastContext';

interface MonthlyExpensesTableProps {
  communityId: string;
  onDataChange?: () => void; // Callback para notificar cambios
  onConfigExpenses?: () => void; // Callback para configurar egresos
  onConfigIncome?: () => void; // Callback para configurar ingresos
}

export default function MonthlyExpensesTable({
  communityId,
  onDataChange,
  onConfigExpenses,
  onConfigIncome,
}: MonthlyExpensesTableProps) {
  const [expenseType, setExpenseType] = useState<'expenses' | 'income'>('expenses');
  const [expenseValues, setExpenseValues] = useState<Record<string, number>>({});
  const [displayValues, setDisplayValues] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [savedValues, setSavedValues] = useState<Record<string, number>>({});
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<Record<string, boolean>>({});
  const [isInputDisabled, setIsInputDisabled] = useState<Record<string, boolean>>({});

  // Hook para toast notifications
  const { showToast } = useToast();

  // Usar los hooks para manejar los datos
  const {
    categories: expenseCategories,
    expenses,
    isLoading: expensesLoading,
    error: expensesError,
    refreshData: refreshExpenses,
  } = useExpenseData(communityId);
  const {
    categories: incomeCategories,
    incomes,
    isLoading: incomesLoading,
    error: incomesError,
    refreshData: refreshIncomes,
  } = useIncomeData(communityId);

  // Determinar qué datos usar según el tipo seleccionado
  const categories = expenseType === 'expenses' ? expenseCategories : incomeCategories;
  const isLoading = expenseType === 'expenses' ? expensesLoading : incomesLoading;
  const error = expenseType === 'expenses' ? expensesError : incomesError;

  // Función para refrescar datos cuando se notifica un cambio
  const handleDataChange = useCallback(async () => {
    if (expenseType === 'expenses') {
      await refreshExpenses();
    } else {
      await refreshIncomes();
    }
    onDataChange?.();
  }, [expenseType, refreshExpenses, refreshIncomes, onDataChange]);

  // Escuchar eventos de actualización de datos
  useEffect(() => {
    const handleDataRefresh = (data: { communityId: string }) => {
      if (data.communityId === communityId) {
        console.log('📢 Evento recibido: actualizando datos de gastos');
        handleDataChange();
      }
    };

    // Suscribirse a eventos
    eventBus.on(EVENTS.DATA_REFRESH_NEEDED, handleDataRefresh);
    eventBus.on(EVENTS.EXPENSE_CREATED, handleDataRefresh);
    eventBus.on(EVENTS.EXPENSE_DELETED, handleDataRefresh);

    // Limpiar suscripción al desmontar
    return () => {
      eventBus.off(EVENTS.DATA_REFRESH_NEEDED, handleDataRefresh);
      eventBus.off(EVENTS.EXPENSE_CREATED, handleDataRefresh);
      eventBus.off(EVENTS.EXPENSE_DELETED, handleDataRefresh);
    };
  }, [communityId, handleDataChange]);

  // Exponer la función de actualización para uso externo
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).refreshExpenseData = handleDataChange;
    }
  }, [handleDataChange]);

  // Inicializar valores cuando se cargan los datos
  useEffect(() => {
    const currentData = expenseType === 'expenses' ? expenses : incomes;

    if (currentData && currentData.length > 0) {
      const initialValues: Record<string, number> = {};
      const initialDisplayValues: Record<string, string> = {};
      const initialDisabledInputs: Record<string, boolean> = {};

      currentData.forEach((item) => {
        // Solo inicializar si no hay valor guardado
        if (savedValues[item.id] === undefined) {
          const amount = expenseType === 'expenses' ? item.amount : item.totalAmount;
          initialValues[item.id] = amount || 0;
          initialDisplayValues[item.id] = amount > 0 ? formatInputValue(amount) : '0';
          // Deshabilitar input si tiene valor > 0
          initialDisabledInputs[item.id] = (amount || 0) > 0;
        }
      });

      if (Object.keys(initialValues).length > 0) {
        setExpenseValues((prev) => ({ ...prev, ...initialValues }));
        setDisplayValues((prev) => ({ ...prev, ...initialDisplayValues }));
        setIsInputDisabled((prev) => ({ ...prev, ...initialDisabledInputs }));
      }
    }
  }, [expenseType, expenses, incomes, savedValues]);

  const handleValueChange = (expenseId: string, value: string) => {
    const numericValue = parseCurrency(value);
    setExpenseValues((prev) => ({
      ...prev,
      [expenseId]: numericValue,
    }));
    // Si el input está vacío, mantenerlo vacío para que el usuario pueda escribir
    if (value === '') {
      setDisplayValues((prev) => ({
        ...prev,
        [expenseId]: '',
      }));
    } else {
      setDisplayValues((prev) => ({
        ...prev,
        [expenseId]: value,
      }));
    }

    // Marcar como modificado si el valor es diferente al guardado
    const savedValue = savedValues[expenseId] || 0;
    const hasChanged = numericValue !== savedValue;
    setHasUnsavedChanges((prev) => ({
      ...prev,
      [expenseId]: hasChanged,
    }));
  };

  const handleInputFocus = (expenseId: string) => {
    const currentValue = expenseValues[expenseId] || 0;
    // Si el valor es 0, limpiar el input para que el usuario pueda escribir
    if (currentValue === 0) {
      setDisplayValues((prev) => ({
        ...prev,
        [expenseId]: '',
      }));
    } else {
      setDisplayValues((prev) => ({
        ...prev,
        [expenseId]: currentValue.toString(),
      }));
    }
  };

  const handleInputBlur = (expenseId: string) => {
    const currentValue = expenseValues[expenseId] || 0;
    // Si el valor es 0, mostrar 0 formateado, si no, formatear el valor
    if (currentValue === 0) {
      setDisplayValues((prev) => ({
        ...prev,
        [expenseId]: '0',
      }));
    } else {
      setDisplayValues((prev) => ({
        ...prev,
        [expenseId]: formatInputValue(currentValue),
      }));
    }
  };

  // Función para iniciar edición de un gasto específico
  const handleEditExpense = (expenseId: string) => {
    setEditingExpenseId(expenseId);
    setIsInputDisabled((prev) => ({
      ...prev,
      [expenseId]: false, // Habilitar el input para edición
    }));
    const currentValue = expenseValues[expenseId] || 0;
    setDisplayValues((prev) => ({
      ...prev,
      [expenseId]: currentValue > 0 ? currentValue.toString() : '',
    }));
    console.log('🎯 Input habilitado para edición:', expenseId);
  };

  // Función para cancelar edición
  const handleCancelEdit = (expenseId: string) => {
    setEditingExpenseId(null);
    setIsInputDisabled((prev) => ({
      ...prev,
      [expenseId]: true, // Deshabilitar el input al cancelar
    }));
    const savedValue = savedValues[expenseId] || 0;
    setExpenseValues((prev) => ({
      ...prev,
      [expenseId]: savedValue,
    }));
    setDisplayValues((prev) => ({
      ...prev,
      [expenseId]: savedValue > 0 ? formatInputValue(savedValue) : '0',
    }));
    setHasUnsavedChanges((prev) => ({
      ...prev,
      [expenseId]: false,
    }));
    console.log('🎯 Input deshabilitado al cancelar:', expenseId);
  };

  // Función para guardar un gasto específico
  const handleSaveExpense = async (expenseId: string) => {
    setIsSaving(true);
    try {
      const expense = expenses.find((e) => e.id === expenseId);
      if (!expense) return;

      // Buscar el gasto común que contiene este item
      const commonExpenses = await CommonExpensesService.getCommonExpenses(communityId);
      const commonExpense = commonExpenses.find((ce) =>
        ce.items.some(
          (item) => item.name === expense.title && item.description === (expense.description || ''),
        ),
      );

      if (commonExpense) {
        // Actualizar solo este item
        const updatedItems = commonExpense.items.map((item) =>
          item.name === expense.title && item.description === (expense.description || '')
            ? { ...item, amount: expenseValues[expenseId] || 0 }
            : item,
        );

        await CommonExpensesService.updateCommonExpense(commonExpense.id, {
          items: updatedItems,
        });

        // Marcar como guardado
        setSavedValues((prev) => ({
          ...prev,
          [expenseId]: expenseValues[expenseId] || 0,
        }));
        setEditingExpenseId(null);
        setIsInputDisabled((prev) => ({
          ...prev,
          [expenseId]: true, // Deshabilitar el input después de guardar
        }));
        setHasUnsavedChanges((prev) => ({
          ...prev,
          [expenseId]: false,
        }));

        // Notificar cambio (sin recargar datos para preservar valores)
        onDataChange?.();

        showToast('Gasto guardado exitosamente', 'success');
      }
    } catch (error) {
      console.error('❌ Error saving expense:', error);
      showToast('Error al guardar el gasto', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      console.log('💾 Guardando valores:', expenseValues);

      // Agrupar gastos por categoría para actualizar
      const expensesByCategory = categories.reduce(
        (acc, category) => {
          const categoryExpenses = getExpensesByCategory(category.id);
          if (categoryExpenses.length > 0) {
            acc[category.id] = categoryExpenses.map((expense) => ({
              name: expense.title,
              amount: expenseValues[expense.id] || 0,
              description: expense.description || '',
              categoryId: category.id,
            }));
          }
          return acc;
        },
        {} as Record<string, any[]>,
      );

      // Agregar gastos sin categoría
      const expensesWithoutCategory = getExpensesWithoutCategory();
      if (expensesWithoutCategory.length > 0) {
        expensesByCategory['no-category'] = expensesWithoutCategory.map((expense) => ({
          name: expense.title,
          amount: expenseValues[expense.id] || 0,
          description: expense.description || '',
          categoryId: null,
        }));
      }

      // Actualizar cada categoría
      const updatePromises = Object.entries(expensesByCategory).map(async ([categoryId, items]) => {
        if (items.length === 0) return;

        // Buscar el gasto común para esta categoría
        const commonExpenses = await CommonExpensesService.getCommonExpenses(communityId);
        const commonExpense = commonExpenses.find((ce) =>
          ce.items.some(
            (item) => item.categoryId === (categoryId === 'no-category' ? null : categoryId),
          ),
        );

        if (commonExpense) {
          // Actualizar el gasto común con los nuevos items
          await CommonExpensesService.updateCommonExpense(commonExpense.id, {
            items: items,
          });
        }
      });

      await Promise.all(updatePromises);

      // Marcar valores como guardados
      setSavedValues({ ...expenseValues });
      setEditingExpenseId(null);
      setHasUnsavedChanges({}); // Limpiar cambios no guardados

      // Deshabilitar todos los inputs después de guardar
      const disabledInputs: Record<string, boolean> = {};
      Object.keys(expenseValues).forEach((expenseId) => {
        disabledInputs[expenseId] = true;
      });
      setIsInputDisabled(disabledInputs);

      // Recargar datos sin recargar la página
      await refreshData();

      // Notificar cambio al componente padre
      onDataChange?.();

      // Mostrar toast de éxito
      console.log('🚀 Llamando showToast...');
      showToast('✅ Datos guardados correctamente', 'success');
      console.log('✅ Valores guardados exitosamente');
    } catch (error) {
      console.error('❌ Error saving values:', error);
      showToast('Error al guardar los valores', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Memoización de funciones de filtrado para evitar recálculos innecesarios
  const getExpensesByCategory = useCallback(
    (categoryId: string) => {
      const currentData = expenseType === 'expenses' ? expenses : incomes;
      return currentData.filter((item) => {
        if (expenseType === 'expenses') {
          return item.categoryId === categoryId;
        } else {
          // Para ingresos, verificar si algún item tiene esta categoría
          return item.items?.some((incomeItem: any) => incomeItem.categoryId === categoryId);
        }
      });
    },
    [expenseType, expenses, incomes],
  );

  const getExpensesWithoutCategory = useCallback(() => {
    const currentData = expenseType === 'expenses' ? expenses : incomes;
    return currentData.filter((item) => {
      if (expenseType === 'expenses') {
        return !item.categoryId || item.categoryId === '';
      } else {
        // Para ingresos, verificar si algún item no tiene categoría
        return item.items?.some(
          (incomeItem: any) => !incomeItem.categoryId || incomeItem.categoryId === '',
        );
      }
    });
  }, [expenseType, expenses, incomes]);

  // Memoización del mes actual para evitar recálculos
  const currentMonth = useMemo(() => {
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
  }, []);

  // Memoización de categorías con datos para optimizar renderizado
  const categoriesWithData = useMemo(() => {
    return categories
      .map((category) => ({
        ...category,
        items: getExpensesByCategory(category.id),
      }))
      .filter((cat) => cat.items.length > 0);
  }, [categories, getExpensesByCategory]);

  // Memoización de datos sin categoría
  const dataWithoutCategory = useMemo(() => {
    return getExpensesWithoutCategory();
  }, [getExpensesWithoutCategory]);

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
              {expenseType === 'expenses' ? 'Gastos' : 'Ingresos'} Recientes - {currentMonth}
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
            {expenseType === 'expenses' ? 'Egresos' : 'Ingresos'} Recientes - {currentMonth}
          </h3>

          {/* Botones de configuración y selector de tipo */}
          <div className="flex items-center space-x-3">
            {/* Botón de configuración según el tipo activo */}
            {expenseType === 'expenses' ? (
              <button
                onClick={onConfigExpenses}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors duration-200"
              >
                <svg
                  className="w-4 h-4 mr-1.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                Configurar Egresos
              </button>
            ) : (
              <button
                onClick={onConfigIncome}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors duration-200"
              >
                <svg
                  className="w-4 h-4 mr-1.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                Configurar Ingresos
              </button>
            )}

            {/* Separador vertical */}
            <div className="h-8 w-px bg-gray-300 dark:bg-gray-600"></div>

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
                    {categoriesWithData.map((category) => {
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

                          {/* Filas de datos de esta categoría */}
                          {category.items.map((item) => (
                            <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                              <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                                {expenseType === 'expenses' ? item.title : item.name}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                                {expenseType === 'expenses'
                                  ? item.description || '-'
                                  : item.description || '-'}
                              </td>
                              <td className="px-4 py-3 text-right">
                                <div className="flex items-center justify-end space-x-2">
                                  <span className="text-sm text-gray-500 dark:text-gray-400">
                                    $
                                  </span>
                                  <div className="flex items-center space-x-1">
                                    <input
                                      type="text"
                                      value={
                                        displayValues[item.id] !== undefined
                                          ? displayValues[item.id]
                                          : expenseValues[item.id] && expenseValues[item.id] > 0
                                            ? formatInputValue(expenseValues[item.id])
                                            : ''
                                      }
                                      onChange={(e) => handleValueChange(item.id, e.target.value)}
                                      onFocus={() => handleInputFocus(item.id)}
                                      onBlur={() => handleInputBlur(item.id)}
                                      disabled={isInputDisabled[item.id]}
                                      className={`w-24 px-2 py-1 text-sm border rounded-md text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                        isInputDisabled[item.id]
                                          ? 'border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                                          : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'
                                      }`}
                                      placeholder="0"
                                    />
                                    {editingExpenseId === item.id ? (
                                      <div className="flex space-x-1">
                                        <button
                                          onClick={() => handleSaveExpense(item.id)}
                                          disabled={isSaving}
                                          className="p-1 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 disabled:opacity-50"
                                          title="Guardar"
                                        >
                                          <svg
                                            className="w-4 h-4"
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
                                        </button>
                                        <button
                                          onClick={() => handleCancelEdit(item.id)}
                                          disabled={isSaving}
                                          className="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50"
                                          title="Cancelar"
                                        >
                                          <svg
                                            className="w-4 h-4"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                          >
                                            <path
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                              strokeWidth={2}
                                              d="M6 18L18 6M6 6l12 12"
                                            />
                                          </svg>
                                        </button>
                                      </div>
                                    ) : (
                                      <button
                                        onClick={() => handleEditExpense(item.id)}
                                        className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                                        title="Editar"
                                      >
                                        <svg
                                          className="w-4 h-4"
                                          fill="none"
                                          stroke="currentColor"
                                          viewBox="0 0 24 24"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                          />
                                        </svg>
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </React.Fragment>
                      );
                    })}

                    {/* Datos sin categoría */}
                    {dataWithoutCategory.length > 0 && (
                      <React.Fragment>
                        {/* Fila de categoría "Sin categoría" */}
                        <tr className="bg-gray-50 dark:bg-gray-700">
                          <td colSpan={3} className="px-4 py-3">
                            <div className="flex items-center">
                              <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                                Sin categoría
                              </h4>
                              <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                                - {expenseType === 'expenses' ? 'Gastos' : 'Ingresos'} sin categoría
                                asignada
                              </span>
                            </div>
                          </td>
                        </tr>

                        {/* Filas de datos sin categoría */}
                        {dataWithoutCategory.map((item) => (
                          <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                            <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                              {expenseType === 'expenses' ? item.title : item.name}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                              {expenseType === 'expenses'
                                ? item.description || '-'
                                : item.description || '-'}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end space-x-2">
                                <span className="text-sm text-gray-500 dark:text-gray-400">$</span>
                                <div className="flex items-center space-x-1">
                                  <input
                                    type="text"
                                    value={
                                      displayValues[item.id] !== undefined
                                        ? displayValues[item.id]
                                        : expenseValues[item.id] && expenseValues[item.id] > 0
                                          ? formatInputValue(expenseValues[item.id])
                                          : ''
                                    }
                                    onChange={(e) => handleValueChange(item.id, e.target.value)}
                                    onFocus={() => handleInputFocus(item.id)}
                                    onBlur={() => handleInputBlur(item.id)}
                                    disabled={isInputDisabled[item.id]}
                                    className={`w-24 px-2 py-1 text-sm border rounded-md text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                      isInputDisabled[item.id]
                                        ? 'border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                                        : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'
                                    }`}
                                    placeholder="0"
                                  />
                                  {editingExpenseId === item.id ? (
                                    <div className="flex space-x-1">
                                      <button
                                        onClick={() => handleSaveExpense(item.id)}
                                        disabled={isSaving}
                                        className="p-1 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 disabled:opacity-50"
                                        title="Guardar"
                                      >
                                        <svg
                                          className="w-4 h-4"
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
                                      </button>
                                      <button
                                        onClick={() => handleCancelEdit(item.id)}
                                        disabled={isSaving}
                                        className="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50"
                                        title="Cancelar"
                                      >
                                        <svg
                                          className="w-4 h-4"
                                          fill="none"
                                          stroke="currentColor"
                                          viewBox="0 0 24 24"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M6 18L18 6M6 6l12 12"
                                          />
                                        </svg>
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => handleEditExpense(item.id)}
                                      className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                                      title="Editar"
                                    >
                                      <svg
                                        className="w-4 h-4"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                        />
                                      </svg>
                                    </button>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </React.Fragment>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Botón de guardar */}
            <div className="flex justify-end pt-3 px-6 pb-3 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 font-medium"
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
