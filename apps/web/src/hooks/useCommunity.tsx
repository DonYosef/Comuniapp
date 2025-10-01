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
      const response = await fetch('http://localhost:3001/communities', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCommunities(data);

        // Si no hay comunidad actual pero hay comunidades disponibles, seleccionar la primera
        if (!currentCommunity && data.length > 0) {
          setCurrentCommunity(data[0]);
          await loadUnits(data[0].id);
        }
      } else {
        const errorText = await response.text();
        console.error('Error al cargar comunidades:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText,
          url: response.url,
        });
      }
    } catch (error) {
      console.error('Error al cargar comunidades:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Cargar unidades de una comunidad
  const loadUnits = async (communityId: string) => {
    if (!isAuthenticated || !user) return;

    try {
      const token = AuthService.getToken();
      const response = await fetch(`http://localhost:3001/communities/${communityId}/units`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUnits(data);
      } else {
        console.error('Error al cargar unidades:', response.statusText);
      }
    } catch (error) {
      console.error('Error al cargar unidades:', error);
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

  // Cargar unidades cuando cambia la comunidad actual
  useEffect(() => {
    if (currentCommunity) {
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
