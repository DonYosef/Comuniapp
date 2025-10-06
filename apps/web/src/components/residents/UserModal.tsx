'use client';

import { useState, useEffect } from 'react';
import { UserResponseDto, CreateUserDto, UpdateUserDto } from '@/types/api';
import { useAuth } from '@/hooks/useAuth';
import { useCommunity } from '@/hooks/useCommunity';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'view' | 'edit' | 'create';
  user?: UserResponseDto | null;
  onSave: (userData: CreateUserDto | UpdateUserDto) => void;
  isLoading?: boolean;
}

export default function UserModal({
  isOpen,
  onClose,
  mode,
  user,
  onSave,
  isLoading = false,
}: UserModalProps) {
  const { user: authUser } = useAuth();
  const { currentCommunity, units } = useCommunity();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE' | 'SUSPENDED',
    roleName: 'RESIDENT' as
      | 'SUPER_ADMIN'
      | 'COMMUNITY_ADMIN'
      | 'OWNER'
      | 'TENANT'
      | 'RESIDENT'
      | 'CONCIERGE',
    unitId: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user && (mode === 'view' || mode === 'edit')) {
      setFormData({
        name: user.name,
        email: user.email,
        password: '',
        phone: user.phone || '',
        status: user.status,
        roleName: 'RESIDENT', // Por defecto, se puede cambiar si es necesario
        unitId: '', // TODO: Obtener unidad del usuario si existe
      });
    } else if (mode === 'create') {
      const initialFormData = {
        name: '',
        email: '',
        password: '',
        phone: '',
        status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE' | 'SUSPENDED',
        roleName: 'RESIDENT' as
          | 'SUPER_ADMIN'
          | 'COMMUNITY_ADMIN'
          | 'OWNER'
          | 'TENANT'
          | 'RESIDENT'
          | 'CONCIERGE',
        unitId: '',
      };
      console.log('🔍 [UserModal] Inicializando formulario para crear usuario:');
      console.log('   - roleName inicial:', initialFormData.roleName);
      setFormData(initialFormData);
    }
    setErrors({});
  }, [user, mode, isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'El email no es válido';
    }

    if (mode === 'create' && !formData.password.trim()) {
      newErrors.password = 'La contraseña es requerida';
    } else if (mode === 'create' && formData.password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const userData = {
      email: formData.email,
      status: formData.status,
      roleName: formData.roleName, // Asegurar que el rol se envíe siempre
      ...(mode === 'create' && { password: formData.password }),
      ...(formData.name && { name: formData.name }),
      phone: formData.phone || undefined, // Enviar undefined si está vacío
      organizationId: authUser?.organizationId || undefined, // Enviar undefined si no existe
      ...(formData.unitId && { unitId: formData.unitId }),
    };

    // Log para debugging
    console.log(
      '🔍 [UserModal] Datos que se envían al backend:',
      JSON.stringify(userData, null, 2),
    );
    console.log(
      '🔍 [UserModal] roleName específico:',
      userData.roleName,
      '(tipo:',
      typeof userData.roleName,
      ')',
    );

    onSave(userData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    // Log específico para roleName
    if (name === 'roleName') {
      console.log('🔍 [UserModal] Cambio de rol detectado:');
      console.log('   - Campo:', name);
      console.log('   - Valor anterior:', formData.roleName);
      console.log('   - Valor nuevo:', value);
    }

    setFormData((prev) => ({ ...prev, [name]: value }));

    // Limpiar error cuando el usuario empiece a escribir
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div
            className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
            onClick={onClose}
          ></div>
        </div>

        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full border border-gray-200 dark:border-gray-700">
          <form onSubmit={handleSubmit}>
            <div className="bg-white dark:bg-gray-800 px-8 pt-8 pb-6">
              <div className="sm:flex sm:items-start">
                <div className="w-full">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-xl">
                      <svg
                        className="w-8 h-8 text-blue-600 dark:text-blue-400"
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
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {mode === 'create' && 'Crear Nuevo Residente'}
                        {mode === 'edit' && 'Editar Residente'}
                        {mode === 'view' && 'Detalles del Residente'}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {mode === 'create' &&
                          `Completa la información para crear un nuevo residente${currentCommunity ? ` en ${currentCommunity.name}` : ''}`}
                        {mode === 'edit' && 'Modifica la información del residente'}
                        {mode === 'view' && 'Información completa del residente'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Nombre completo
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        disabled={mode === 'view'}
                        placeholder="Ej: Juan Pérez"
                        className={`block w-full px-4 py-3 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                          errors.name
                            ? 'border-red-300 bg-red-50'
                            : 'border-gray-200 dark:border-gray-600'
                        } ${mode === 'view' ? 'bg-gray-50 dark:bg-gray-700' : 'bg-white dark:bg-gray-800'} text-gray-900 dark:text-white placeholder-gray-400`}
                      />
                      {errors.name && (
                        <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center">
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

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Email *
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        disabled={mode === 'view'}
                        placeholder="juan.perez@email.com"
                        className={`block w-full px-4 py-3 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                          errors.email
                            ? 'border-red-300 bg-red-50'
                            : 'border-gray-200 dark:border-gray-600'
                        } ${mode === 'view' ? 'bg-gray-50 dark:bg-gray-700' : 'bg-white dark:bg-gray-800'} text-gray-900 dark:text-white placeholder-gray-400`}
                      />
                      {errors.email && (
                        <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center">
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
                          {errors.email}
                        </p>
                      )}
                    </div>

                    {mode === 'create' && (
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          Contraseña *
                        </label>
                        <input
                          type="password"
                          name="password"
                          value={formData.password}
                          onChange={handleChange}
                          placeholder="Mínimo 6 caracteres"
                          className={`block w-full px-4 py-3 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                            errors.password
                              ? 'border-red-300 bg-red-50'
                              : 'border-gray-200 dark:border-gray-600'
                          } bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400`}
                        />
                        {errors.password && (
                          <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center">
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
                            {errors.password}
                          </p>
                        )}
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Teléfono
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        disabled={mode === 'view'}
                        placeholder="+34 600 123 456"
                        className={`block w-full px-4 py-3 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 border-gray-200 dark:border-gray-600 ${
                          mode === 'view'
                            ? 'bg-gray-50 dark:bg-gray-700'
                            : 'bg-white dark:bg-gray-800'
                        } text-gray-900 dark:text-white placeholder-gray-400`}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Estado
                      </label>
                      <select
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        disabled={mode === 'view'}
                        className={`block w-full px-4 py-3 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 border-gray-200 dark:border-gray-600 ${
                          mode === 'view'
                            ? 'bg-gray-50 dark:bg-gray-700'
                            : 'bg-white dark:bg-gray-800'
                        } text-gray-900 dark:text-white appearance-none cursor-pointer`}
                      >
                        <option value="ACTIVE">Activo</option>
                        <option value="INACTIVE">Inactivo</option>
                        <option value="SUSPENDED">Suspendido</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Rol
                      </label>
                      <select
                        name="roleName"
                        value={formData.roleName}
                        onChange={handleChange}
                        disabled={mode === 'view'}
                        className={`block w-full px-4 py-3 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 border-gray-200 dark:border-gray-600 ${
                          mode === 'view'
                            ? 'bg-gray-50 dark:bg-gray-700'
                            : 'bg-white dark:bg-gray-800'
                        } text-gray-900 dark:text-white appearance-none cursor-pointer`}
                      >
                        <option value="RESIDENT">Residente</option>
                        <option value="OWNER">Propietario</option>
                        <option value="TENANT">Inquilino</option>
                        <option value="CONCIERGE">Conserje</option>
                        <option value="COMMUNITY_ADMIN">Administrador de Comunidad</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Unidad Asociada
                      </label>
                      <select
                        name="unitId"
                        value={formData.unitId}
                        onChange={handleChange}
                        disabled={mode === 'view' || !currentCommunity || units.length === 0}
                        className={`block w-full px-4 py-3 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 border-gray-200 dark:border-gray-600 ${
                          mode === 'view' || !currentCommunity || units.length === 0
                            ? 'bg-gray-50 dark:bg-gray-700'
                            : 'bg-white dark:bg-gray-800'
                        } text-gray-900 dark:text-white appearance-none cursor-pointer`}
                      >
                        <option value="">Sin unidad</option>
                        {units.map((unit) => (
                          <option key={unit.id} value={unit.id}>
                            {unit.floor ? `Piso ${unit.floor} - ` : ''}Unidad {unit.number}
                          </option>
                        ))}
                      </select>
                      {!currentCommunity ? (
                        <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                          ⚠️ Selecciona una comunidad primero para ver las unidades disponibles
                        </p>
                      ) : units.length === 0 ? (
                        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                          No hay unidades disponibles en esta comunidad
                        </p>
                      ) : (
                        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                          Selecciona la unidad donde reside este usuario
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 px-8 py-6 sm:flex sm:flex-row-reverse space-y-3 sm:space-y-0 sm:space-x-3">
              {mode !== 'view' && (
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full sm:w-auto inline-flex justify-center items-center px-6 py-3 border border-transparent text-base font-semibold rounded-xl shadow-sm text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:-translate-y-0.5"
                >
                  {isLoading ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
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
              )}
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto inline-flex justify-center items-center px-6 py-3 border border-gray-300 dark:border-gray-600 text-base font-semibold rounded-xl shadow-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                {mode === 'view' ? 'Cerrar' : 'Cancelar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
