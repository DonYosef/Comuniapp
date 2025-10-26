'use client';

import { useState, useEffect } from 'react';
import { AnnouncementsService, Announcement } from '@/services/announcements.service';

// Hook simple para toast
function useSimpleToast() {
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
  } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  return { toast, showToast };
}

export function useResidentAnnouncements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast, showToast } = useSimpleToast();

  const fetchMyCommunityAnnouncements = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await AnnouncementsService.getMyCommunityAnnouncements();
      setAnnouncements(data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Error al cargar avisos de tu comunidad';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyCommunityAnnouncements();
  }, []);

  return {
    announcements,
    loading,
    error,
    toast,
    fetchMyCommunityAnnouncements,
  };
}
