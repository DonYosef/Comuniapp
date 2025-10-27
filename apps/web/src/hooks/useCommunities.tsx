'use client';

import { useQuery } from '@tanstack/react-query';
import { CommunityService } from '@/services/communityService';
import { useAuth } from './useAuth';

export function useCommunities() {
  const { isAuthenticated, isAdmin } = useAuth();

  const {
    data: communities = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['communities'],
    queryFn: async () => {
      try {
        console.log('🔍 [useCommunities] Iniciando carga de comunidades...');
        const endpoint = isAdmin() ? '/communities' : '/communities/my-community';
        const result = await CommunityService.getCommunities(endpoint);
        console.log('✅ [useCommunities] Comunidades cargadas:', result);
        // Asegurar que siempre devolvemos un array
        return Array.isArray(result) ? result : [];
      } catch (err) {
        console.error('❌ [useCommunities] Error al cargar comunidades:', err);
        // Devolver array vacío en caso de error
        return [];
      }
    },
    enabled: isAuthenticated,
    staleTime: 30 * 60 * 1000, // 30 minutos - cache muy agresivo
    cacheTime: 60 * 60 * 1000, // 1 hora - mantener en cache mucho tiempo
    refetchOnWindowFocus: false,
    refetchOnMount: false, // No refetch en mount si hay datos en cache
    refetchOnReconnect: false, // No refetch al reconectar
    retry: false, // No reintentar para máxima velocidad
    placeholderData: [], // Datos placeholder para evitar loading
  });

  return {
    communities,
    isLoading,
    error,
    hasCommunities: communities.length > 0,
    refetch,
  };
}
