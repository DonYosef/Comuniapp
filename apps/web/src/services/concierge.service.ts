import { apiClient } from '@/services/api/api-client';

export interface CommonSpace {
  id: string;
  name: string;
  quantity: number;
  description?: string;
  isActive: boolean;
  communityId: string;
  schedules?: SpaceSchedule[];
  createdAt: string;
  updatedAt: string;
}

export interface SpaceSchedule {
  id: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

export interface Unit {
  id: string;
  number: string;
  floor?: string;
  type: string;
  isActive: boolean;
  communityId: string;
  userUnits: UserUnit[];
}

export interface UserUnit {
  id: string;
  status: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
}

export interface CreateReservationRequest {
  commonSpaceId: string;
  unitId: string;
  reservationDate: string;
  startTime: string;
  endTime: string;
}

export interface Reservation {
  id: string;
  reservationDate: string;
  startTime: string;
  endTime: string;
  status: string;
  commonSpace: CommonSpace;
  unit: Unit;
  createdAt: string;
  updatedAt: string;
}

export class ConciergeService {
  private static readonly BASE_URL = '/concierge';

  static async getCommonSpaces(communityId: string): Promise<CommonSpace[]> {
    const response = await apiClient.get<CommonSpace[]>(
      `${this.BASE_URL}/community/${communityId}/common-spaces`,
    );
    return response.data;
  }

  static async getUnits(communityId: string): Promise<Unit[]> {
    const response = await apiClient.get<Unit[]>(`${this.BASE_URL}/community/${communityId}/units`);
    return response.data;
  }

  static async createReservation(reservationData: CreateReservationRequest): Promise<Reservation> {
    const response = await apiClient.post<Reservation>(
      `${this.BASE_URL}/reservations`,
      reservationData,
    );
    return response.data;
  }

  static async getReservations(communityId: string): Promise<Reservation[]> {
    const response = await apiClient.get<Reservation[]>(
      `${this.BASE_URL}/community/${communityId}/reservations`,
    );
    return response.data;
  }

  static async getDebugInfo(communityId: string): Promise<any> {
    const response = await apiClient.get<any>(`${this.BASE_URL}/community/${communityId}/debug`);
    return response.data;
  }
}
