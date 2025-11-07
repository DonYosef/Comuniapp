import api from '../config/api';

export interface Parcel {
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
}

export class ParcelsService {
  static async getMyParcels(): Promise<Parcel[]> {
    const response = await api.get<Parcel[]>('/parcels');
    return Array.isArray(response.data) ? response.data : [];
  }

  static async getParcel(id: string): Promise<Parcel> {
    const response = await api.get<Parcel>(`/parcels/${id}`);
    return response.data;
  }

  static async markAsRetrieved(id: string): Promise<Parcel> {
    const response = await api.patch<Parcel>(`/parcels/${id}/mark-retrieved`);
    return response.data;
  }
}
