import { apiClient } from './api/api-client';

export interface DashboardStats {
  role: string;
  stats: {
    totalUsers?: number;
    totalCommunities?: number;
    totalUnits?: number;
    totalResidents?: number;
    totalExpenses?: number;
    pendingExpenses?: number;
    totalReservations?: number;
    pendingReservations?: number;
    totalVisitors?: number;
    pendingVisitors?: number;
    totalParcels?: number;
    pendingParcels?: number;
    totalAnnouncements?: number;
  };
  recentActivity?: {
    newUsers?: number;
    newVisitors?: number;
    newParcels?: number;
  };
  financialSummary?: {
    totalExpenses: number;
    totalIncomes: number;
    balance: number;
  };
  communities?: Array<{
    id: string;
    name: string;
    address: string;
    type?: string;
    totalUnits?: number;
    floors?: number;
    constructionYear?: number;
    phone?: string;
    email?: string;
    website?: string;
    description?: string;
    isActive: boolean;
  }>;
  units?: Array<{
    id: string;
    number: string;
    floor?: string;
    community: {
      id: string;
      name: string;
      address: string;
    };
  }>;
  community?: {
    id: string;
    name: string;
    address: string;
  };
  lastPayment?: {
    id: string;
    amount: number;
    status: string;
    paymentDate: string | null;
    createdAt: string;
    method: string;
    expense: {
      id: string;
      concept: string;
      amount: number;
      status: string;
    };
  } | null;
  recentAnnouncements?: Array<{
    id: string;
    title: string;
    content: string;
    type: string;
    publishedAt: string;
    community: {
      id: string;
      name: string;
    };
  }>;
  monthlyPayments?: Array<{
    month: string;
    amount: number;
  }>;
}

export class DashboardService {
  private static readonly BASE_URL = '/communities';

  static async getDashboardStats(): Promise<DashboardStats> {
    try {
      const url = `${this.BASE_URL}/dashboard/stats`;
      console.log('📊 [DashboardService] Fetching dashboard stats from:', url);
      const response = await apiClient.get<DashboardStats>(url);
      console.log('✅ [DashboardService] Dashboard stats received:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ [DashboardService] Error fetching dashboard stats:', {
        message: error?.message,
        response: error?.response?.data,
        status: error?.response?.status,
        statusText: error?.response?.statusText,
        url: error?.config?.url,
        baseURL: error?.config?.baseURL,
      });

      // Si es un error de red (sin respuesta del servidor)
      if (!error?.response) {
        const networkError = new Error(
          `Error de conexión: No se pudo conectar con el servidor. Verifica que el servidor backend esté corriendo en ${error?.config?.baseURL || 'http://localhost:3001'}`,
        );
        console.error('🔴 Network Error:', networkError);
        throw networkError;
      }

      throw error;
    }
  }
}
