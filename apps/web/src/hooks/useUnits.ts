import { useState, useEffect } from 'react';
import { ParcelsService, UnitResponse } from '@/services/parcels.service';

export const useUnits = (communityId?: string) => {
  const [units, setUnits] = useState<UnitResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUnits = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const unitsData = await ParcelsService.getAvailableUnits(communityId);
      setUnits(unitsData);
    } catch (err) {
      setError('Error al cargar las unidades');
      console.error('Error fetching units:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUnits();
  }, [communityId]);

  return {
    units,
    isLoading,
    error,
    refetch: fetchUnits,
  };
};
