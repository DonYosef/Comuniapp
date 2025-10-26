import { apiClient } from './api';

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

export interface CreateCommunityIncomeDto {
  communityId: string;
  period: string;
  dueDate: string;
  prorrateMethod: 'EQUAL' | 'COEFFICIENT';
  items: {
    name: string;
    amount: number;
    description?: string;
    categoryId: string;
  }[];
}

export class CommunityIncomeService {
  // Obtener todos los ingresos de una comunidad
  static async getCommunityIncomes(
    communityId: string,
    period?: string,
  ): Promise<CommunityIncome[]> {
    try {
      console.log(
        '🔍 [CommunityIncomeService] getCommunityIncomes - communityId:',
        communityId,
        'period:',
        period,
      );
      const params: any = { communityId };
      if (period) {
        params.period = period;
      }
      const response = await apiClient.get<CommunityIncome[]>('/community-income', {
        params,
      });
      console.log('✅ [CommunityIncomeService] getCommunityIncomes - response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ [CommunityIncomeService] getCommunityIncomes - error:', error);
      throw error;
    }
  }

  // Obtener un ingreso específico por ID
  static async getCommunityIncomeById(incomeId: string): Promise<CommunityIncome> {
    try {
      console.log('🔍 [CommunityIncomeService] getCommunityIncomeById - incomeId:', incomeId);
      const response = await apiClient.get<CommunityIncome>(`/community-income/${incomeId}`);
      console.log('✅ [CommunityIncomeService] getCommunityIncomeById - response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ [CommunityIncomeService] getCommunityIncomeById - error:', error);
      throw error;
    }
  }

  // Crear un nuevo ingreso común
  static async createCommunityIncome(data: CreateCommunityIncomeDto): Promise<CommunityIncome> {
    try {
      console.log('🔍 [CommunityIncomeService] createCommunityIncome - data:', data);
      const response = await apiClient.post<CommunityIncome>('/community-income', data);
      console.log('✅ [CommunityIncomeService] createCommunityIncome - response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ [CommunityIncomeService] createCommunityIncome - error:', error);
      throw error;
    }
  }

  // Actualizar un ingreso existente
  static async updateCommunityIncome(
    incomeId: string,
    data: Partial<CreateCommunityIncomeDto>,
  ): Promise<CommunityIncome> {
    try {
      console.log(
        '🔍 [CommunityIncomeService] updateCommunityIncome - incomeId:',
        incomeId,
        'data:',
        data,
      );
      const response = await apiClient.put<CommunityIncome>(`/community-income/${incomeId}`, data);
      console.log('✅ [CommunityIncomeService] updateCommunityIncome - response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ [CommunityIncomeService] updateCommunityIncome - error:', error);
      throw error;
    }
  }

  // Eliminar un ingreso
  static async deleteCommunityIncome(incomeId: string): Promise<void> {
    try {
      console.log('🔍 [CommunityIncomeService] deleteCommunityIncome - incomeId:', incomeId);
      await apiClient.delete(`/community-income/${incomeId}`);
      console.log('✅ [CommunityIncomeService] deleteCommunityIncome - success');
    } catch (error) {
      console.error('❌ [CommunityIncomeService] deleteCommunityIncome - error:', error);
      throw error;
    }
  }

  // Eliminar un item específico de un ingreso
  static async deleteIncomeItem(incomeId: string, itemId: string): Promise<void> {
    try {
      console.log(
        '🔍 [CommunityIncomeService] deleteIncomeItem - incomeId:',
        incomeId,
        'itemId:',
        itemId,
      );
      await apiClient.delete(`/community-income/${incomeId}/items/${itemId}`);
      console.log('✅ [CommunityIncomeService] deleteIncomeItem - success');
    } catch (error) {
      console.error('❌ [CommunityIncomeService] deleteIncomeItem - error:', error);
      throw error;
    }
  }

  // Calcular estadísticas de ingresos
  static calculateIncomeStats(incomes: CommunityIncome[]) {
    const totalAmount = incomes.reduce((sum, income) => sum + income.totalAmount, 0);
    const totalItems = incomes.reduce((sum, income) => sum + income.items.length, 0);

    return {
      totalAmount,
      totalItems,
      averageAmount: incomes.length > 0 ? totalAmount / incomes.length : 0,
      totalIncomes: incomes.length,
    };
  }
}
