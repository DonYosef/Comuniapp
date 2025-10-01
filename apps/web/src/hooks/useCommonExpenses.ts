'use client';

import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { CommonExpenseService } from '@/services/commonExpenseService';
import {
  CommonExpenseResponseDto,
  CommonExpenseSummaryDto,
  CreateCommonExpenseDto,
  ProrrateMethod,
  CommonExpenseFormData,
} from '@comuniapp/types';

export interface UseCommonExpensesResult {
  expenses: CommonExpenseSummaryDto[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export interface UseCommonExpenseResult {
  expense: CommonExpenseResponseDto | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export interface UseCreateCommonExpenseResult {
  isLoading: boolean;
  error: string | null;
  createExpense: (data: CreateCommonExpenseDto) => Promise<CommonExpenseResponseDto | null>;
}

export function useCommonExpenses(communityId: string): UseCommonExpensesResult {
  const [expenses, setExpenses] = useState<CommonExpenseSummaryDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchExpenses = async () => {
    if (!user || !communityId) return;

    try {
      setIsLoading(true);
      setError(null);

      const data = await CommonExpenseService.getCommonExpensesByCommunity(communityId);
      setExpenses(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar los gastos comunes.');
      console.error('Error fetching common expenses:', err);
      setExpenses([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user && communityId) {
      fetchExpenses();
    }
  }, [user, communityId]);

  return {
    expenses,
    isLoading,
    error,
    refetch: fetchExpenses,
  };
}

export function useCommonExpense(id: string): UseCommonExpenseResult {
  const [expense, setExpense] = useState<CommonExpenseResponseDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchExpense = async () => {
    if (!user || !id) return;

    try {
      setIsLoading(true);
      setError(null);

      const data = await CommonExpenseService.getCommonExpenseById(id);
      setExpense(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar el gasto común.');
      console.error('Error fetching common expense:', err);
      setExpense(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user && id) {
      fetchExpense();
    }
  }, [user, id]);

  return {
    expense,
    isLoading,
    error,
    refetch: fetchExpense,
  };
}

export function useCreateCommonExpense(): UseCreateCommonExpenseResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createExpense = async (
    data: CreateCommonExpenseDto,
  ): Promise<CommonExpenseResponseDto | null> => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await CommonExpenseService.createCommonExpense(data);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear el gasto común.');
      console.error('Error creating common expense:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    error,
    createExpense,
  };
}

// Hook para manejar el formulario de creación de gastos comunes
export function useCommonExpenseForm(communityId: string) {
  const [formData, setFormData] = useState<CommonExpenseFormData>({
    period: CommonExpenseService.getCurrentPeriod(),
    dueDate: '',
    items: [{ name: '', amount: 0, description: '' }],
    prorrateMethod: ProrrateMethod.EQUAL,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateFormData = (updates: Partial<CommonExpenseFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
    // Limpiar errores cuando se actualiza el formulario
    if (Object.keys(errors).length > 0) {
      setErrors({});
    }
  };

  const addItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, { name: '', amount: 0, description: '' }],
    }));
  };

  const removeItem = (index: number) => {
    if (formData.items.length > 1) {
      setFormData((prev) => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index),
      }));
    }
  };

  const updateItem = (index: number, updates: Partial<CommonExpenseFormData['items'][0]>) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((item, i) => (i === index ? { ...item, ...updates } : item)),
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validar período
    if (!formData.period) {
      newErrors.period = 'El período es requerido';
    } else if (!CommonExpenseService.validatePeriod(formData.period)) {
      newErrors.period = 'El período debe tener el formato YYYY-MM';
    }

    // Validar fecha de vencimiento
    if (!formData.dueDate) {
      newErrors.dueDate = 'La fecha de vencimiento es requerida';
    } else {
      const dueDate = new Date(formData.dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (dueDate < today) {
        newErrors.dueDate = 'La fecha de vencimiento no puede ser anterior a hoy';
      }
    }

    // Validar ítems
    if (formData.items.length === 0) {
      newErrors.items = 'Debe agregar al menos un ítem';
    } else {
      formData.items.forEach((item, index) => {
        if (!item.name.trim()) {
          newErrors[`item_${index}_name`] = 'El nombre del ítem es requerido';
        }
        if (item.amount <= 0) {
          newErrors[`item_${index}_amount`] = 'El monto debe ser mayor a 0';
        }
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const getTotalAmount = (): number => {
    return formData.items.reduce((sum, item) => sum + item.amount, 0);
  };

  const resetForm = () => {
    setFormData({
      period: CommonExpenseService.getCurrentPeriod(),
      dueDate: '',
      items: [{ name: '', amount: 0, description: '' }],
      prorrateMethod: ProrrateMethod.EQUAL,
    });
    setErrors({});
  };

  return {
    formData,
    errors,
    updateFormData,
    addItem,
    removeItem,
    updateItem,
    validateForm,
    getTotalAmount,
    resetForm,
  };
}
