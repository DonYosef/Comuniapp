import { api } from '@/lib/api';

export interface Announcement {
  id: string;
  communityId: string;
  createdById: string;
  title: string;
  content: string;
  type: 'GENERAL' | 'URGENT' | 'MAINTENANCE' | 'SECURITY' | 'SOCIAL';
  isActive: boolean;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
  community: {
    id: string;
    name: string;
    address: string;
  };
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
}

export interface CreateAnnouncementData {
  communityId: string;
  title: string;
  content: string;
  type?: 'GENERAL' | 'URGENT' | 'MAINTENANCE' | 'SECURITY' | 'SOCIAL';
}

export interface UpdateAnnouncementData {
  title?: string;
  content?: string;
  type?: 'GENERAL' | 'URGENT' | 'MAINTENANCE' | 'SECURITY' | 'SOCIAL';
  isActive?: boolean;
}

export class AnnouncementsService {
  static async getAll(): Promise<Announcement[]> {
    const response = await api.get('/announcements');
    return response.data;
  }

  static async getByCommunity(communityId: string): Promise<Announcement[]> {
    const response = await api.get(`/announcements/community/${communityId}`);
    return response.data;
  }

  static async getById(id: string): Promise<Announcement> {
    const response = await api.get(`/announcements/${id}`);
    return response.data;
  }

  static async create(data: CreateAnnouncementData): Promise<Announcement> {
    const response = await api.post('/announcements', data);
    return response.data;
  }

  static async update(id: string, data: UpdateAnnouncementData): Promise<Announcement> {
    const response = await api.patch(`/announcements/${id}`, data);
    return response.data;
  }

  static async delete(id: string): Promise<void> {
    await api.delete(`/announcements/${id}`);
  }
}
