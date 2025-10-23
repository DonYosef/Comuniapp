'use client';

import { useState, useEffect } from 'react';
import {
  AnnouncementsService,
  Announcement,
  CreateAnnouncementData,
  UpdateAnnouncementData,
} from '@/services/announcements.service';

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

export function useAnnouncements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast, showToast } = useSimpleToast();

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await AnnouncementsService.getAll();
      setAnnouncements(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar avisos';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchByCommunity = async (communityId: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await AnnouncementsService.getByCommunity(communityId);
      setAnnouncements(data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Error al cargar avisos de la comunidad';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const createAnnouncement = async (data: CreateAnnouncementData) => {
    try {
      setLoading(true);
      setError(null);
      const newAnnouncement = await AnnouncementsService.create(data);
      setAnnouncements((prev) => [newAnnouncement, ...prev]);
      showToast('Aviso creado correctamente', 'success');
      return newAnnouncement;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al crear aviso';
      setError(errorMessage);
      showToast(errorMessage, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateAnnouncement = async (id: string, data: UpdateAnnouncementData) => {
    try {
      setLoading(true);
      setError(null);
      const updatedAnnouncement = await AnnouncementsService.update(id, data);
      setAnnouncements((prev) =>
        prev.map((announcement) => (announcement.id === id ? updatedAnnouncement : announcement)),
      );
      showToast('Aviso actualizado correctamente', 'success');
      return updatedAnnouncement;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al actualizar aviso';
      setError(errorMessage);
      showToast(errorMessage, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteAnnouncement = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      await AnnouncementsService.delete(id);
      setAnnouncements((prev) => prev.filter((announcement) => announcement.id !== id));
      showToast('Aviso eliminado correctamente', 'success');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al eliminar aviso';
      setError(errorMessage);
      showToast(errorMessage, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  return {
    announcements,
    loading,
    error,
    toast,
    fetchAnnouncements,
    fetchByCommunity,
    createAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
  };
}
