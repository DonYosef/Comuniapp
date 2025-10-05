import { api } from '@/lib/api';
import { User, CreateUserDto, UpdateUserDto, UserResponseDto, ApiResponse } from '@/types/api';

export class UserService {
  // Obtener todos los usuarios (método legacy - mantener para compatibilidad)
  static async getAllUsers(): Promise<UserResponseDto[]> {
    const response = await api.get<UserResponseDto[]>('/users');
    console.log('🔍 [UserService] getAllUsers - Respuesta completa del backend:');
    console.log('- Total usuarios:', response.data.length);
    if (response.data.length > 0) {
      console.log('- Primer usuario:', JSON.stringify(response.data[0], null, 2));
      console.log('- Roles del primer usuario:', response.data[0].roles);
      console.log('- UserUnits del primer usuario:', response.data[0].userUnits);
      console.log('- CommunityAdmins del primer usuario:', response.data[0].communityAdmins);
    }
    return response.data;
  }

  // Obtener usuarios con paginación
  static async getUsersPaginated(
    params: {
      page?: number;
      limit?: number;
      search?: string;
      status?: string;
      role?: string;
    } = {},
  ): Promise<{
    users: UserResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.search) queryParams.append('search', params.search);
    if (params.status) queryParams.append('status', params.status);
    if (params.role) queryParams.append('role', params.role);

    const response = await api.get<{
      users: UserResponseDto[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>(`/users?${queryParams.toString()}`);

    console.log('🔍 [UserService] getUsersPaginated - Respuesta:', {
      total: response.data.total,
      page: response.data.page,
      limit: response.data.limit,
      totalPages: response.data.totalPages,
      usersCount: response.data.users.length,
    });

    return response.data;
  }

  // Obtener un usuario por ID
  static async getUserById(id: string): Promise<UserResponseDto> {
    const response = await api.get<UserResponseDto>(`/users/${id}`);
    return response.data;
  }

  // Crear un nuevo usuario
  static async createUser(userData: CreateUserDto): Promise<UserResponseDto> {
    console.log('🔍 [UserService] Datos enviados:', JSON.stringify(userData, null, 2));
    console.log('📊 [UserService] Análisis de campos enviados:');
    console.log('- email:', userData.email, '(tipo:', typeof userData.email, ')');
    console.log('- name:', userData.name, '(tipo:', typeof userData.name, ')');
    console.log('- phone:', userData.phone, '(tipo:', typeof userData.phone, ')');
    console.log(
      '- organizationId:',
      userData.organizationId,
      '(tipo:',
      typeof userData.organizationId,
      ')',
    );
    console.log('- roleName:', userData.roleName, '(tipo:', typeof userData.roleName, ')');
    console.log('- unitId:', userData.unitId, '(tipo:', typeof userData.unitId, ')');

    try {
      console.log('🚀 [UserService] Enviando petición POST a /users...');
      const response = await api.post<UserResponseDto>('/users', userData);
      console.log('✅ [UserService] Petición exitosa - Status:', response.status);
      console.log(
        '✅ [UserService] Usuario creado - respuesta:',
        JSON.stringify(response.data, null, 2),
      );
      return response.data;
    } catch (error: any) {
      console.error('❌ [UserService] Error en la petición:');
      console.error('   - Status:', error.response?.status);
      console.error('   - StatusText:', error.response?.statusText);
      console.error('   - Data:', error.response?.data);
      console.error('   - URL:', error.config?.url);
      console.error('   - Method:', error.config?.method);
      console.error('   - Headers:', error.config?.headers);
      throw error;
    }
  }

  // Actualizar un usuario
  static async updateUser(id: string, userData: UpdateUserDto): Promise<UserResponseDto> {
    const response = await api.patch<UserResponseDto>(`/users/${id}`, userData);
    return response.data;
  }

  // Eliminar un usuario
  static async deleteUser(id: string): Promise<void> {
    await api.delete(`/users/${id}`);
  }

  // Obtener usuarios por estado
  static async getUsersByStatus(
    status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED',
  ): Promise<UserResponseDto[]> {
    const response = await api.get<UserResponseDto[]>(`/users?status=${status}`);
    return response.data;
  }

  // Buscar usuarios
  static async searchUsers(query: string): Promise<UserResponseDto[]> {
    const response = await api.get<UserResponseDto[]>(`/users?search=${encodeURIComponent(query)}`);
    return response.data;
  }
}

export default UserService;
