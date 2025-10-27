import { api } from '@/lib/api';

export interface CreatePaymentResponse {
  success: boolean;
  checkoutUrl: string;
  paymentId: string;
  token: string;
}

export interface PaymentStatusResponse {
  success: boolean;
  flow: {
    status: number;
    statusText: string;
    flowOrder: string;
    commerceOrder: string;
    amount: number;
  };
  payment: {
    id: string;
    status: string;
    paymentDate: string | null;
    expense: {
      id: string;
      concept: string;
      amount: number;
      status: string;
    };
  } | null;
}

export class PaymentService {
  /**
   * Crea una orden de pago para un gasto específico
   */
  static async createExpensePayment(expenseId: string): Promise<CreatePaymentResponse> {
    try {
      console.log('💳 [PaymentService] Creating payment for expense:', expenseId);
      const response = await api.post<CreatePaymentResponse>(`/payments/expense/${expenseId}`);
      console.log('✅ [PaymentService] Payment created:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ [PaymentService] Error creating payment:', error);
      throw new Error(error.response?.data?.message || 'Error al crear la orden de pago');
    }
  }

  /**
   * Consulta el estado de un pago por token de Flow
   */
  static async getPaymentStatus(token: string): Promise<PaymentStatusResponse> {
    try {
      console.log('🔍 [PaymentService] Getting payment status for token:', token);
      const response = await api.get<PaymentStatusResponse>(
        `/payments/status?token=${encodeURIComponent(token)}`,
      );
      console.log('✅ [PaymentService] Payment status:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ [PaymentService] Error getting payment status:', error);
      throw new Error(error.response?.data?.message || 'Error al consultar el estado del pago');
    }
  }

  /**
   * Confirma un pago después de que Flow lo ha procesado exitosamente
   * Usa el endpoint autenticado para mayor seguridad
   */
  static async confirmPayment(token: string): Promise<void> {
    try {
      console.log('💳 [PaymentService] Confirming payment for token:', token);
      const response = await api.post('/payments/confirm', { token });
      console.log('✅ [PaymentService] Payment confirmed successfully:', response.data);
    } catch (error: any) {
      console.error('❌ [PaymentService] Error confirming payment:', error);
      throw new Error(error.response?.data?.message || 'Error al confirmar el pago');
    }
  }
}
