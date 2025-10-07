import { apiClient } from '@/services/api/api-client';

export interface Community {
  id: string;
  name: string;
  address: string;
  description?: string;
  phone?: string;
  email?: string;
  website?: string;
  type: 'CONDOMINIO' | 'EDIFICIO' | 'RESIDENCIAL';
  totalUnits?: number;
  constructionYear?: number;
  floors?: number;
  unitsPerFloor?: number;
  imageUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  organizationId: string;
  createdById: string;
  units?: Unit[];
  commonSpaces?: CommonSpace[];
  _count?: {
    units: number;
    commonSpaces: number;
  };
}

export interface Unit {
  id: string;
  number: string;
  floor?: string;
  type: 'APARTMENT' | 'HOUSE' | 'OFFICE' | 'COMMERCIAL';
  isActive: boolean;
  communityId: string;
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
  createdAt: string;
  updatedAt: string;
}

export interface CreateCommunityDto {
  name: string;
  address: string;
  description?: string;
  phone?: string;
  email?: string;
  website?: string;
  type: 'CONDOMINIO' | 'EDIFICIO' | 'RESIDENCIAL';
  totalUnits?: number;
  constructionYear?: number;
  floors?: number;
  unitsPerFloor?: number;
  buildingStructure?: Record<string, string[]>;
  imageUrl?: string;
}

export interface CreateUnitDto {
  number: string;
  floor?: string;
  type?: 'APARTMENT' | 'HOUSE' | 'OFFICE' | 'COMMERCIAL';
}

// Alias para compatibilidad con el componente
export type CommunityFormData = CreateCommunityDto;

export class CommunityService {
  // Obtener todas las comunidades del usuario
  async getCommunities(endpoint: string = '/communities'): Promise<Community | Community[]> {
    const response = await apiClient.get<Community | Community[]>(endpoint);
    return response.data;
  }

  // Obtener una comunidad por ID
  async getCommunityById(id: string): Promise<Community> {
    const response = await apiClient.get<Community>(`/communities/${id}`);
    return response.data;
  }

  // Crear una nueva comunidad
  async createCommunity(communityData: CreateCommunityDto): Promise<Community> {
    const response = await apiClient.post<Community>('/communities', communityData);
    return response.data;
  }

  // Actualizar una comunidad
  async updateCommunity(
    id: string,
    communityData: Partial<CreateCommunityDto>,
  ): Promise<Community> {
    const response = await apiClient.patch<Community>(`/communities/${id}`, communityData);
    return response.data;
  }

  // Eliminar una comunidad
  async deleteCommunity(id: string): Promise<void> {
    await apiClient.delete(`/communities/${id}`);
  }

  // Obtener unidades de una comunidad
  async getCommunityUnits(communityId: string): Promise<Unit[]> {
    const response = await apiClient.get<Unit[]>(`/communities/${communityId}/units`);
    return response.data;
  }

  // Agregar una unidad a una comunidad
  async addUnit(communityId: string, unitData: CreateUnitDto): Promise<Unit> {
    const response = await apiClient.post<Unit>(`/communities/${communityId}/units`, unitData);
    return response.data;
  }

  // Eliminar una unidad
  async removeUnit(unitId: string): Promise<void> {
    await apiClient.delete(`/communities/units/${unitId}`);
  }

  // Eliminar un espacio común
  async removeCommonSpace(spaceId: string): Promise<void> {
    await apiClient.delete(`/communities/common-spaces/${spaceId}`);
  }

  // Métodos estáticos para compatibilidad
  static async getCommunities(endpoint: string = '/communities'): Promise<Community | Community[]> {
    const response = await apiClient.get<Community | Community[]>(endpoint);
    return response.data;
  }

  static async getCommunityById(id: string): Promise<Community> {
    const response = await apiClient.get<Community>(`/communities/${id}`);
    return response.data;
  }

  static async createCommunity(communityData: CreateCommunityDto): Promise<Community> {
    const response = await apiClient.post<Community>('/communities', communityData);
    return response.data;
  }

  static async updateCommunity(
    id: string,
    communityData: Partial<CreateCommunityDto>,
  ): Promise<Community> {
    const response = await apiClient.patch<Community>(`/communities/${id}`, communityData);
    return response.data;
  }

  static async deleteCommunity(id: string): Promise<void> {
    await apiClient.delete(`/communities/${id}`);
  }

  static async getCommunityUnits(communityId: string): Promise<Unit[]> {
    const response = await apiClient.get<Unit[]>(`/communities/${communityId}/units`);
    return response.data;
  }

  static async addUnit(communityId: string, unitData: CreateUnitDto): Promise<Unit> {
    const response = await apiClient.post<Unit>(`/communities/${communityId}/units`, unitData);
    return response.data;
  }

  static async removeUnit(unitId: string): Promise<void> {
    await apiClient.delete(`/communities/units/${unitId}`);
  }

  static async removeCommonSpace(spaceId: string): Promise<void> {
    await apiClient.delete(`/communities/common-spaces/${spaceId}`);
  }
}

// Crear una instancia del servicio para usar directamente
export const communityService = new CommunityService();

export default CommunityService;
