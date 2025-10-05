'use client';

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { useAuth } from './useAuth';
import AuthService from '@/services/authService';

interface Community {
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
}

interface Unit {
  id: string;
  number: string;
  floor?: string;
  type: 'APARTMENT' | 'HOUSE' | 'OFFICE' | 'COMMERCIAL';
  isActive: boolean;
  communityId: string;
  createdAt: string;
  updatedAt: string;
}

interface CommunityContextType {
  currentCommunity: Community | null;
  communities: Community[];
  units: Unit[];
  isLoading: boolean;
  setCurrentCommunity: (community: Community | null) => void;
  loadCommunities: () => Promise<void>;
  loadUnits: (communityId: string) => Promise<void>;
  refreshCurrentCommunity: () => Promise<void>;
}

const CommunityContext = createContext<CommunityContextType | undefined>(undefined);

export function CommunityProvider({ children }: { children: ReactNode }) {
  const [currentCommunity, setCurrentCommunity] = useState<Community | null>(null);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user, isAuthenticated } = useAuth();

  // Cargar comunidades del usuario
  const loadCommunities = async () => {
    if (!isAuthenticated || !user) {
      console.warn('⚠️ [useCommunity] loadCommunities - Usuario no autenticado');
      return;
    }

    setIsLoading(true);
    try {
      const token = AuthService.getToken();
      if (!token) {
        console.error('❌ [useCommunity] loadCommunities - Token no disponible');
        setCommunities([]);
        return;
      }

      // Para administradores, usar el endpoint completo de comunidades
      // Para residentes/concierges, usar el endpoint específico
      const isAdmin = user.roles?.some(
        (role: any) => role.name === 'SUPER_ADMIN' || role.name === 'COMMUNITY_ADMIN',
      );

      const endpoint = isAdmin ? 'communities' : 'communities/my-community';
      console.log('🔍 [useCommunity] Usando endpoint:', endpoint, 'para usuario:', user.email);

      const response = await fetch(`http://localhost:3001/${endpoint}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();

        if (isAdmin) {
          // Para administradores, data es un array
          if (Array.isArray(data)) {
            setCommunities(data);
            if (!currentCommunity && data.length > 0) {
              setCurrentCommunity(data[0]);
              // Cargar unidades de forma asíncrona para no bloquear
              loadUnits(data[0].id).catch((error) => {
                console.error(
                  '❌ [useCommunity] Error al cargar unidades después de cargar comunidades:',
                  error,
                );
              });
            }
          } else {
            console.warn(
              '⚠️ [useCommunity] loadCommunities - Respuesta de admin no es un array:',
              data,
            );
            setCommunities([]);
          }
        } else {
          // Para residentes, data es un objeto único o null
          if (data) {
            setCommunities([data]); // Convertir a array para consistencia
            if (!currentCommunity) {
              setCurrentCommunity(data);
              // Cargar unidades en paralelo para mejor rendimiento
              loadUnits(data.id).catch((error) => {
                console.error(
                  '❌ [useCommunity] Error al cargar unidades después de cargar comunidades:',
                  error,
                );
              });
            }
          } else {
            console.log('ℹ️ [useCommunity] loadCommunities - Usuario no tiene comunidad asignada');
            setCommunities([]);
          }
        }
      } else {
        let errorText = '';
        try {
          errorText = await response.text();
        } catch (textError) {
          console.warn('⚠️ [useCommunity] No se pudo leer el texto de error:', textError);
          errorText = 'No se pudo leer el mensaje de error';
        }

        console.error('❌ [useCommunity] Error al cargar comunidades:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText || 'Sin mensaje de error',
          url: response.url,
          endpoint: endpoint,
          headers: Object.fromEntries(response.headers.entries()),
        });
        setCommunities([]);
      }
    } catch (error) {
      console.error('❌ [useCommunity] Error al cargar comunidades:', {
        error: error instanceof Error ? error.message : 'Error desconocido',
        stack: error instanceof Error ? error.stack : undefined,
      });
      setCommunities([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Cargar unidades de una comunidad
  const loadUnits = async (communityId: string) => {
    if (!isAuthenticated || !user) {
      console.warn('⚠️ [useCommunity] loadUnits - Usuario no autenticado');
      return;
    }

    if (!communityId || communityId.trim() === '') {
      console.warn('⚠️ [useCommunity] loadUnits - ID de comunidad inválido:', communityId);
      setUnits([]);
      return;
    }

    try {
      const token = AuthService.getToken();
      if (!token) {
        console.error('❌ [useCommunity] loadUnits - Token no disponible');
        setUnits([]);
        return;
      }

      // Verificar si el usuario es SUPER_ADMIN
      const isSuperAdmin = user.roles?.some((role: any) => role.name === 'SUPER_ADMIN');
      const isCommunityAdmin = user.roles?.some((role: any) => role.name === 'COMMUNITY_ADMIN');

      // Para SUPER_ADMIN, no cargar unidades específicas de comunidad
      if (isSuperAdmin) {
        console.log(
          '🔍 [useCommunity] loadUnits - SUPER_ADMIN detectado, no cargando unidades específicas',
        );
        setUnits([]);
        return;
      }

      // Para COMMUNITY_ADMIN, usar el endpoint de unidades de la comunidad
      // Para residentes/concierges, usar el endpoint específico
      const endpoint = isCommunityAdmin
        ? `http://localhost:3001/communities/${communityId}/units`
        : 'http://localhost:3001/communities/my-units';

      console.log(
        '🔍 [useCommunity] loadUnits - usando endpoint:',
        endpoint,
        'para comunidad:',
        communityId,
      );

      const response = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          setUnits(data);
          console.log('✅ [useCommunity] Unidades cargadas:', data.length);
        } else {
          console.warn('⚠️ [useCommunity] loadUnits - Respuesta no es un array:', data);
          setUnits([]);
        }
      } else {
        let errorText = '';
        try {
          errorText = await response.text();
        } catch (textError) {
          console.warn('⚠️ [useCommunity] No se pudo leer el texto de error:', textError);
          errorText = 'No se pudo leer el mensaje de error';
        }

        console.error('❌ [useCommunity] Error al cargar unidades:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText || 'Sin mensaje de error',
          endpoint,
          communityId,
          url: response.url,
          headers: Object.fromEntries(response.headers.entries()),
        });
        setUnits([]);
      }
    } catch (error) {
      console.error('❌ [useCommunity] Error al cargar unidades:', {
        error: error instanceof Error ? error.message : 'Error desconocido',
        communityId,
        stack: error instanceof Error ? error.stack : undefined,
      });
      setUnits([]);
    }
  };

  // Refrescar comunidad actual
  const refreshCurrentCommunity = async () => {
    if (!currentCommunity) {
      console.warn('⚠️ [useCommunity] refreshCurrentCommunity - No hay comunidad actual');
      return;
    }

    if (!isAuthenticated || !user) {
      console.warn('⚠️ [useCommunity] refreshCurrentCommunity - Usuario no autenticado');
      return;
    }

    try {
      const token = AuthService.getToken();
      if (!token) {
        console.error('❌ [useCommunity] refreshCurrentCommunity - Token no disponible');
        return;
      }

      console.log('🔄 [useCommunity] Refrescando comunidad:', currentCommunity.id);

      const response = await fetch(`http://localhost:3001/communities/${currentCommunity.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentCommunity(data);
        console.log('✅ [useCommunity] Comunidad refrescada exitosamente');
      } else {
        let errorText = '';
        try {
          errorText = await response.text();
        } catch (textError) {
          console.warn('⚠️ [useCommunity] No se pudo leer el texto de error:', textError);
          errorText = 'No se pudo leer el mensaje de error';
        }

        console.error('❌ [useCommunity] Error al refrescar comunidad:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText || 'Sin mensaje de error',
          communityId: currentCommunity.id,
          url: response.url,
          headers: Object.fromEntries(response.headers.entries()),
        });
      }
    } catch (error) {
      console.error('❌ [useCommunity] Error al refrescar comunidad:', {
        error: error instanceof Error ? error.message : 'Error desconocido',
        communityId: currentCommunity.id,
        stack: error instanceof Error ? error.stack : undefined,
      });
    }
  };

  // Cargar comunidades cuando el usuario se autentica
  useEffect(() => {
    if (isAuthenticated && user) {
      loadCommunities().catch((error) => {
        console.error('❌ [useCommunity] Error en useEffect loadCommunities:', error);
      });
    }
  }, [isAuthenticated, user]);

  // Cargar unidades cuando cambia la comunidad actual (sin bloquear)
  useEffect(() => {
    if (currentCommunity && currentCommunity.id && currentCommunity.id.trim() !== '') {
      console.log(
        '🔄 [useCommunity] useEffect - Cargando unidades para comunidad:',
        currentCommunity.id,
      );
      // Cargar unidades en background sin bloquear la UI
      loadUnits(currentCommunity.id).catch((error) => {
        console.error('❌ [useCommunity] Error en useEffect loadUnits:', error);
      });
    } else if (currentCommunity) {
      console.warn(
        '⚠️ [useCommunity] useEffect - Comunidad actual sin ID válido:',
        currentCommunity,
      );
    }
  }, [currentCommunity]);

  const value = {
    currentCommunity,
    communities,
    units,
    isLoading,
    setCurrentCommunity,
    loadCommunities,
    loadUnits,
    refreshCurrentCommunity,
  };

  return <CommunityContext.Provider value={value}>{children}</CommunityContext.Provider>;
}

export function useCommunity() {
  const context = useContext(CommunityContext);
  if (context === undefined) {
    throw new Error('useCommunity must be used within a CommunityProvider');
  }
  return context;
}
