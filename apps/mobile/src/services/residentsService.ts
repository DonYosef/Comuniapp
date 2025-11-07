import api from '../config/api';

export interface Expense {
  id: string;
  amount: number;
  concept: string;
  description?: string;
  dueDate: string;
  status: 'PAID' | 'PENDING' | 'OVERDUE' | 'CANCELLED';
  createdAt: string;
  updatedAt: string;
  communityExpenseId?: string;
}

export interface Reservation {
  id: string;
  commonSpaceId: string;
  unitId: string;
  reservationDate: string;
  startTime: string;
  endTime: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
  createdAt: string;
  updatedAt: string;
  commonSpace?: {
    id: string;
    name: string;
    description?: string;
    communityId: string;
  };
  unit?: {
    id: string;
    number: string;
    floor?: string;
    community: {
      id: string;
      name: string;
      address: string;
    };
  };
}

export interface CommonSpace {
  id: string;
  name: string;
  description?: string;
  quantity?: number;
  communityId: string;
  isActive?: boolean;
  community?: {
    id: string;
    name: string;
  };
  schedules?: Array<{
    id: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    isActive: boolean;
  }>;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserUnit {
  id: string;
  unit: {
    id: string;
    number: string;
    floor?: string;
    community: {
      id: string;
      name: string;
      address: string;
    };
  };
}

export interface CreateReservationRequest {
  commonSpaceId: string;
  unitId: string;
  reservationDate: string;
  startTime: string;
  endTime: string;
}

export interface Visitor {
  id: string;
  visitorName: string;
  visitorEmail?: string;
  visitorPhone: string;
  purpose: 'personal' | 'business' | 'maintenance' | 'delivery' | 'other';
  visitDate: string;
  arrivalTime?: string;
  departureTime?: string;
  status: 'PENDING' | 'ARRIVED' | 'COMPLETED' | 'CANCELLED';
  unitId: string;
  unit?: {
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
  // Gastos
  static async getMyExpenses(): Promise<Expense[]> {
    const response = await api.get<Expense[]>('/residents/my-expenses');
    return response.data.map((e) => ({
      ...e,
      amount: Number(e.amount),
    }));
  }

  // Reservas
  static async getMyReservations(): Promise<Reservation[]> {
    const response = await api.get<Reservation[]>('/residents/my-reservations');
    return Array.isArray(response.data) ? response.data : [];
  }

  static async getMyCommonSpaces(): Promise<CommonSpace[]> {
    const response = await api.get<CommonSpace[]>('/residents/common-spaces');
    return Array.isArray(response.data) ? response.data : [];
  }

  static async getMyUnits(): Promise<UserUnit[]> {
    const response = await api.get<UserUnit[]>('/residents/my-units');
    return Array.isArray(response.data) ? response.data : [];
  }

  static async createReservation(data: CreateReservationRequest): Promise<Reservation> {
    const response = await api.post<Reservation>('/residents/reservations', data);
    return response.data;
  }

  // Visitas
  static async getMyVisits(): Promise<Visitor[]> {
    const response = await api.get<Visitor[]>('/visitors/my-visits');
    return Array.isArray(response.data) ? response.data : [];
  }

  static async createVisit(data: {
    visitorName: string;
    visitorId: string;
    visitorEmail?: string;
    visitorPhone?: string;
    unitId: string;
    residentName: string;
    residentPhone?: string;
    visitPurpose: 'personal' | 'business' | 'maintenance' | 'delivery' | 'other';
    expectedArrival: string;
    expectedDeparture?: string;
    vehicleInfo?: string;
    notes?: string;
  }): Promise<Visitor> {
    // Mapear los campos del móvil al formato esperado por el backend
    const backendData = {
      visitorName: data.visitorName,
      visitorDocument: data.visitorId, // El backend espera visitorDocument
      visitorPhone: data.visitorPhone,
      visitorEmail: data.visitorEmail,
      unitId: data.unitId,
      residentName: data.residentName,
      residentPhone: data.residentPhone,
      visitPurpose: data.visitPurpose,
      expectedArrival: data.expectedArrival,
      expectedDeparture: data.expectedDeparture,
      vehicleInfo: data.vehicleInfo,
      notes: data.notes,
    };
    const response = await api.post<Visitor>('/visitors', backendData);
    return response.data;
  }

  static async updateVisit(id: string, data: Partial<Visitor>): Promise<Visitor> {
    const response = await api.patch<Visitor>(`/visitors/${id}`, data);
    return response.data;
  }

  static async markVisitAsArrived(id: string): Promise<Visitor> {
    const response = await api.patch<Visitor>(`/visitors/${id}/arrived`);
    return response.data;
  }

  static async markVisitAsCompleted(id: string): Promise<Visitor> {
    const response = await api.patch<Visitor>(`/visitors/${id}/completed`);
    return response.data;
  }
}
