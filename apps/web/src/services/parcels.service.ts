import { apiClient } from './api';

export interface ParcelFormData {
  id?: string;
  unitId: string;
  description: string;
  sender?: string;
  senderPhone?: string;
  recipientName?: string;
  recipientResidence?: string;
  recipientPhone?: string;
  recipientEmail?: string;
  conciergeName?: string;
  conciergePhone?: string;
  notes?: string;
  receivedAt?: Date;
  retrievedAt?: Date | null;
  status?: 'RECEIVED' | 'RETRIEVED' | 'EXPIRED';
}

export interface ParcelResponse {
  id: string;
  unitId: string;
  unitNumber: string;
  communityName: string;
  description: string;
  sender?: string;
  senderPhone?: string;
  recipientName?: string;
  recipientResidence?: string;
  recipientPhone?: string;
  recipientEmail?: string;
  conciergeName?: string;
  conciergePhone?: string;
  notes?: string;
  receivedAt: string;
  retrievedAt?: string | null;
  status: 'RECEIVED' | 'RETRIEVED' | 'EXPIRED';
  createdAt: string;
  updatedAt: string;
  residents: Array<{
    id: string;
    name: string;
    email: string;
    phone?: string;
    status: string;
  }>;
}

export interface UnitResponse {
  id: string;
  number: string;
  floor?: string;
  type: string;
  communityName: string;
  residents: Array<{
    id: string;
    name: string;
    email: string;
    phone?: string;
    status: string;
  }>;
}

export class ParcelsService {
  static async getParcels(unitId?: string): Promise<ParcelResponse[]> {
    const params = unitId ? { unitId } : {};
    const response = await apiClient.get('/parcels', { params });
    return response.data;
  }

  static async getParcel(id: string): Promise<ParcelResponse> {
    const response = await apiClient.get(`/parcels/${id}`);
    return response.data;
  }

  static async createParcel(data: ParcelFormData): Promise<ParcelResponse> {
    const response = await apiClient.post('/parcels', data);
    return response.data;
  }

  static async updateParcel(id: string, data: Partial<ParcelFormData>): Promise<ParcelResponse> {
    const response = await apiClient.patch(`/parcels/${id}`, data);
    return response.data;
  }

  static async markAsRetrieved(id: string): Promise<ParcelResponse> {
    const response = await apiClient.patch(`/parcels/${id}/mark-retrieved`);
    return response.data;
  }

  static async deleteParcel(id: string): Promise<void> {
    await apiClient.delete(`/parcels/${id}`);
  }

  static async getAvailableUnits(communityId?: string): Promise<UnitResponse[]> {
    const params = communityId ? { communityId } : {};
    const response = await apiClient.get('/parcels/units/available', { params });
    return response.data;
  }
}
