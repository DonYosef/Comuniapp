'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ExpenseCategoriesService,
  ExpenseCategory,
} from '@/services/api/expense-categories.service';
import { CommonExpensesService } from '@/services/api/common-expenses.service';
import { CommonExpenseSummaryDto } from '@comuniapp/types';

// Cache optimizado con TTL y limpieza automática
const dataCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos (aumentado para mejor rendimiento)
const MAX_CACHE_SIZE = 20; // Máximo 20 entradas en cache

// Función para invalidar caché específico
export const invalidateExpenseCache = (communityId: string, period?: string) => {
  const cacheKey = `expense-data-${communityId}-${period || 'all'}`;
  dataCache.delete(cacheKey);
  console.log('🗑️ Cache invalidado para comunidad:', communityId, 'período:', period);
};

// Limpiar cache automáticamente
const cleanCache = () => {
  const now = Date.now();
  for (const [key, value] of dataCache.entries()) {
    if (now - value.timestamp > CACHE_DURATION) {
      dataCache.delete(key);
    }
  }
  // Si el cache sigue siendo muy grande, eliminar las más antiguas
  if (dataCache.size > MAX_CACHE_SIZE) {
    const entries = Array.from(dataCache.entries());
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    const toDelete = entries.slice(0, dataCache.size - MAX_CACHE_SIZE);
    toDelete.forEach(([key]) => dataCache.delete(key));
  }
};

interface Expense {
  id: string;
  title: string;
  amount: number;
  description?: string;
  categoryId: string;
  date: string;
  status: 'PENDING' | 'PAID' | 'OVERDUE';
  createdAt: string;
}

interface UseExpenseDataReturn {
  categories: ExpenseCategory[];
  expenses: Expense[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  refreshData: () => Promise<void>;
}

export function useExpenseData(communityId: string, period?: string): UseExpenseDataReturn {
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!communityId) return;

    // Limpiar cache antes de verificar
    cleanCache();

    setIsLoading(true);
    setError(null);

    try {
      // Verificar cache primero (incluir período en la clave)
      const cacheKey = `expense-data-${communityId}-${period || 'all'}`;
      const cachedData = dataCache.get(cacheKey);
      const now = Date.now();

      if (cachedData && now - cachedData.timestamp < CACHE_DURATION) {
        console.log('📦 Usando datos del cache para', communityId, 'período:', period);
        setCategories(cachedData.data.categories);
        setExpenses(cachedData.data.expenses);
        setIsLoading(false);
        return;
      }

      console.log('🔄 Cargando datos frescos para', communityId, 'período:', period);

      // Cargar categorías y gastos en paralelo para mejor rendimiento
      const [categoriesData, commonExpensesData] = await Promise.all([
        ExpenseCategoriesService.getCategoriesByCommunity(communityId),
        CommonExpensesService.getCommonExpenses(communityId, period),
      ]);

      console.log('📊 [useExpenseData] Datos recibidos:', {
        communityId,
        period,
        categoriesCount: categoriesData.length,
        commonExpensesCount: commonExpensesData.length,
        commonExpenses: commonExpensesData.map((ce) => ({
          id: ce.id,
          period: ce.period,
          itemsCount: ce.items?.length || 0,
        })),
      });

      // Transformación optimizada de datos (sin logging excesivo)
      const expensesData = commonExpensesData.flatMap((commonExpense: CommonExpenseSummaryDto) => {
        // Verificación defensiva más eficiente
        if (!commonExpense.items || commonExpense.items.length === 0) {
          return [];
        }

        // Transformación optimizada sin logging individual
        return commonExpense.items.map((item) => ({
          id: item.id,
          title: item.name,
          amount: item.amount,
          description: item.description || '',
          categoryId: item.categoryId || '',
          date:
            commonExpense.dueDate instanceof Date
              ? commonExpense.dueDate.toISOString()
              : commonExpense.dueDate,
          status: 'PENDING' as const,
          createdAt: item.createdAt instanceof Date ? item.createdAt.toISOString() : item.createdAt,
        }));
      });

      console.log('✅ [useExpenseData] Datos transformados:', {
        categorías: categoriesData.length,
        gastos: expensesData.length,
        gastosComunes: commonExpensesData.length,
      });

      // Guardar en cache
      dataCache.set(cacheKey, {
        data: { categories: categoriesData, expenses: expensesData },
        timestamp: now,
      });

      // Logging optimizado - solo información esencial

      setCategories(categoriesData);
      setExpenses(expensesData);
    } catch (err) {
      console.error('Error loading expense data:', err);
      setError('Error al cargar los datos de gastos');

      // Datos de fallback para desarrollo
      const fallbackCategories = [
        {
          id: '1',
          name: 'Servicios Básicos',
          description: 'Agua, luz, gas, internet',
          isActive: true,
          communityId: communityId,
          usageCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '2',
          name: 'Mantenimiento',
          description: 'Gastos de mantenimiento y reparaciones',
          isActive: true,
          communityId: communityId,
          usageCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      const fallbackExpenses = [
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
          title: 'Reparación Ascensor',
          amount: 0,
          description: 'Mantenimiento preventivo del ascensor',
          categoryId: '2',
          date: new Date().toISOString(),
          status: 'PENDING' as const,
          createdAt: new Date().toISOString(),
        },
      ];

      setCategories(fallbackCategories);
      setExpenses(fallbackExpenses);
    } finally {
      setIsLoading(false);
    }
  }, [communityId, period]);

  // Función para refrescar datos (sin loading state)
  const refreshData = useCallback(async () => {
    if (!communityId) return;

    try {
      // Limpiar cache para forzar recarga
      const cacheKey = `expense-data-${communityId}-${period || 'all'}`;
      dataCache.delete(cacheKey);

      console.log('🔄 Refrescando datos para', communityId, 'período:', period);

      const [categoriesData, commonExpensesData] = await Promise.all([
        ExpenseCategoriesService.getCategoriesByCommunity(communityId),
        CommonExpensesService.getCommonExpenses(communityId, period),
      ]);

      console.log(
        '🔍 [useExpenseData refreshData] Transformando gastos comunes:',
        commonExpensesData,
      );

      const expensesData = commonExpensesData.flatMap((commonExpense: CommonExpenseSummaryDto) => {
        console.log('📋 [useExpenseData refreshData] Procesando gasto común:', {
          id: commonExpense.id,
          period: commonExpense.period,
          items: commonExpense.items,
          itemsLength: commonExpense.items?.length || 0,
        });

        const transformedItems = (commonExpense.items || []).map((item) => {
          console.log('🔧 [useExpenseData refreshData] Transformando item:', {
            id: item.id,
            name: item.name,
            amount: item.amount,
            description: item.description,
            categoryId: item.categoryId,
          });

          return {
            id: item.id,
            title: item.name,
            amount: item.amount,
            description: item.description,
            categoryId: item.categoryId || '',
            date:
              commonExpense.dueDate instanceof Date
                ? commonExpense.dueDate.toISOString()
                : commonExpense.dueDate,
            status: 'PENDING' as const,
            createdAt:
              item.createdAt instanceof Date ? item.createdAt.toISOString() : item.createdAt,
          };
        });

        console.log(
          '✅ [useExpenseData refreshData] Items transformados:',
          transformedItems.length,
        );
        return transformedItems;
      });

      // Actualizar cache con datos frescos
      dataCache.set(cacheKey, {
        data: { categories: categoriesData, expenses: expensesData },
        timestamp: Date.now(),
      });

      setCategories(categoriesData);
      setExpenses(expensesData);
      setError(null);
    } catch (err) {
      console.error('Error refreshing expense data:', err);
      setError('Error al actualizar los datos');
    }
  }, [communityId, period]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    categories,
    expenses,
    isLoading,
    error,
    refetch: loadData,
    refreshData,
  };
}
