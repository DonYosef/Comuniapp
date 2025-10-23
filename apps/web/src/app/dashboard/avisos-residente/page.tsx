'use client';

import { useState } from 'react';
import { useResidentAnnouncements } from '@/hooks/useResidentAnnouncements';
import { Announcement } from '@/services/announcements.service';

const MegaphoneIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"
    />
  </svg>
);

export default function ResidentAnnouncementsPage() {
  const { announcements, loading, error, toast, fetchMyCommunityAnnouncements } =
    useResidentAnnouncements();

  const getTypeInfo = (type: string) => {
    const types = {
      GENERAL: { label: 'General', color: 'bg-blue-100 text-blue-800', icon: '📢' },
      URGENT: { label: 'Urgente', color: 'bg-red-100 text-red-800', icon: '🚨' },
      MAINTENANCE: { label: 'Mantenimiento', color: 'bg-yellow-100 text-yellow-800', icon: '🔧' },
      SECURITY: { label: 'Seguridad', color: 'bg-purple-100 text-purple-800', icon: '🛡️' },
      SOCIAL: { label: 'Social', color: 'bg-green-100 text-green-800', icon: '🎉' },
    };
    return types[type as keyof typeof types] || types.GENERAL;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <div className="text-red-600 text-lg font-semibold mb-2">Error al cargar avisos</div>
          <p className="text-red-700 mb-4">{error}</p>
          <button
            onClick={fetchMyCommunityAnnouncements}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-100 rounded-lg">
            <MegaphoneIcon />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Avisos de tu Comunidad</h1>
            <p className="text-gray-600">
              Mantente informado sobre las últimas noticias y comunicaciones de tu comunidad
            </p>
          </div>
        </div>

        {announcements.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-blue-800">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="font-medium">
                {announcements.length} aviso{announcements.length !== 1 ? 's' : ''} disponible
                {announcements.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Announcements List */}
      {announcements.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <MegaphoneIcon />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No hay avisos disponibles</h3>
          <p className="text-gray-600 mb-6">No se han publicado avisos en tu comunidad aún.</p>
          <button
            onClick={fetchMyCommunityAnnouncements}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Actualizar
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {announcements.map((announcement) => {
            const typeInfo = getTypeInfo(announcement.type);

            return (
              <div
                key={announcement.id}
                className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">{typeInfo.icon}</span>
                        <h3 className="text-xl font-semibold text-gray-900">
                          {announcement.title}
                        </h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${typeInfo.color}`}
                        >
                          {typeInfo.label}
                        </span>
                        <span className="text-sm text-gray-500">
                          Publicado el {formatDate(announcement.publishedAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="prose max-w-none">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {announcement.content}
                    </p>
                  </div>

                  {/* Footer */}
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center gap-2">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                        <span>Publicado por {announcement.createdBy.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                          />
                        </svg>
                        <span>{announcement.community.name}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-4 right-4 z-50">
          <div
            className={`px-6 py-3 rounded-lg shadow-lg ${
              toast.type === 'success'
                ? 'bg-green-500 text-white'
                : toast.type === 'error'
                  ? 'bg-red-500 text-white'
                  : toast.type === 'warning'
                    ? 'bg-yellow-500 text-white'
                    : 'bg-blue-500 text-white'
            }`}
          >
            {toast.message}
          </div>
        </div>
      )}
    </div>
  );
}
