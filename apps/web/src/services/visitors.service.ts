import { apiClient } from './api';

export interface VisitorFormData {
  id?: string;
  unitId: string;
  hostUserId: string;
  visitorName: string;
  visitorDocument: string;
  visitorPhone?: string;
  visitorEmail?: string;
  residentName?: string;
  residentPhone?: string;
  visitPurpose: 'personal' | 'business' | 'maintenance' | 'delivery' | 'other';
  expectedArrival: string;
  expectedDeparture: string;
  vehicleInfo?: string;
  notes?: string;
  entryDate?: Date;
  exitDate?: Date;
  status?: 'SCHEDULED' | 'ARRIVED' | 'COMPLETED' | 'CANCELLED';
}

export interface VisitorResponse {
  id: string;
  unitId: string;
  unitNumber: string;
  communityName: string;
  hostUserId: string;
  hostName: string;
  hostEmail: string;
  hostPhone?: string;
  visitorName: string;
  visitorDocument: string;
  visitorPhone?: string;
  visitorEmail?: string;
  residentName?: string;
  residentPhone?: string;
  visitPurpose: string;
  expectedArrival: string;
  expectedDeparture: string;
  vehicleInfo?: string;
  notes?: string;
  entryDate?: string;
  exitDate?: string;
  status: 'SCHEDULED' | 'ARRIVED' | 'COMPLETED' | 'CANCELLED';
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

export class VisitorsService {
  static async getVisitors(unitId?: string): Promise<VisitorResponse[]> {
    const params = unitId ? { unitId } : {};
    const response = await apiClient.get('/visitors', { params });
    return response.data;
  }

  static async getVisitor(id: string): Promise<VisitorResponse> {
    const response = await apiClient.get(`/visitors/${id}`);
    return response.data;
  }

  static async createVisitor(data: VisitorFormData): Promise<VisitorResponse> {
    const response = await apiClient.post('/visitors', data);
    return response.data;
  }

  static async updateVisitor(id: string, data: Partial<VisitorFormData>): Promise<VisitorResponse> {
    const response = await apiClient.patch(`/visitors/${id}`, data);
    return response.data;
  }

  static async markAsArrived(id: string): Promise<VisitorResponse> {
    const response = await apiClient.patch(`/visitors/${id}/mark-arrived`);
    return response.data;
  }

  static async markAsCompleted(id: string): Promise<VisitorResponse> {
    const response = await apiClient.patch(`/visitors/${id}/mark-completed`);
    return response.data;
  }

  static async deleteVisitor(id: string): Promise<void> {
    await apiClient.delete(`/visitors/${id}`);
  }
}
