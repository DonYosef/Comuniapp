'use client';

import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { communityService, Community } from '@/services/communityService';

export interface UseCommunitiesResult {
  communities: Community[];
  hasCommunities: boolean;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useCommunities(): UseCommunitiesResult {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchCommunities = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);

      console.log('🔍 [useCommunities] Obteniendo comunidades para usuario:', user.email);

      // Para administradores, usar el endpoint completo de comunidades
      // Para residentes/concierges, usar el endpoint específico
      const isAdmin = user.roles?.some(
        (role: any) => role.name === 'SUPER_ADMIN' || role.name === 'COMMUNITY_ADMIN',
      );

      const endpoint = isAdmin ? '/communities' : '/communities/my-community';
      console.log('🔍 [useCommunities] Usando endpoint:', endpoint);

      const data = await communityService.getCommunities(endpoint);
      console.log('🔍 [useCommunities] Comunidades obtenidas:', data);

      if (isAdmin) {
        setCommunities(data);
      } else {
        // Para residentes, data es un objeto único o null
        setCommunities(data ? [data] : []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar las comunidades.');
      console.error('❌ [useCommunities] Error fetching communities:', err);
      setCommunities([]); // En caso de error, mostrar lista vacía
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchCommunities();
    }
  }, [user]);

  return {
    communities,
    hasCommunities: communities.length > 0,
    isLoading,
    error,
    refetch: fetchCommunities,
  };
}
