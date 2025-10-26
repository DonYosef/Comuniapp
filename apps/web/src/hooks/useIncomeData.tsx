'use client';

import { useState, useEffect, useCallback } from 'react';
import { CommunityIncomeService, CommunityIncome } from '@/services/communityIncomeService';
import {
  ExpenseCategoriesService,
  ExpenseCategory,
} from '@/services/api/expense-categories.service';

interface UseIncomeDataReturn {
  categories: ExpenseCategory[];
  incomes: CommunityIncome[];
  isLoading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
  createIncome: (data: any) => Promise<void>;
  updateIncome: (incomeId: string, data: any) => Promise<void>;
  deleteIncome: (incomeId: string) => Promise<void>;
}

export function useIncomeData(communityId: string, period?: string): UseIncomeDataReturn {
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [incomes, setIncomes] = useState<CommunityIncome[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!communityId) return;

    try {
      setIsLoading(true);
      setError(null);

      // Cargar categorías e ingresos en paralelo
      const [categoriesData, incomesData] = await Promise.all([
        ExpenseCategoriesService.getCategoriesByCommunity(communityId, 'INCOME'),
        CommunityIncomeService.getCommunityIncomes(communityId, period),
      ]);

      setCategories(categoriesData);
      setIncomes(incomesData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar los datos';
      setError(errorMessage);
      console.error('Error fetching income data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [communityId, period]);

  const refreshData = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  const createIncome = useCallback(async (data: any) => {
    try {
      const newIncome = await CommunityIncomeService.createCommunityIncome(data);
      setIncomes((prev) => [newIncome, ...prev]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al crear el ingreso';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const updateIncome = useCallback(async (incomeId: string, data: any) => {
    try {
      const updatedIncome = await CommunityIncomeService.updateCommunityIncome(incomeId, data);
      setIncomes((prev) => prev.map((income) => (income.id === incomeId ? updatedIncome : income)));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al actualizar el ingreso';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const deleteIncome = useCallback(async (incomeId: string) => {
    try {
      await CommunityIncomeService.deleteCommunityIncome(incomeId);
      setIncomes((prev) => prev.filter((income) => income.id !== incomeId));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al eliminar el ingreso';
      setError(errorMessage);
      throw err;
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    categories,
    incomes,
    isLoading,
    error,
    refreshData,
    createIncome,
    updateIncome,
    deleteIncome,
  };
}
