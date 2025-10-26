'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { CommonExpenseService } from '@/services/commonExpenseService';
import { CommunityService } from '@/services/communityService';
import { ProrrateMethod, CreateCommonExpenseDto } from '@comuniapp/types';
import { useToast } from '@/contexts/ToastContext';
import { LoadingSpinner } from '@/components/common-expenses/CommonExpenseComponents';

interface Unit {
  id: string;
  number: string;
  coefficient: number;
  isActive: boolean;
}

interface ProrratePreview {
  unitId: string;
  unitNumber: string;
  coefficient: number;
  amount: number;
}

interface ProrrateModalProps {
  isOpen: boolean;
  onClose: () => void;
  communityId: string;
  period: string;
  expenses: any[];
  incomes: any[];
  expenseType: 'expenses' | 'income';
  onSuccess?: () => void;
}

export default function ProrrateModal({
  isOpen,
  onClose,
  communityId,
  period,
  expenses,
  incomes,
  expenseType,
  onSuccess,
}: ProrrateModalProps) {
  const [units, setUnits] = useState<Unit[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasCreated, setHasCreated] = useState(false);

  // Formulario
  const [dueDate, setDueDate] = useState('');
  const [prorrateMethod, setProrrateMethod] = useState<ProrrateMethod>(ProrrateMethod.EQUAL);
  const [observation, setObservation] = useState('');

  // Resumen de montos
  const [expensesTotal, setExpensesTotal] = useState(0);
  const [incomesTotal, setIncomesTotal] = useState(0);
  const [netTotal, setNetTotal] = useState(0);

  // Previsualización
  const [preview, setPreview] = useState<ProrratePreview[]>([]);

  const { showToast } = useToast();

  // Inicializar datos del modal
  useEffect(() => {
    if (isOpen) {
      // Fecha de vencimiento por defecto: 30 días desde hoy
      const defaultDueDate = new Date();
      defaultDueDate.setDate(defaultDueDate.getDate() + 30);
      setDueDate(defaultDueDate.toISOString().split('T')[0]);

      // Calcular totales de egresos e ingresos
      calculateTotals();
    }
  }, [isOpen, period, expenseType, expenses, incomes]);

  // Calcular totales de egresos e ingresos
  const calculateTotals = () => {
    let totalExpenses = 0;
    let totalIncomes = 0;

    // Calcular total de egresos
    expenses.forEach((expense) => {
      if (expense.items && expense.items.length > 0) {
        expense.items.forEach((item: any) => {
          totalExpenses += item.amount || 0;
        });
      }
    });

    // Calcular total de ingresos
    incomes.forEach((income) => {
      if (income.items && income.items.length > 0) {
        income.items.forEach((item: any) => {
          totalIncomes += item.amount || 0;
        });
      }
    });

    const netTotal = totalExpenses - totalIncomes;

    setExpensesTotal(totalExpenses);
    setIncomesTotal(totalIncomes);
    setNetTotal(netTotal);
  };

  // Cargar unidades al abrir el modal
  useEffect(() => {
    if (isOpen && communityId) {
      loadUnits();
    }
  }, [isOpen, communityId]);

  // Recalcular previsualización cuando cambien los datos
  useEffect(() => {
    if (units.length > 0 && netTotal > 0) {
      calculatePreview();
    }
  }, [units, netTotal, prorrateMethod]);

  const loadUnits = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const communityService = new CommunityService();
      const unitsData = await communityService.getCommunityUnits(communityId);

      // Filtrar solo unidades activas y agregar coeficiente por defecto
      const activeUnits = unitsData
        .filter((unit) => unit.isActive)
        .map((unit) => ({
          id: unit.id,
          number: unit.number,
          coefficient: 1, // Coeficiente por defecto, se puede modificar en el futuro
          isActive: unit.isActive,
        }));

      setUnits(activeUnits);

      if (activeUnits.length === 0) {
        setError('No hay unidades activas en esta comunidad');
      }
    } catch (err) {
      console.error('Error loading units:', err);
      setError('Error al cargar las unidades');
    } finally {
      setIsLoading(false);
    }
  };

  const calculatePreview = useCallback(() => {
    if (units.length === 0 || netTotal <= 0) {
      setPreview([]);
      return;
    }

    const preview = CommonExpenseService.calculateProrratePreview(units, netTotal, prorrateMethod);

    // Aplicar redondeo y ajuste de centavos
    const adjustedPreview = adjustRounding(preview, netTotal);
    setPreview(adjustedPreview);
  }, [units, netTotal, prorrateMethod]);

  const adjustRounding = (preview: ProrratePreview[], totalAmount: number): ProrratePreview[] => {
    // Redondear a 2 decimales
    const roundedPreview = preview.map((item) => ({
      ...item,
      amount: Math.round(item.amount * 100) / 100,
    }));

    // Calcular diferencia por redondeo
    const roundedTotal = roundedPreview.reduce((sum, item) => sum + item.amount, 0);
    const difference = totalAmount - roundedTotal;

    // Ajustar la diferencia en la primera unidad
    if (Math.abs(difference) > 0.01) {
      roundedPreview[0] = {
        ...roundedPreview[0],
        amount: Math.round((roundedPreview[0].amount + difference) * 100) / 100,
      };
    }

    return roundedPreview;
  };

  const validateForm = (): boolean => {
    if (!dueDate) {
      showToast('La fecha de vencimiento es requerida', 'error');
      return false;
    }

    if (units.length === 0) {
      showToast('No hay unidades activas en esta comunidad', 'error');
      return false;
    }

    if (netTotal <= 0) {
      showToast('No hay monto neto válido para prorratear (egresos - ingresos)', 'error');
      return false;
    }

    if (prorrateMethod === ProrrateMethod.COEFFICIENT) {
      const totalCoefficient = units.reduce((sum, unit) => sum + unit.coefficient, 0);
      if (totalCoefficient <= 0) {
        showToast('La suma de coeficientes debe ser mayor a 0', 'error');
        return false;
      }
    }

    // Validar que haya datos para prorratear
    if (expensesTotal === 0 && incomesTotal === 0) {
      showToast('No hay datos de egresos o ingresos para este período', 'error');
      return false;
    }

    return true;
  };

  const handleCreate = async () => {
    if (!validateForm()) return;

    setIsCreating(true);
    try {
      // Crear un item único con el total neto a prorratear
      const items = [
        {
          name: `Gastos Comunes ${period}`,
          amount: netTotal,
          description: `Egresos: $${expensesTotal.toLocaleString('es-CL', { minimumFractionDigits: 2 })} - Ingresos: $${incomesTotal.toLocaleString('es-CL', { minimumFractionDigits: 2 })}${observation.trim() ? ` - ${observation.trim()}` : ''}`,
        },
      ];

      const createDto: CreateCommonExpenseDto = {
        communityId,
        period: period,
        dueDate: new Date(dueDate).toISOString(),
        items,
        prorrateMethod,
      };

      await CommonExpenseService.createCommonExpense(createDto);

      showToast('Gastos comunes creados exitosamente', 'success');
      setHasCreated(true);
      onSuccess?.();
    } catch (error: any) {
      console.error('Error creating common expense:', error);

      let errorMessage = 'Error al crear los gastos comunes';
      if (error.response?.status === 409) {
        errorMessage = 'Ya existe un gasto común para este período';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      showToast(errorMessage, 'error');
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    if (!isCreating) {
      setObservation('');
      setError(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
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
                    d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Prorratear y Generar Cobros
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Crear gastos comunes para el período seleccionado
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={isCreating}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner size="lg" text="Cargando unidades..." />
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <div className="text-red-500 mb-4">
                <svg
                  className="w-12 h-12 mx-auto"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Error</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
              <button
                onClick={loadUnits}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Reintentar
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Formulario básico */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Período (YYYY-MM)
                  </label>
                  <input
                    type="text"
                    value={period}
                    disabled
                    placeholder="2024-01"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-white cursor-not-allowed opacity-60"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Fecha de Vencimiento
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    disabled={hasCreated}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Método de Prorrateo
                  </label>
                  <select
                    value={prorrateMethod}
                    onChange={(e) => setProrrateMethod(e.target.value as ProrrateMethod)}
                    disabled={hasCreated}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <option value={ProrrateMethod.EQUAL}>Igualitario</option>
                    <option value={ProrrateMethod.COEFFICIENT}>Por Coeficiente</option>
                  </select>
                </div>
              </div>

              {/* Resumen de montos */}
              {!hasCreated && (
                <div>
                  <div className="mb-4">
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                      Resumen Financiero - Período {period}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Montos que se prorratearán entre las unidades de la comunidad.
                    </p>
                  </div>

                  <div className="space-y-3">
                    {/* Fila de Egresos */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 border border-red-200 dark:border-red-800 rounded-lg bg-red-50 dark:bg-red-900/20">
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-red-700 dark:text-red-300 mb-1">
                          Total Egresos
                        </label>
                        <div className="text-sm text-red-600 dark:text-red-400">
                          Suma de todos los gastos configurados para este período
                        </div>
                      </div>
                      <div className="flex items-center justify-end">
                        <span className="text-lg font-bold text-red-600 dark:text-red-400">
                          ${expensesTotal.toLocaleString('es-CL', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>

                    {/* Fila de Ingresos */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 border border-green-200 dark:border-green-800 rounded-lg bg-green-50 dark:bg-green-900/20">
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-green-700 dark:text-green-300 mb-1">
                          Total Ingresos
                        </label>
                        <div className="text-sm text-green-600 dark:text-green-400">
                          Suma de todos los ingresos configurados para este período
                        </div>
                      </div>
                      <div className="flex items-center justify-end">
                        <span className="text-lg font-bold text-green-600 dark:text-green-400">
                          ${incomesTotal.toLocaleString('es-CL', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>

                    {/* Fila de Total Neto */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 border-2 border-blue-200 dark:border-blue-800 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                      <div className="col-span-2">
                        <label className="block text-lg font-bold text-blue-700 dark:text-blue-300 mb-1">
                          Total a Prorratear
                        </label>
                        <div className="text-sm text-blue-600 dark:text-blue-400">
                          Egresos - Ingresos = Monto neto a distribuir entre unidades
                        </div>
                      </div>
                      <div className="flex items-center justify-end">
                        <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          ${netTotal.toLocaleString('es-CL', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Observación */}
              {!hasCreated && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Observación (Opcional)
                  </label>
                  <textarea
                    value={observation}
                    onChange={(e) => setObservation(e.target.value)}
                    disabled={hasCreated}
                    placeholder="Agregar observaciones sobre este período..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>
              )}

              {/* Desplegable de unidades */}
              {preview.length > 0 && netTotal > 0 && (
                <div>
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    Distribución por Unidades
                  </h4>

                  <div className="space-y-2">
                    <details className="group">
                      <summary className="flex items-center justify-between w-full px-4 py-3 text-sm font-medium text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                        <span>Ver distribución detallada ({preview.length} unidades)</span>
                        <svg
                          className="w-5 h-5 transition-transform group-open:rotate-180"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </summary>

                      <div className="mt-2 border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
                        <div className="max-h-64 overflow-y-auto">
                          {preview.map((item, index) => (
                            <div
                              key={item.unitId}
                              className={`px-4 py-3 flex items-center justify-between ${index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700'}`}
                            >
                              <div className="flex items-center space-x-4">
                                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                                  <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                                    {item.unitNumber}
                                  </span>
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                                    Unidad {item.unitNumber}
                                  </div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    Coeficiente: {item.coefficient}
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-bold text-gray-900 dark:text-white">
                                  $
                                  {item.amount.toLocaleString('es-CL', {
                                    minimumFractionDigits: 2,
                                  })}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Total en el footer */}
                        <div className="px-4 py-3 bg-blue-50 dark:bg-blue-900/20 border-t border-gray-300 dark:border-gray-600">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-bold text-blue-700 dark:text-blue-300">
                              Total a Cobrar:
                            </span>
                            <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                              $
                              {preview
                                .reduce((sum, item) => sum + item.amount, 0)
                                .toLocaleString('es-CL', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </details>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
          <div className="flex justify-end space-x-3">
            {hasCreated ? (
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md hover:bg-gray-50 dark:hover:bg-gray-500 transition-colors"
              >
                Cerrar
              </button>
            ) : (
              <button
                onClick={handleClose}
                disabled={isCreating}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md hover:bg-gray-50 dark:hover:bg-gray-500 disabled:opacity-50 transition-colors"
              >
                Cancelar
              </button>
            )}
            {hasCreated ? (
              <div className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Gastos Comunes Creados Exitosamente
              </div>
            ) : (
              <button
                onClick={handleCreate}
                disabled={isCreating || units.length === 0 || netTotal <= 0}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
              >
                {isCreating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creando...
                  </>
                ) : (
                  'Crear Gastos Comunes'
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
