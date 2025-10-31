import { apiClient } from '@/services/api/api-client';

export interface Reservation {
  id: string;
  reservationDate: string;
  startTime: string;
  endTime: string;
  status: string;
  commonSpace: {
    id: string;
    name: string;
    description?: string;
  };
  unit: {
    id: string;
    number: string;
    floor?: string;
    community: {
      id: string;
      name: string;
    };
  };
  createdAt: string;
  updatedAt: string;
}

export class ResidentsService {
  private static readonly BASE_URL = '/residents';

  static async getMyReservations(): Promise<Reservation[]> {
    const response = await apiClient.get<Reservation[]>(`${this.BASE_URL}/my-reservations`);
    return response.data;
  }
}
