import { api } from '@/lib/api';

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

export class CommunityService {
  // Obtener todas las comunidades del usuario
  static async getCommunities(): Promise<Community[]> {
    const response = await api.get<Community[]>('/communities');
    return response.data;
  }

  // Obtener una comunidad por ID
  static async getCommunityById(id: string): Promise<Community> {
    const response = await api.get<Community>(`/communities/${id}`);
    return response.data;
  }

  // Crear una nueva comunidad
  static async createCommunity(communityData: CreateCommunityDto): Promise<Community> {
    const response = await api.post<Community>('/communities', communityData);
    return response.data;
  }

  // Actualizar una comunidad
  static async updateCommunity(
    id: string,
    communityData: Partial<CreateCommunityDto>,
  ): Promise<Community> {
    const response = await api.patch<Community>(`/communities/${id}`, communityData);
    return response.data;
  }

  // Eliminar una comunidad
  static async deleteCommunity(id: string): Promise<void> {
    await api.delete(`/communities/${id}`);
  }

  // Obtener unidades de una comunidad
  static async getCommunityUnits(communityId: string): Promise<Unit[]> {
    const response = await api.get<Unit[]>(`/communities/${communityId}/units`);
    return response.data;
  }

  // Agregar una unidad a una comunidad
  static async addUnit(communityId: string, unitData: CreateUnitDto): Promise<Unit> {
    const response = await api.post<Unit>(`/communities/${communityId}/units`, unitData);
    return response.data;
  }

  // Eliminar una unidad
  static async removeUnit(unitId: string): Promise<void> {
    await api.delete(`/communities/units/${unitId}`);
  }

  // Eliminar un espacio común
  static async removeCommonSpace(spaceId: string): Promise<void> {
    await api.delete(`/communities/common-spaces/${spaceId}`);
  }
}

export default CommunityService;
