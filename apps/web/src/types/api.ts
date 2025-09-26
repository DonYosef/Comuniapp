// Tipos que coinciden con el backend de NestJS

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserDto {
  email: string;
  name?: string;
  password: string;
  phone?: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  organizationId?: string;
  roleName?: 'SUPER_ADMIN' | 'COMMUNITY_ADMIN' | 'OWNER' | 'TENANT' | 'RESIDENT' | 'CONCIERGE';
  unitId?: string;
}

export interface UpdateUserDto {
  name?: string;
  phone?: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  unitId?: string;
}

export interface UserResponseDto {
  id: string;
  email: string;
  name: string;
  phone?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  organizationId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Role {
  id: string;
  name: 'ADMIN' | 'RESIDENT' | 'CONCIERGE';
  description?: string;
  permissions: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateRoleDto {
  name: 'ADMIN' | 'RESIDENT' | 'CONCIERGE';
  description?: string;
  permissions: string[];
}

export interface RoleResponseDto {
  id: string;
  name: 'ADMIN' | 'RESIDENT' | 'CONCIERGE';
  description?: string;
  permissions: string[];
  createdAt: string;
  updatedAt: string;
}

// Tipos para la respuesta de la API
export interface ApiResponse<T> {
  data: T;
  message?: string;
  status: number;
}

export interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
}
