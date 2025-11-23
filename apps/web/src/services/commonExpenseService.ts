import { apiClient } from '@/services/api/api-client';
import {
  CreateCommonExpenseDto,
  CommonExpenseResponseDto,
  CommonExpenseSummaryDto,
  ProrrateMethod,
} from '@comuniapp/types';

export class CommonExpenseService {
  // Crear un nuevo ciclo de facturación de gastos comunes
  static async createCommonExpense(
    expenseData: CreateCommonExpenseDto,
  ): Promise<CommonExpenseResponseDto> {
    const response = await apiClient.post<CommonExpenseResponseDto>(
      '/common-expenses',
      expenseData,
    );
    return response.data;
  }

  // Obtener todos los gastos comunes de una comunidad
  static async getCommonExpensesByCommunity(
    communityId: string,
    period?: string,
  ): Promise<CommonExpenseSummaryDto[]> {
    const params = new URLSearchParams({ communityId });
    if (period) {
      params.append('period', period);
    }
    const response = await apiClient.get<CommonExpenseSummaryDto[]>(
      `/common-expenses?${params.toString()}`,
    );
    return response.data;
  }

  // Obtener detalles de un gasto común específico
  static async getCommonExpenseById(id: string): Promise<CommonExpenseResponseDto> {
    const response = await apiClient.get<CommonExpenseResponseDto>(`/common-expenses/${id}`);
    return response.data;
  }

  // Eliminar un gasto común completo (items y gastos prorrateados)
  static async deleteCommonExpense(id: string): Promise<void> {
    const response = await apiClient.delete(`/common-expenses/${id}`);
    // No necesitamos retornar nada, solo esperamos la confirmación
  }

  // Eliminar solo los gastos prorrateados (unitExpenses), mantiene los items del CommonExpense
  static async deleteProrratedExpenses(id: string): Promise<void> {
    const response = await apiClient.delete(`/common-expenses/${id}/prorated`);
    // No necesitamos retornar nada, solo esperamos la confirmación
  }

  // Prorratear un gasto común existente
  static async prorrateCommonExpense(id: string): Promise<CommonExpenseResponseDto> {
    const response = await apiClient.post<CommonExpenseResponseDto>(
      `/common-expenses/${id}/prorate`,
    );
    return response.data;
  }

  // Calcular previsualización del prorrateo
  static calculateProrratePreview(
    units: Array<{ id: string; number: string; coefficient: number }>,
    totalAmount: number,
    method: ProrrateMethod,
  ): Array<{ unitId: string; unitNumber: string; coefficient: number; amount: number }> {
    if (method === ProrrateMethod.EQUAL) {
      const amountPerUnit = totalAmount / units.length;
      return units.map((unit) => ({
        unitId: unit.id,
        unitNumber: unit.number,
        coefficient: unit.coefficient,
        amount: Math.round(amountPerUnit * 100) / 100,
      }));
    } else {
      // Método por coeficiente
      const totalCoefficient = units.reduce((sum, unit) => sum + unit.coefficient, 0);

      return units.map((unit) => {
        const amount = (totalAmount * unit.coefficient) / totalCoefficient;
        return {
          unitId: unit.id,
          unitNumber: unit.number,
          coefficient: unit.coefficient,
          amount: Math.round(amount * 100) / 100,
        };
      });
    }
  }

  // Validar formato de período (YYYY-MM)
  static validatePeriod(period: string): boolean {
    const periodRegex = /^\d{4}-\d{2}$/;
    if (!periodRegex.test(period)) {
      return false;
    }

    const [year, month] = period.split('-').map(Number);
    const date = new Date(year, month - 1);

    return date.getFullYear() === year && date.getMonth() === month - 1;
  }

  // Generar período actual (YYYY-MM)
  static getCurrentPeriod(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }

  // Generar período siguiente
  static getNextPeriod(currentPeriod: string): string {
    const [year, month] = currentPeriod.split('-').map(Number);
    const date = new Date(year, month); // month es 0-indexed, así que esto nos da el siguiente mes

    const nextYear = date.getFullYear();
    const nextMonth = String(date.getMonth() + 1).padStart(2, '0');
    return `${nextYear}-${nextMonth}`;
  }

  // Calcular estadísticas de un gasto común
  static calculateStats(expense: CommonExpenseSummaryDto) {
    const paidPercentage =
      expense.totalUnits > 0 ? (expense.paidUnits / expense.totalUnits) * 100 : 0;
    const paidAmount = (expense.totalAmount * expense.paidUnits) / expense.totalUnits;
    const pendingAmount = (expense.totalAmount * expense.pendingUnits) / expense.totalUnits;
    const overdueAmount = (expense.totalAmount * expense.overdueUnits) / expense.totalUnits;

    return {
      totalAmount: expense.totalAmount,
      totalUnits: expense.totalUnits,
      paidAmount: Math.round(paidAmount * 100) / 100,
      pendingAmount: Math.round(pendingAmount * 100) / 100,
      overdueAmount: Math.round(overdueAmount * 100) / 100,
      paymentPercentage: Math.round(paidPercentage * 100) / 100,
    };
  }
}

export default CommonExpenseService;
