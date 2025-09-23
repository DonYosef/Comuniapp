import AuthService from './authService';
import { config } from '@/config/env';

export interface CommonSpace {
  id?: string;
  name: string;
  quantity: number;
  description?: string;
}

export interface Unit {
  id: string;
  number: string;
  floor?: string;
  type: 'APARTMENT' | 'HOUSE' | 'OFFICE' | 'COMMERCIAL';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CommunityFormData {
  name: string;
  description: string;
  address: string;
  phone?: string;
  email?: string;
  website?: string;
  type: 'CONDOMINIO' | 'EDIFICIO';
  totalUnits: number;
  constructionYear?: number;
  floors?: number;
  unitsPerFloor?: number;
  buildingStructure?: { [floor: number]: string[] };
  commonSpaces?: CommonSpace[];
  imageUrl?: string;
}

export interface Community {
  id: string;
  name: string;
  description?: string;
  address: string;
  phone?: string;
  email?: string;
  website?: string;
  type: 'CONDOMINIO' | 'EDIFICIO';
  totalUnits?: number;
  constructionYear?: number;
  floors?: number;
  unitsPerFloor?: number;
  buildingStructure?: { [floor: number]: string[] };
  imageUrl?: string;
  organizationId: string;
  createdById: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  organization?: {
    id: string;
    name: string;
  };
  commonSpaces?: CommonSpace[];
  units?: Unit[];
  _count?: {
    units: number;
  };
}

class CommunityService {
  private async getAuthHeaders() {
    const token = AuthService.getToken();
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  }

  async createCommunity(data: CommunityFormData): Promise<Community> {
    try {
      const response = await fetch(`${config.apiUrl}/communities`, {
        method: 'POST',
        headers: await this.getAuthHeaders(),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al crear la comunidad');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating community:', error);
      throw error;
    }
  }

  async getCommunities(): Promise<Community[]> {
    try {
      const response = await fetch(`${config.apiUrl}/communities`, {
        method: 'GET',
        headers: await this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al obtener las comunidades');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching communities:', error);
      throw error;
    }
  }

  async getCommunityById(id: string): Promise<Community> {
    try {
      const response = await fetch(`${config.apiUrl}/communities/${id}`, {
        method: 'GET',
        headers: await this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al obtener la comunidad');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching community:', error);
      throw error;
    }
  }

  async updateCommunity(id: string, data: Partial<CommunityFormData>): Promise<Community> {
    try {
      const response = await fetch(`${config.apiUrl}/communities/${id}`, {
        method: 'PATCH',
        headers: await this.getAuthHeaders(),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al actualizar la comunidad');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating community:', error);
      throw error;
    }
  }

  async deleteCommunity(id: string): Promise<void> {
    try {
      const response = await fetch(`${config.apiUrl}/communities/${id}`, {
        method: 'DELETE',
        headers: await this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al eliminar la comunidad');
      }
    } catch (error) {
      console.error('Error deleting community:', error);
      throw error;
    }
  }

  // Métodos para gestión de espacios comunes
  async addCommonSpace(
    communityId: string,
    spaceData: Omit<CommonSpace, 'id'>,
  ): Promise<CommonSpace> {
    try {
      const response = await fetch(`${config.apiUrl}/communities/${communityId}/common-spaces`, {
        method: 'POST',
        headers: await this.getAuthHeaders(),
        body: JSON.stringify(spaceData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al agregar el espacio común');
      }

      return await response.json();
    } catch (error) {
      console.error('Error adding common space:', error);
      throw error;
    }
  }

  async removeCommonSpace(spaceId: string): Promise<void> {
    try {
      const response = await fetch(`${config.apiUrl}/communities/common-spaces/${spaceId}`, {
        method: 'DELETE',
        headers: await this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al eliminar el espacio común');
      }
    } catch (error) {
      console.error('Error removing common space:', error);
      throw error;
    }
  }

  // Métodos para gestión de unidades
  async getCommunityUnits(communityId: string): Promise<Unit[]> {
    try {
      const response = await fetch(`${config.apiUrl}/communities/${communityId}/units`, {
        method: 'GET',
        headers: await this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al obtener las unidades');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching units:', error);
      throw error;
    }
  }

  async addUnit(
    communityId: string,
    unitData: { number: string; floor?: string; type?: string },
  ): Promise<Unit> {
    try {
      const response = await fetch(`${config.apiUrl}/communities/${communityId}/units`, {
        method: 'POST',
        headers: await this.getAuthHeaders(),
        body: JSON.stringify(unitData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al agregar la unidad');
      }

      return await response.json();
    } catch (error) {
      console.error('Error adding unit:', error);
      throw error;
    }
  }

  async removeUnit(unitId: string): Promise<void> {
    try {
      const response = await fetch(`${config.apiUrl}/communities/units/${unitId}`, {
        method: 'DELETE',
        headers: await this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al eliminar la unidad');
      }
    } catch (error) {
      console.error('Error removing unit:', error);
      throw error;
    }
  }
}

export const communityService = new CommunityService();
