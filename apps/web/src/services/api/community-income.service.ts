import { apiClient } from '@/services/api/api-client';

export interface CommunityIncome {
  id: string;
  communityId: string;
  communityName?: string;
  period: string;
  totalAmount: number;
  dueDate: string;
  prorrateMethod: 'EQUAL' | 'COEFFICIENT';
  items: CommunityIncomeItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CommunityIncomeItem {
  id: string;
  name: string;
  amount: number;
  description?: string;
  categoryId: string;
  categoryName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCommunityIncomeRequest {
  communityId: string;
  period: string;
  dueDate: string;
  items: CreateCommunityIncomeItemRequest[];
  prorrateMethod: 'EQUAL' | 'COEFFICIENT';
}

export interface CreateCommunityIncomeItemRequest {
  name: string;
  amount: number;
  description?: string;
  categoryId: string;
}

export class CommunityIncomeService {
  private static readonly BASE_URL = '/community-income';

  static async getCommunityIncomes(communityId: string): Promise<CommunityIncome[]> {
    const response = await apiClient.get(`${this.BASE_URL}?communityId=${communityId}`);
    return response.data;
  }

  static async getCommunityIncomeById(incomeId: string): Promise<CommunityIncome> {
    const response = await apiClient.get(`${this.BASE_URL}/${incomeId}`);
    return response.data;
  }

  static async createCommunityIncome(data: CreateCommunityIncomeRequest): Promise<CommunityIncome> {
    const response = await apiClient.post(this.BASE_URL, data);
    return response.data;
  }

  static async updateCommunityIncome(
    incomeId: string,
    data: Partial<CreateCommunityIncomeRequest>,
  ): Promise<CommunityIncome> {
    const response = await apiClient.put(`${this.BASE_URL}/${incomeId}`, data);
    return response.data;
  }

  static async deleteCommunityIncome(incomeId: string): Promise<void> {
    await apiClient.delete(`${this.BASE_URL}/${incomeId}`);
  }
}
