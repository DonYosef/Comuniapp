'use client';

import { useQuery } from '@tanstack/react-query';
import { CommunityService } from '@/services/communityService';
import { useAuth } from './useAuth';

export function useCommunities() {
  const { isAuthenticated } = useAuth();

  const {
    data: communities = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['communities'],
    queryFn: async () => {
      try {
        const result = await CommunityService.getCommunities();
        // Asegurar que siempre devolvemos un array
        return Array.isArray(result) ? result : [];
      } catch (err) {
        console.error('Error al cargar comunidades:', err);
        // Devolver array vacío en caso de error
        return [];
      }
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: false,
    retry: 1, // Solo reintentar una vez
  });

  return {
    communities,
    isLoading,
    error,
    hasCommunities: communities.length > 0,
  };
}
