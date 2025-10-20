import { apiClient } from '@/services/api/api-client';

export interface ExpenseCategory {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  communityId: string;
  communityName?: string;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateExpenseCategoryRequest {
  name: string;
  description?: string;
  communityId: string;
  type?: 'EXPENSE' | 'INCOME';
}

export interface UpdateExpenseCategoryRequest {
  name?: string;
  description?: string;
}

export class ExpenseCategoriesService {
  private static readonly BASE_URL = '/expense-categories';

  static async getCategoriesByCommunity(
    communityId: string,
    type?: 'EXPENSE' | 'INCOME',
  ): Promise<ExpenseCategory[]> {
    const params = new URLSearchParams({ communityId });
    if (type) {
      params.append('type', type);
    }
    const response = await apiClient.get(`${this.BASE_URL}?${params.toString()}`);
    return response.data;
  }

  static async getCategoryById(categoryId: string): Promise<ExpenseCategory> {
    const response = await apiClient.get(`${this.BASE_URL}/${categoryId}`);
    return response.data;
  }

  static async createCategory(data: CreateExpenseCategoryRequest): Promise<ExpenseCategory> {
    const response = await apiClient.post(this.BASE_URL, data);
    return response.data;
  }

  static async updateCategory(
    categoryId: string,
    data: UpdateExpenseCategoryRequest,
  ): Promise<ExpenseCategory> {
    const response = await apiClient.put(`${this.BASE_URL}/${categoryId}`, data);
    return response.data;
  }

  static async deleteCategory(categoryId: string): Promise<void> {
    await apiClient.delete(`${this.BASE_URL}/${categoryId}`);
  }

  static async deactivateCategory(categoryId: string): Promise<ExpenseCategory> {
    const response = await apiClient.put(`${this.BASE_URL}/${categoryId}/deactivate`);
    return response.data;
  }
}
