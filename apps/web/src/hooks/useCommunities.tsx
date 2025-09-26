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
    queryFn: CommunityService.getCommunities,
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: false,
  });

  return {
    communities,
    isLoading,
    error,
    hasCommunities: communities.length > 0,
  };
}
