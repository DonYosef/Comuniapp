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
      const data = await communityService.getCommunities();
      console.log('🔍 [useCommunities] Comunidades obtenidas:', data);
      setCommunities(data);
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
