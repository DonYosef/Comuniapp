import { api } from '@/lib/api';

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

    // Guardar token en localStorage y cookies
    if (response.data.accessToken) {
      localStorage.setItem('token', response.data.accessToken);

      // También guardar en cookies para el middleware
      document.cookie = `token=${response.data.accessToken}; path=/; max-age=${7 * 24 * 60 * 60}; secure; samesite=strict`;
    }

    return response.data;
  }

  // Logout
  static async logout(): Promise<void> {
    try {
      // Llamar al endpoint de logout del backend si hay token
      const token = this.getToken();
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
      // No importa si falla el logout del backend, continuamos con la limpieza local
      console.warn('Error al cerrar sesión en el servidor:', error);
    } finally {
      // Limpiar datos locales independientemente del resultado del backend
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      // Limpiar cookies también
      document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      document.cookie =
        'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; secure; samesite=strict';

      // Limpiar sessionStorage
      sessionStorage.clear();

      // Redirigir al login si es necesario
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
  }

  // Verificar si está autenticado
  static isAuthenticated(): boolean {
    const token = localStorage.getItem('token');
    return !!token;
  }

  // Obtener token
  static getToken(): string | null {
    return localStorage.getItem('token');
  }

  // Verificar si el token está expirado (básico)
  static isTokenExpired(): boolean {
    const token = this.getToken();
    if (!token) return true;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp < currentTime;
    } catch {
      return true;
    }
  }
}

export default AuthService;
