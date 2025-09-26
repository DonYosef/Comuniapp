import { api } from '@/lib/api';
import { User, CreateUserDto, UpdateUserDto, UserResponseDto, ApiResponse } from '@/types/api';

export class UserService {
  // Obtener todos los usuarios
  static async getAllUsers(): Promise<UserResponseDto[]> {
    const response = await api.get<UserResponseDto[]>('/users');
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

    const response = await api.post<UserResponseDto>('/users', userData);

    console.log(
      '✅ [UserService] Usuario creado - respuesta:',
      JSON.stringify(response.data, null, 2),
    );
    return response.data;
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
