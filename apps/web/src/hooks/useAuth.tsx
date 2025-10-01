'use client';

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import AuthService from '@/services/authService';

interface User {
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
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (roleName: string) => boolean;
  hasPermission: (permission: string) => boolean;
  isAdmin: () => boolean;
  getCommunities: () => Array<{ id: string; name: string; address: string; status: string }>;
  hasCommunityAccess: (communityId: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Verificar si hay un token válido al cargar la app
    const storedToken = AuthService.getToken();
    if (storedToken && !AuthService.isTokenExpired()) {
      setToken(storedToken);

      // Decodificar el token para obtener información del usuario
      try {
        const payload = JSON.parse(atob(storedToken.split('.')[1]));
        setUser({
          id: payload.sub,
          email: payload.email,
          name: payload.name || 'Usuario',
          organizationId: payload.organizationId,
          roles: payload.roles || [],
          communities: payload.communities || [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      } catch (error) {
        console.error('Error al decodificar el token:', error);
        // Si hay error, limpiar el token
        AuthService.logout();
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await AuthService.login({ email, password });
      setUser(response.user);
      setToken(response.accessToken);

      // Forzar actualización del estado
      setIsLoading(false);
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    await AuthService.logout();
    setUser(null);
    setToken(null);
    // Forzar actualización del estado para evitar problemas de sincronización
    setIsLoading(false);
  };

  // Función para verificar si el usuario tiene un rol específico
  const hasRole = (roleName: string): boolean => {
    if (!user?.roles) return false;
    return user.roles.some((role) => role.name === roleName);
  };

  // Función para verificar si el usuario tiene un permiso específico
  const hasPermission = (permission: string): boolean => {
    if (!user?.roles) return false;
    return user.roles.some((role) => role.permissions.includes(permission));
  };

  // Función para verificar si el usuario es administrador
  const isAdmin = (): boolean => {
    return hasRole('SUPER_ADMIN') || hasRole('COMMUNITY_ADMIN');
  };

  // Función para obtener las comunidades del usuario
  const getCommunities = (): Array<{
    id: string;
    name: string;
    address: string;
    status: string;
  }> => {
    if (!user?.communities) return [];
    return user.communities.filter((community) => community.status === 'ACTIVE');
  };

  // Función para verificar si el usuario tiene acceso a una comunidad específica
  const hasCommunityAccess = (communityId: string): boolean => {
    if (!user?.communities) return false;
    return user.communities.some(
      (community) => community.id === communityId && community.status === 'ACTIVE',
    );
  };

  const value = {
    user,
    token,
    isAuthenticated: !!token && !!user,
    isLoading,
    login,
    logout,
    hasRole,
    hasPermission,
    isAdmin,
    getCommunities,
    hasCommunityAccess,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
