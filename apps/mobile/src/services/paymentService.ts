import api from '../config/api';

export interface PaymentResponse {
  checkoutUrl: string;
  paymentId: string;
}

export class PaymentService {
  static async createExpensePayment(expenseId: string): Promise<PaymentResponse> {
    const response = await api.post<PaymentResponse>(`/payments/expense/${expenseId}`);
    return response.data;
  }
}
