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
    const response = await api.post<UserResponseDto>('/users', userData);
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
