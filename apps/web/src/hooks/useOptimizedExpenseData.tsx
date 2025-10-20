'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useExpenseData } from './useExpenseData';

interface UseOptimizedExpenseDataReturn {
  categories: any[];
  expenses: any[];
  isLoading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
  // Datos precalculados para mejor rendimiento
  categoriesWithExpenses: any[];
  expensesWithoutCategory: any[];
  totalExpenses: number;
  totalAmount: number;
}

export function useOptimizedExpenseData(communityId: string): UseOptimizedExpenseDataReturn {
  const { categories, expenses, isLoading, error, refreshData } = useExpenseData(communityId);

  // Precalcular datos para evitar recálculos en el render
  const categoriesWithExpenses = useMemo(() => {
    return categories
      .map((category) => ({
        ...category,
        expenses: expenses.filter((expense) => expense.categoryId === category.id),
        totalAmount: expenses
          .filter((expense) => expense.categoryId === category.id)
          .reduce((sum, expense) => sum + expense.amount, 0),
      }))
      .filter((cat) => cat.expenses.length > 0);
  }, [categories, expenses]);

  const expensesWithoutCategory = useMemo(() => {
    return expenses.filter((expense) => !expense.categoryId || expense.categoryId === '');
  }, [expenses]);

  const totalExpenses = useMemo(() => {
    return expenses.length;
  }, [expenses]);

  const totalAmount = useMemo(() => {
    return expenses.reduce((sum, expense) => sum + expense.amount, 0);
  }, [expenses]);

  return {
    categories,
    expenses,
    isLoading,
    error,
    refreshData,
    categoriesWithExpenses,
    expensesWithoutCategory,
    totalExpenses,
    totalAmount,
  };
}
