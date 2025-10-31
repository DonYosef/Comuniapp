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

export interface CommonSpace {
  id: string;
  name: string;
  quantity: number;
  description?: string;
  isActive: boolean;
  communityId: string;
  community: {
    id: string;
    name: string;
  };
  schedules?: Array<{
    id: string;
    dayOfWeek: string;
    startTime: string;
    endTime: string;
    isActive: boolean;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReservationRequest {
  commonSpaceId: string;
  unitId: string;
  reservationDate: string;
  startTime: string;
  endTime: string;
}

export interface UserUnit {
  id: string;
  status: string;
  unit: {
    id: string;
    number: string;
    floor?: string;
    community: {
      id: string;
      name: string;
    };
  };
}

export class ResidentsService {
  private static readonly BASE_URL = '/residents';

  static async getMyReservations(): Promise<Reservation[]> {
    const response = await apiClient.get<Reservation[]>(`${this.BASE_URL}/my-reservations`);
    return response.data;
  }

  static async createReservation(reservationData: CreateReservationRequest): Promise<Reservation> {
    const response = await apiClient.post<Reservation>(
      `${this.BASE_URL}/reservations`,
      reservationData,
    );
    return response.data;
  }

  static async getMyCommonSpaces(): Promise<CommonSpace[]> {
    const response = await apiClient.get<CommonSpace[]>(`${this.BASE_URL}/common-spaces`);
    return response.data;
  }

  static async getMyUnits(): Promise<UserUnit[]> {
    const response = await apiClient.get<UserUnit[]>(`${this.BASE_URL}/my-units`);
    return response.data;
  }
}
