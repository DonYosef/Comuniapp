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
    if (!isAuthenticated || !user) return;

    setIsLoading(true);
    try {
      const token = AuthService.getToken();

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
          setCommunities(data);
          if (!currentCommunity && data.length > 0) {
            setCurrentCommunity(data[0]);
            await loadUnits(data[0].id);
          }
        } else {
          // Para residentes, data es un objeto único o null
          if (data) {
            setCommunities([data]); // Convertir a array para consistencia
            if (!currentCommunity) {
              setCurrentCommunity(data);
              // Cargar unidades en paralelo para mejor rendimiento
              loadUnits(data.id);
            }
          } else {
            setCommunities([]);
          }
        }
      } else {
        const errorText = await response.text();
        console.error('Error al cargar comunidades:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText,
          url: response.url,
          endpoint: endpoint,
        });
        setCommunities([]);
      }
    } catch (error) {
      console.error('Error al cargar comunidades:', error);
      setCommunities([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Cargar unidades de una comunidad
  const loadUnits = async (communityId: string) => {
    if (!isAuthenticated || !user) return;

    try {
      const token = AuthService.getToken();

      // Para administradores, usar el endpoint completo de unidades
      // Para residentes/concierges, usar el endpoint específico
      const isAdmin = user.roles?.some(
        (role: any) => role.name === 'SUPER_ADMIN' || role.name === 'COMMUNITY_ADMIN',
      );

      const endpoint = isAdmin
        ? `http://localhost:3001/communities/${communityId}/units`
        : 'http://localhost:3001/communities/my-units';

      console.log('🔍 [useCommunity] loadUnits - usando endpoint:', endpoint);

      const response = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUnits(data);
        console.log('✅ [useCommunity] Unidades cargadas:', data.length);
      } else {
        console.error('Error al cargar unidades:', response.statusText);
        setUnits([]);
      }
    } catch (error) {
      console.error('Error al cargar unidades:', error);
      setUnits([]);
    }
  };

  // Refrescar comunidad actual
  const refreshCurrentCommunity = async () => {
    if (!currentCommunity) return;

    try {
      const token = AuthService.getToken();
      const response = await fetch(`http://localhost:3001/communities/${currentCommunity.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentCommunity(data);
      } else {
        console.error('Error al refrescar comunidad:', response.statusText);
      }
    } catch (error) {
      console.error('Error al refrescar comunidad:', error);
    }
  };

  // Cargar comunidades cuando el usuario se autentica
  useEffect(() => {
    if (isAuthenticated && user) {
      loadCommunities();
    }
  }, [isAuthenticated, user]);

  // Cargar unidades cuando cambia la comunidad actual (sin bloquear)
  useEffect(() => {
    if (currentCommunity) {
      // Cargar unidades en background sin bloquear la UI
      loadUnits(currentCommunity.id);
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
