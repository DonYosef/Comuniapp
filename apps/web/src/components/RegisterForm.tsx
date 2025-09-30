'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone?: string;
  organizationId?: string;
  acceptTerms: boolean;
}

interface RegisterFormErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  phone?: string;
  organizationId?: string;
  acceptTerms?: string;
  general?: string;
}

export default function RegisterForm() {
  const [formData, setFormData] = useState<RegisterFormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    organizationId: '',
    acceptTerms: false,
  });

  const [errors, setErrors] = useState<RegisterFormErrors>({});
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  // Redirigir si ya está autenticado
  if (isAuthenticated) {
    router.replace('/dashboard');
    return null;
  }

  const validateForm = (): boolean => {
    const newErrors: RegisterFormErrors = {};

    // Validar nombre
    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'El nombre debe tener al menos 2 caracteres';
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'El email no es válido';
    }

    // Validar contraseña
    if (!formData.password) {
      newErrors.password = 'La contraseña es requerida';
    } else if (formData.password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    }

    // Validar confirmación de contraseña
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Confirma tu contraseña';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }

    // Validar teléfono (opcional)
    if (formData.phone && !/^[\d\s\-\+\(\)]+$/.test(formData.phone)) {
      newErrors.phone = 'El teléfono no es válido';
    }

    // Validar aceptación de términos
    if (!formData.acceptTerms) {
      newErrors.acceptTerms = 'Debes aceptar los términos y condiciones';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[name as keyof RegisterFormErrors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      // Aquí iría la llamada al servicio de registro
      // const response = await AuthService.register(formData);

      // Por ahora, simular un registro exitoso
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Redirigir al login con mensaje de éxito
      router.push('/login?registered=true');
    } catch (err: any) {
      console.error('Error en registro:', err);
      setErrors({
        general: err.response?.data?.message || 'Error al crear la cuenta. Inténtalo de nuevo.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold gradient-title-primary">
            Crear Cuenta
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Comuniapp - Gestión de Comunidades
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Nombre */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Nombre completo *
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className={`appearance-none relative block w-full px-3 py-2 border rounded-md placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                  errors.name ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="Tu nombre completo"
                value={formData.name}
                onChange={handleInputChange}
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className={`appearance-none relative block w-full px-3 py-2 border rounded-md placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                  errors.email ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="tu@email.com"
                value={formData.email}
                onChange={handleInputChange}
              />
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
            </div>

            {/* Teléfono */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Teléfono
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                className={`appearance-none relative block w-full px-3 py-2 border rounded-md placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                  errors.phone ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="+1 (555) 123-4567"
                value={formData.phone}
                onChange={handleInputChange}
              />
              {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
            </div>

            {/* ID de organización */}
            <div>
              <label
                htmlFor="organizationId"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                ID de organización (opcional)
              </label>
              <input
                id="organizationId"
                name="organizationId"
                type="text"
                className={`appearance-none relative block w-full px-3 py-2 border rounded-md placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                  errors.organizationId ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="org_123456789"
                value={formData.organizationId}
                onChange={handleInputChange}
              />
              {errors.organizationId && (
                <p className="mt-1 text-sm text-red-600">{errors.organizationId}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Si tienes un código de organización, ingrésalo aquí
              </p>
            </div>

            {/* Contraseña */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Contraseña *
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className={`appearance-none relative block w-full px-3 py-2 border rounded-md placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                  errors.password ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="Mínimo 6 caracteres"
                value={formData.password}
                onChange={handleInputChange}
              />
              {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
            </div>

            {/* Confirmar contraseña */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Confirmar contraseña *
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                className={`appearance-none relative block w-full px-3 py-2 border rounded-md placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                  errors.confirmPassword ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="Repite tu contraseña"
                value={formData.confirmPassword}
                onChange={handleInputChange}
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
              )}
            </div>

            {/* Términos y condiciones */}
            <div className="pt-4">
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="acceptTerms"
                    name="acceptTerms"
                    type="checkbox"
                    className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                    checked={formData.acceptTerms}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="acceptTerms" className="text-gray-700">
                    Acepto los{' '}
                    <a
                      href="/terms"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:text-indigo-500 underline"
                    >
                      términos y condiciones
                    </a>{' '}
                    y la{' '}
                    <a
                      href="/privacy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:text-indigo-500 underline"
                    >
                      política de privacidad
                    </a>
                  </label>
                  {errors.acceptTerms && (
                    <p className="mt-1 text-sm text-red-600">{errors.acceptTerms}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Error general */}
          {errors.general && (
            <div className="text-red-600 text-sm text-center bg-red-50 border border-red-200 rounded-md p-3">
              {errors.general}
            </div>
          )}

          {/* Botón de registro */}
          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creando cuenta...
                </div>
              ) : (
                'Crear Cuenta'
              )}
            </button>
          </div>

          {/* Enlace al login */}
          <div className="text-sm text-gray-600 text-center">
            <p>
              ¿Ya tienes una cuenta?{' '}
              <a
                href="/login"
                className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors"
              >
                Inicia sesión aquí
              </a>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
