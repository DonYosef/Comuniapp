'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { communityService, Community, Unit, CommonSpace } from '@/services/communityService';

interface CommunityFormData {
  name: string;
  description: string;
  address: string;
  phone?: string;
  email?: string;
  website?: string;
}

const initialFormData: CommunityFormData = {
  name: '',
  description: '',
  address: '',
  phone: '',
  email: '',
  website: '',
};

export default function EditarComunidadPage() {
  const params = useParams();
  const router = useRouter();
  const communityId = params.id as string;

  const [community, setCommunity] = useState<Community | null>(null);
  const [formData, setFormData] = useState<CommunityFormData>(initialFormData);
  const [units, setUnits] = useState<Unit[]>([]);
  const [commonSpaces, setCommonSpaces] = useState<CommonSpace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<CommunityFormData>>({});

  useEffect(() => {
    const fetchCommunity = async () => {
      try {
        setIsLoading(true);
        const data = await communityService.getCommunityById(communityId);
        setCommunity(data);

        // Llenar el formulario con los datos de la comunidad
        setFormData({
          name: data.name,
          description: data.description || '',
          address: data.address,
          phone: data.phone || '',
          email: data.email || '',
          website: data.website || '',
        });

        // Cargar unidades y espacios comunes
        setUnits(data.units || []);
        setCommonSpaces(data.commonSpaces || []);
      } catch (error) {
        console.error('Error al cargar la comunidad:', error);
        alert(error instanceof Error ? error.message : 'Error al cargar la comunidad');
        router.push('/dashboard');
      } finally {
        setIsLoading(false);
      }
    };

    if (communityId) {
      fetchCommunity();
    }
  }, [communityId, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Limpiar error cuando el usuario empiece a escribir
    if (errors[name as keyof CommunityFormData]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<CommunityFormData> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre de la comunidad es requerido.';
    }
    if (!formData.address.trim()) {
      newErrors.address = 'La dirección es requerida.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await communityService.updateCommunity(communityId, formData);
      alert('Comunidad actualizada exitosamente!');
      router.push('/dashboard');
    } catch (error) {
      console.error('Error al actualizar la comunidad:', error);
      alert(error instanceof Error ? error.message : 'Hubo un error al actualizar la comunidad.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (
      !confirm(
        '¿Estás seguro de que quieres eliminar esta comunidad? Esta acción no se puede deshacer.',
      )
    ) {
      return;
    }

    try {
      await communityService.deleteCommunity(communityId);
      alert('Comunidad eliminada exitosamente!');
      router.push('/dashboard');
    } catch (error) {
      console.error('Error al eliminar la comunidad:', error);
      alert(error instanceof Error ? error.message : 'Hubo un error al eliminar la comunidad.');
    }
  };

  if (isLoading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Cargando comunidad...</p>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  if (!community) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Comunidad no encontrada
              </h1>
              <button
                onClick={() => router.push('/dashboard')}
                className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-semibold transition-colors"
              >
                Volver al Dashboard
              </button>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-8 animate-fade-in">
          {/* Header moderno */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-4 sm:p-6 md:p-8 border border-blue-100 dark:border-gray-700 animate-slide-down">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 sm:p-3 bg-blue-100 dark:bg-blue-900 rounded-xl">
                  <svg
                    className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 dark:text-blue-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                    Editar Comunidad
                  </h1>
                  <p className="text-sm sm:text-base lg:text-lg text-gray-600 dark:text-gray-400">
                    Modifica la información de {community.name}
                  </p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <button
                  onClick={handleDelete}
                  className="inline-flex items-center justify-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-colors duration-200"
                >
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  Eliminar
                </button>
              </div>
            </div>
          </div>

          {/* Información de la Comunidad */}
          <div
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden animate-fade-in-up"
            style={{ animationDelay: '0.1s' }}
          >
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 px-8 py-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg mr-3">
                  <svg
                    className="w-6 h-6 text-blue-600 dark:text-blue-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                </div>
                Información de la Comunidad
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-2">Datos básicos y estadísticas</p>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                    ID de la Comunidad
                  </h3>
                  <p className="text-lg font-mono text-gray-900 dark:text-white">{community.id}</p>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                    Unidades
                  </h3>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {community._count?.units || 0}
                  </p>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                    Fecha de Creación
                  </h3>
                  <p className="text-lg text-gray-900 dark:text-white">
                    {new Date(community.createdAt).toLocaleDateString('es-ES')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Formulario de Edición */}
          <form onSubmit={handleSubmit} className="space-y-8">
            <div
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden animate-fade-in-up"
              style={{ animationDelay: '0.2s' }}
            >
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 px-8 py-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                  <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg mr-3">
                    <svg
                      className="w-6 h-6 text-green-600 dark:text-green-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                  </div>
                  Editar Información
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  Modifica los datos básicos de la comunidad
                </p>
              </div>

              <div className="p-6 space-y-6">
                {/* Nombre */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Nombre de la Comunidad *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border-2 rounded-xl text-base transition-all duration-200 ${
                        errors.name
                          ? 'border-red-400 dark:border-red-500 bg-red-50 dark:bg-red-900/20'
                          : 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:border-green-500 focus:ring-4 focus:ring-green-100 dark:focus:ring-green-900/30'
                      } text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500`}
                      placeholder="Nombre de la comunidad"
                    />
                    {formData.name && !errors.name && (
                      <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                        <svg
                          className="w-6 h-6 text-green-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                  {errors.name && (
                    <p className="text-red-500 text-sm mt-2 flex items-center">
                      <svg
                        className="w-4 h-4 mr-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      {errors.name}
                    </p>
                  )}
                </div>

                {/* Descripción */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Descripción
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-4 py-3 border-2 rounded-xl text-base transition-all duration-200 resize-none border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:border-green-500 focus:ring-4 focus:ring-green-100 dark:focus:ring-green-900/30 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                    placeholder="Descripción de la comunidad"
                  />
                </div>

                {/* Dirección */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    <span className="mr-2">📍</span>
                    Dirección *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border-2 rounded-xl text-base transition-all duration-200 ${
                        errors.address
                          ? 'border-red-400 dark:border-red-500 bg-red-50 dark:bg-red-900/20'
                          : 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:border-green-500 focus:ring-4 focus:ring-green-100 dark:focus:ring-green-900/30'
                      } text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500`}
                      placeholder="Dirección de la comunidad"
                    />
                    {formData.address && !errors.address && (
                      <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                        <svg
                          className="w-6 h-6 text-green-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                  {errors.address && (
                    <p className="text-red-500 text-sm mt-2 flex items-center">
                      <svg
                        className="w-4 h-4 mr-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      {errors.address}
                    </p>
                  )}
                </div>

                {/* Teléfono */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    <span className="mr-2">📞</span>
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 rounded-xl text-base transition-all duration-200 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:border-green-500 focus:ring-4 focus:ring-green-100 dark:focus:ring-green-900/30 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                    placeholder="Teléfono de contacto"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    <span className="mr-2">📧</span>
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 rounded-xl text-base transition-all duration-200 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:border-green-500 focus:ring-4 focus:ring-green-100 dark:focus:ring-green-900/30 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                    placeholder="Email de contacto"
                  />
                </div>

                {/* Sitio Web */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    <span className="mr-2">🌐</span>
                    Sitio Web
                  </label>
                  <input
                    type="url"
                    name="website"
                    value={formData.website}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 rounded-xl text-base transition-all duration-200 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:border-green-500 focus:ring-4 focus:ring-green-100 dark:focus:ring-green-900/30 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                    placeholder="https://ejemplo.com"
                  />
                </div>
              </div>
            </div>

            {/* Gestión de Unidades */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-bold gradient-title-primary flex items-center">
                  <span className="mr-2">🏠</span>
                  Gestión de Unidades
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Administra las unidades de la comunidad
                </p>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {units.map((unit) => (
                    <div
                      key={unit.id}
                      className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 flex items-center justify-between"
                    >
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {unit.floor ? `Piso ${unit.floor} - ` : ''}Unidad {unit.number}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                          {unit.type.toLowerCase()}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          if (confirm('¿Estás seguro de que quieres eliminar esta unidad?')) {
                            communityService
                              .removeUnit(unit.id)
                              .then(() => {
                                setUnits(units.filter((u) => u.id !== unit.id));
                                alert('Unidad eliminada exitosamente');
                              })
                              .catch((error) => {
                                alert('Error al eliminar la unidad: ' + error.message);
                              });
                          }
                        }}
                        className="text-red-500 hover:text-red-700 transition-colors"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>

                {units.length === 0 && (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <svg
                      className="w-12 h-12 mx-auto mb-4"
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
                    <p>No hay unidades registradas</p>
                  </div>
                )}
              </div>
            </div>

            {/* Gestión de Espacios Comunes */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-bold gradient-title-success flex items-center">
                  <span className="mr-2">🏊</span>
                  Espacios Comunes
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Gestiona los espacios comunes de la comunidad
                </p>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {commonSpaces.map((space) => (
                    <div
                      key={space.id}
                      className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 flex items-center justify-between"
                    >
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {space.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Cantidad: {space.quantity}
                        </p>
                        {space.description && (
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                            {space.description}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          if (
                            confirm('¿Estás seguro de que quieres eliminar este espacio común?')
                          ) {
                            communityService
                              .removeCommonSpace(space.id!)
                              .then(() => {
                                setCommonSpaces(commonSpaces.filter((s) => s.id !== space.id));
                                alert('Espacio común eliminado exitosamente');
                              })
                              .catch((error) => {
                                alert('Error al eliminar el espacio común: ' + error.message);
                              });
                          }
                        }}
                        className="text-red-500 hover:text-red-700 transition-colors"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>

                {commonSpaces.length === 0 && (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <svg
                      className="w-12 h-12 mx-auto mb-4"
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
                    <p>No hay espacios comunes registrados</p>
                  </div>
                )}
              </div>
            </div>

            {/* Botones de Acción */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    type="button"
                    onClick={() => router.push('/dashboard')}
                    className="px-6 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500 transition-all duration-200 flex items-center justify-center"
                  >
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 19l-7-7m0 0l7-7m-7 7h18"
                      />
                    </svg>
                    Cancelar
                  </button>

                  <button
                    type="button"
                    onClick={handleDelete}
                    className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold transition-all duration-200 flex items-center justify-center"
                  >
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                    Eliminar Comunidad
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-600 hover:to-emerald-700 focus:outline-none focus:ring-4 focus:ring-green-200 dark:focus:ring-green-900/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center"
                >
                  {isSubmitting ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Guardando...
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-5 h-5 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      Guardar Cambios
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
