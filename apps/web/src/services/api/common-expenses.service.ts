import { apiClient } from '@/services/api/api-client';
import { CommonExpenseSummaryDto } from '@comuniapp/types';

export interface CommonExpense {
  id: string;
  communityId: string;
  communityName?: string;
  period: string;
  totalAmount: number;
  dueDate: string;
  prorrateMethod: 'EQUAL' | 'COEFFICIENT';
  items: CommonExpenseItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CommonExpenseItem {
  id: string;
  name: string;
  amount: number;
  description?: string;
  categoryId?: string;
  categoryName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCommonExpenseRequest {
  communityId: string;
  period: string;
  dueDate: string;
  items: CreateCommonExpenseItemRequest[];
  prorrateMethod: 'EQUAL' | 'COEFFICIENT';
}

export interface CreateCommonExpenseItemRequest {
  name: string;
  amount: number;
  description?: string;
  categoryId?: string;
}

export class CommonExpensesService {
  private static readonly BASE_URL = '/common-expenses';

  static async getCommonExpenses(
    communityId: string,
    period?: string,
  ): Promise<CommonExpenseSummaryDto[]> {
    const params = new URLSearchParams({ communityId });
    if (period) {
      params.append('period', period);
    }
    const response = await apiClient.get(`${this.BASE_URL}?${params.toString()}`);
    return response.data;
  }

  static async getCommonExpenseById(expenseId: string): Promise<CommonExpense> {
    const response = await apiClient.get(`${this.BASE_URL}/${expenseId}`);
    return response.data;
  }

  static async createCommonExpense(data: CreateCommonExpenseRequest): Promise<CommonExpense> {
    const response = await apiClient.post(this.BASE_URL, data);
    return response.data;
  }

  static async updateCommonExpense(
    expenseId: string,
    data: Partial<CreateCommonExpenseRequest>,
  ): Promise<CommonExpense> {
    const response = await apiClient.put(`${this.BASE_URL}/${expenseId}`, data);
    return response.data;
  }

  static async deleteCommonExpense(expenseId: string): Promise<void> {
    await apiClient.delete(`${this.BASE_URL}/${expenseId}`);
  }

  static async deleteExpenseItem(expenseId: string, itemId: string): Promise<{ message: string }> {
    try {
      console.log('🚀 Llamando a la API:', `${this.BASE_URL}/${expenseId}/items/${itemId}`);
      const response = await apiClient.delete(`${this.BASE_URL}/${expenseId}/items/${itemId}`);
      console.log('✅ Respuesta de la API:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error en la llamada a la API:', error);
      console.error('❌ Detalles del error:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url,
        method: error.config?.method,
      });
      throw error;
    }
  }

  // Método para calcular estadísticas (mantener compatibilidad con el frontend existente)
  static calculateStats(expense: CommonExpense) {
    // TODO: Implementar cálculo real basado en pagos
    const totalUnits = 10; // Esto debería venir de la API
    const paidAmount = expense.totalAmount * 0.7; // Simulado por ahora
    const paymentPercentage = (paidAmount / expense.totalAmount) * 100;

    return {
      totalUnits,
      paidAmount,
      paymentPercentage,
    };
  }
}
