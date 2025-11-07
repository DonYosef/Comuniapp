import api from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: {
    id: string;
    email: string;
    name: string;
    organizationId: string | null;
    roles?: Array<{
      id: string;
      name: string;
      permissions: string[];
    }>;
    communities?: Array<{
      id: string;
      name: string;
      address: string;
      status: string;
    }>;
    userUnits?: Array<{
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
    }>;
    createdAt: string;
    updatedAt: string;
  };
  accessToken: string;
  organizationId?: string;
}

export class AuthService {
  // Login
  static async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>('/auth/login', credentials);

    // Guardar token en AsyncStorage
    if (response.data.accessToken) {
      await AsyncStorage.setItem('token', response.data.accessToken);
      await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
    }

    return response.data;
  }

  // Logout
  static async logout(): Promise<void> {
    try {
      const token = await this.getToken();
      if (token) {
        await api.post(
          '/auth/logout',
          {},
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
      }
    } catch (error) {
      console.warn('Error al cerrar sesión en el servidor:', error);
    } finally {
      // Limpiar datos locales
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
    }
  }

  // Verificar si está autenticado
  static async isAuthenticated(): Promise<boolean> {
    const token = await AsyncStorage.getItem('token');
    return !!token;
  }

  // Obtener token
  static async getToken(): Promise<string | null> {
    return await AsyncStorage.getItem('token');
  }

  // Obtener usuario
  static async getUser(): Promise<LoginResponse['user'] | null> {
    const userStr = await AsyncStorage.getItem('user');
    if (userStr) {
      return JSON.parse(userStr);
    }
    return null;
  }
}
