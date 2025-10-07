import { apiClient } from '@/services/api/api-client';

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

  static async getCommonExpenses(communityId: string): Promise<CommonExpense[]> {
    const response = await apiClient.get(`${this.BASE_URL}?communityId=${communityId}`);
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
