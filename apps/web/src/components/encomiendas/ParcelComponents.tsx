'use client';

import { useState, useEffect } from 'react';

// Componente de Toast Notification
interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  onClose: () => void;
}

export const Toast = ({ message, type, onClose }: ToastProps) => {
  const getToastStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-700 dark:text-green-300';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-700 dark:text-red-300';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-700 dark:text-yellow-300';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-700 dark:text-blue-300';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800 dark:bg-gray-900/20 dark:border-gray-700 dark:text-gray-300';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'error':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        );
      case 'warning':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        );
      case 'info':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className={`fixed top-4 right-4 z-50 max-w-sm w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg border ${getToastStyles()} animate-slide-down`}
    >
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">{getIcon()}</div>
          <div className="ml-3 w-0 flex-1">
            <p className="text-sm font-medium">{message}</p>
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button
              onClick={onClose}
              className="bg-white dark:bg-gray-800 rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
            >
              <span className="sr-only">Cerrar</span>
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente de Modal para crear/editar encomienda
interface ParcelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ParcelFormData) => void;
  initialData?: ParcelFormData;
  isEditing?: boolean;
  isLoading?: boolean;
  isReadOnly?: boolean; // Nueva prop para modo solo lectura
  userUnits?: Array<{
    id: string;
    unit: {
      id: string;
      number: string;
      floor?: string;
      community: {
        id: string;
        name: string;
        address: string;
      };
    };
  }>; // Unidades del usuario para mostrar en modo solo lectura
  units?: Array<{
    id: string;
    number: string;
    floor?: string;
    type: string;
    communityName: string;
    residents: Array<{
      id: string;
      name: string;
      email: string;
      phone?: string;
      status: string;
    }>;
  }>;
}

export interface ParcelFormData {
  id?: string;
  unitId: string;
  description: string;
  sender: string;
  senderPhone?: string;
  // Datos del residente destinatario
  recipientName: string;
  recipientResidence: string;
  recipientPhone?: string;
  recipientEmail?: string;
  // Datos del conserje que recibió
  conciergeName: string;
  conciergePhone?: string;
  notes?: string;
  receivedAt?: Date;
  retrievedAt?: Date;
  status?: 'RECEIVED' | 'RETRIEVED' | 'EXPIRED';
}

export const ParcelModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isEditing = false,
  isLoading = false,
  isReadOnly = false,
  userUnits = [],
  units = [],
}: ParcelModalProps) => {
  const [formData, setFormData] = useState<ParcelFormData>({
    unitId: '',
    description: '',
    sender: '',
    senderPhone: '',
    recipientName: '',
    recipientResidence: '',
    recipientPhone: '',
    recipientEmail: '',
    conciergeName: '',
    conciergePhone: '',
    notes: '',
    ...initialData,
  });

  const [errors, setErrors] = useState<Partial<ParcelFormData>>({});

  // Sincronizar el formulario cuando cambie initialData
  useEffect(() => {
    if (initialData) {
      setFormData((prev) => ({ ...prev, ...initialData }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validación básica
    const newErrors: Partial<ParcelFormData> = {};
    if (!formData.unitId) newErrors.unitId = 'La unidad es requerida';
    if (!formData.description) newErrors.description = 'La descripción es requerida';
    if (!formData.sender) newErrors.sender = 'El remitente es requerido';
    if (!formData.recipientName)
      newErrors.recipientName = 'El nombre del destinatario es requerido';
    if (!formData.recipientResidence)
      newErrors.recipientResidence = 'El número de residencia del destinatario es requerido';
    if (!formData.conciergeName) newErrors.conciergeName = 'El nombre del conserje es requerido';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit(formData);
  };

  const handleChange = (field: keyof ParcelFormData, value: string) => {
    if (isReadOnly) return; // No permitir cambios en modo solo lectura

    // Si se cambia la unidad, autocompletar el número de residencia del destinatario
    if (field === 'unitId' && value) {
      const selectedUnit = units.find((unit) => unit.id === value);
      if (selectedUnit) {
        setFormData((prev) => ({
          ...prev,
          [field]: value,
          recipientResidence: selectedUnit.number, // Autocompletar con el número de la unidad
        }));
      } else {
        setFormData((prev) => ({ ...prev, [field]: value }));
      }
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }

    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  // Helper para aplicar clases de solo lectura
  const getReadOnlyClasses = (baseClasses: string) => {
    return isReadOnly
      ? `${baseClasses} bg-gray-100 dark:bg-gray-700 cursor-not-allowed opacity-75`
      : baseClasses;
  };

  // Helper para aplicar propiedades de solo lectura a inputs
  const getInputProps = (field: keyof ParcelFormData) => ({
    value: formData[field] || '',
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      handleChange(field, e.target.value),
    disabled: isReadOnly,
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Overlay */}
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {isReadOnly
                ? 'Detalles de la Encomienda'
                : isEditing
                  ? 'Editar Encomienda'
                  : 'Nueva Encomienda'}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {isReadOnly
                ? 'Información detallada de la encomienda'
                : isEditing
                  ? 'Modifica los datos de la encomienda'
                  : 'Registra una nueva encomienda en el sistema'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Unidad - Solo mostrar si no es modo solo lectura */}
            {!isReadOnly && (
              <div>
                <label
                  htmlFor="unitId"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Unidad *
                </label>
                <select
                  id="unitId"
                  value={formData.unitId}
                  onChange={(e) => handleChange('unitId', e.target.value)}
                  disabled={isReadOnly}
                  className={getReadOnlyClasses(
                    `w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:text-white ${
                      errors.unitId ? 'border-red-300' : 'border-gray-300 dark:border-gray-600'
                    }`,
                  )}
                >
                  <option value="">Seleccionar unidad</option>
                  {units.map((unit) => (
                    <option key={unit.id} value={unit.id}>
                      {unit.number} - {unit.communityName}
                      {unit.residents.length > 0 && ` (${unit.residents[0].name})`}
                    </option>
                  ))}
                </select>
                {errors.unitId && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.unitId}</p>
                )}
              </div>
            )}

            {/* Mostrar información de unidad en modo solo lectura */}
            {isReadOnly && formData.unitId && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Unidad
                </label>
                <div className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white">
                  {(() => {
                    // Buscar primero en las unidades del usuario (userUnits)
                    const userUnit = userUnits.find((uu) => uu.unit.id === formData.unitId);
                    if (userUnit) {
                      return `${userUnit.unit.number} - ${userUnit.unit.community.name}`;
                    }

                    // Si no se encuentra en userUnits, buscar en la lista de unidades disponibles
                    const unit = units.find((u) => u.id === formData.unitId);
                    if (unit) {
                      return `${unit.number} - ${unit.communityName}`;
                    }

                    // Si no se encuentra, mostrar información básica del unitId
                    return `Unidad ${formData.unitId}`;
                  })()}
                </div>
              </div>
            )}

            {/* Descripción */}
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Descripción *
              </label>
              <input
                type="text"
                id="description"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Ej: Paquete de Amazon, Documentos importantes..."
                disabled={isReadOnly}
                className={getReadOnlyClasses(
                  `w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:text-white ${
                    errors.description ? 'border-red-300' : 'border-gray-300 dark:border-gray-600'
                  }`,
                )}
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.description}</p>
              )}
            </div>

            {/* Remitente */}
            <div>
              <label
                htmlFor="sender"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Remitente *
              </label>
              <input
                type="text"
                id="sender"
                value={formData.sender}
                onChange={(e) => handleChange('sender', e.target.value)}
                placeholder="Ej: Amazon México, DHL, Familia García..."
                disabled={isReadOnly}
                className={getReadOnlyClasses(
                  `w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:text-white ${
                    errors.sender ? 'border-red-300' : 'border-gray-300 dark:border-gray-600'
                  }`,
                )}
              />
              {errors.sender && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.sender}</p>
              )}
            </div>

            {/* Teléfono del remitente */}
            <div>
              <label
                htmlFor="senderPhone"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Teléfono del remitente
              </label>
              <input
                type="tel"
                id="senderPhone"
                {...getInputProps('senderPhone')}
                placeholder="Ej: +52 55 1234 5678"
                className={getReadOnlyClasses(
                  'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:text-white',
                )}
              />
            </div>

            {/* Separador visual */}
            <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                <svg
                  className="w-4 h-4 mr-2 text-blue-600 dark:text-blue-400"
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
                Datos del Destinatario
              </h4>
            </div>

            {/* Nombre del destinatario */}
            <div>
              <label
                htmlFor="recipientName"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Nombre del destinatario *
              </label>
              <input
                type="text"
                id="recipientName"
                {...getInputProps('recipientName')}
                placeholder="Ej: Juan Pérez, María García..."
                className={getReadOnlyClasses(
                  `w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:text-white ${
                    errors.recipientName ? 'border-red-300' : 'border-gray-300 dark:border-gray-600'
                  }`,
                )}
              />
              {errors.recipientName && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.recipientName}
                </p>
              )}
            </div>

            {/* Número de residencia del destinatario */}
            <div>
              <label
                htmlFor="recipientResidence"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Número de residencia del destinatario *
              </label>
              <input
                type="text"
                id="recipientResidence"
                {...getInputProps('recipientResidence')}
                placeholder="Ej: 101, 205, 302..."
                className={getReadOnlyClasses(
                  `w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:text-white ${
                    errors.recipientResidence
                      ? 'border-red-300'
                      : 'border-gray-300 dark:border-gray-600'
                  }`,
                )}
              />
              {errors.recipientResidence && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.recipientResidence}
                </p>
              )}
            </div>

            {/* Teléfono del destinatario */}
            <div>
              <label
                htmlFor="recipientPhone"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Teléfono del destinatario
              </label>
              <input
                type="tel"
                id="recipientPhone"
                {...getInputProps('recipientPhone')}
                placeholder="Ej: +52 55 9876 5432"
                className={getReadOnlyClasses(
                  'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:text-white',
                )}
              />
            </div>

            {/* Email del destinatario */}
            <div>
              <label
                htmlFor="recipientEmail"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Email del destinatario
              </label>
              <input
                type="email"
                id="recipientEmail"
                {...getInputProps('recipientEmail')}
                placeholder="Ej: juan.perez@email.com"
                className={getReadOnlyClasses(
                  'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:text-white',
                )}
              />
            </div>

            {/* Separador visual */}
            <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                <svg
                  className="w-4 h-4 mr-2 text-green-600 dark:text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Datos del Conserje
              </h4>
            </div>

            {/* Nombre del conserje */}
            <div>
              <label
                htmlFor="conciergeName"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Nombre del conserje que recibió *
              </label>
              <input
                type="text"
                id="conciergeName"
                {...getInputProps('conciergeName')}
                placeholder="Ej: Carlos López, Ana Martínez..."
                className={getReadOnlyClasses(
                  `w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:text-white ${
                    errors.conciergeName ? 'border-red-300' : 'border-gray-300 dark:border-gray-600'
                  }`,
                )}
              />
              {errors.conciergeName && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.conciergeName}
                </p>
              )}
            </div>

            {/* Teléfono del conserje */}
            <div>
              <label
                htmlFor="conciergePhone"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Teléfono del conserje
              </label>
              <input
                type="tel"
                id="conciergePhone"
                {...getInputProps('conciergePhone')}
                placeholder="Ej: +52 55 1111 2222"
                className={getReadOnlyClasses(
                  'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:text-white',
                )}
              />
            </div>

            {/* Notas */}
            <div>
              <label
                htmlFor="notes"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Notas adicionales
              </label>
              <textarea
                id="notes"
                {...getInputProps('notes')}
                rows={3}
                placeholder="Información adicional sobre la encomienda..."
                className={getReadOnlyClasses(
                  'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:text-white',
                )}
              />
            </div>

            {/* Botones */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className={`${isReadOnly ? 'w-full' : 'flex-1'} px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200`}
              >
                {isReadOnly ? 'Cerrar' : 'Cancelar'}
              </button>
              {!isReadOnly && (
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-all duration-200"
                >
                  {isLoading ? 'Guardando...' : isEditing ? 'Actualizar' : 'Registrar'}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Componente de Badge de Estado
interface StatusBadgeProps {
  status: 'RECEIVED' | 'RETRIEVED' | 'EXPIRED';
}

export const StatusBadge = ({ status }: StatusBadgeProps) => {
  const statusConfig = {
    RECEIVED: {
      text: 'Recibido',
      color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
    RETRIEVED: {
      text: 'Entregado',
      color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ),
    },
    EXPIRED: {
      text: 'Vencido',
      color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
          />
        </svg>
      ),
    },
  };

  const config = statusConfig[status];

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}
    >
      <span className="mr-1">{config.icon}</span>
      {config.text}
    </span>
  );
};

// Hook para manejar encomiendas
export const useParcels = () => {
  const [parcels, setParcels] = useState<ParcelFormData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createParcel = async (data: ParcelFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const { ParcelsService } = await import('@/services/parcels.service');
      const newParcel = await ParcelsService.createParcel(data);

      setParcels((prev) => [newParcel, ...prev]);
      return newParcel;
    } catch (err) {
      setError('Error al crear la encomienda');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateParcel = async (id: string, data: Partial<ParcelFormData>) => {
    setIsLoading(true);
    setError(null);

    try {
      const { ParcelsService } = await import('@/services/parcels.service');
      const updatedParcel = await ParcelsService.updateParcel(id, data);

      setParcels((prev) => prev.map((parcel) => (parcel.id === id ? updatedParcel : parcel)));
    } catch (err) {
      setError('Error al actualizar la encomienda');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRetrieved = async (id: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const { ParcelsService } = await import('@/services/parcels.service');
      const updatedParcel = await ParcelsService.markAsRetrieved(id);

      setParcels((prev) => prev.map((parcel) => (parcel.id === id ? updatedParcel : parcel)));
    } catch (err) {
      setError('Error al marcar como entregado');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    parcels,
    isLoading,
    error,
    createParcel,
    updateParcel,
    markAsRetrieved,
  };
};
