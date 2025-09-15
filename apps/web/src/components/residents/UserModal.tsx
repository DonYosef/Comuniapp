'use client';

import { useState, useEffect } from 'react';
import { UserResponseDto, CreateUserDto, UpdateUserDto } from '@/types/api';

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
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE' | 'SUSPENDED',
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
      });
    } else if (mode === 'create') {
      setFormData({
        name: '',
        email: '',
        password: '',
        phone: '',
        status: 'ACTIVE',
      });
    }
    setErrors({});
  }, [user, mode, isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }

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
      name: formData.name,
      email: formData.email,
      phone: formData.phone || undefined,
      status: formData.status,
      ...(mode === 'create' && { password: formData.password }),
    };

    onSave(userData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
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
          <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={onClose}></div>
        </div>

        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <form onSubmit={handleSubmit}>
            <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="sm:flex sm:items-start">
                <div className="w-full">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">
                    {mode === 'create' && 'Crear Usuario'}
                    {mode === 'edit' && 'Editar Usuario'}
                    {mode === 'view' && 'Ver Usuario'}
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Nombre *
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        disabled={mode === 'view'}
                        className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm ${
                          errors.name ? 'border-red-300' : 'border-gray-300 dark:border-gray-600'
                        } ${mode === 'view' ? 'bg-gray-100 dark:bg-gray-700' : 'bg-white dark:bg-gray-600'} text-gray-900 dark:text-white`}
                      />
                      {errors.name && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Email *
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        disabled={mode === 'view'}
                        className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm ${
                          errors.email ? 'border-red-300' : 'border-gray-300 dark:border-gray-600'
                        } ${mode === 'view' ? 'bg-gray-100 dark:bg-gray-700' : 'bg-white dark:bg-gray-600'} text-gray-900 dark:text-white`}
                      />
                      {errors.email && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                          {errors.email}
                        </p>
                      )}
                    </div>

                    {mode === 'create' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Contraseña *
                        </label>
                        <input
                          type="password"
                          name="password"
                          value={formData.password}
                          onChange={handleChange}
                          className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm ${
                            errors.password
                              ? 'border-red-300'
                              : 'border-gray-300 dark:border-gray-600'
                          } bg-white dark:bg-gray-600 text-gray-900 dark:text-white`}
                        />
                        {errors.password && (
                          <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                            {errors.password}
                          </p>
                        )}
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Teléfono
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        disabled={mode === 'view'}
                        className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm border-gray-300 dark:border-gray-600 ${
                          mode === 'view'
                            ? 'bg-gray-100 dark:bg-gray-700'
                            : 'bg-white dark:bg-gray-600'
                        } text-gray-900 dark:text-white`}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Estado
                      </label>
                      <select
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        disabled={mode === 'view'}
                        className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm border-gray-300 dark:border-gray-600 ${
                          mode === 'view'
                            ? 'bg-gray-100 dark:bg-gray-700'
                            : 'bg-white dark:bg-gray-600'
                        } text-gray-900 dark:text-white`}
                      >
                        <option value="ACTIVE">Activo</option>
                        <option value="INACTIVE">Inactivo</option>
                        <option value="SUSPENDED">Suspendido</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              {mode !== 'view' && (
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-sky-600 text-base font-medium text-white hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Guardando...' : 'Guardar'}
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              >
                {mode === 'view' ? 'Cerrar' : 'Cancelar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
