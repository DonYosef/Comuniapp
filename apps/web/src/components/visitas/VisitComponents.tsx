'use client';

import { useState } from 'react';

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

// Componente de Modal para crear/editar visita
interface VisitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: VisitFormData) => void;
  initialData?: VisitFormData;
  isEditing?: boolean;
  isLoading?: boolean;
  isReadOnly?: boolean;
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
  }>;
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

export interface VisitFormData {
  id?: string;
  visitorName: string;
  visitorId: string;
  visitorPhone?: string;
  visitorEmail?: string;
  unitId: string;
  hostUserId?: string; // ID del usuario que está creando la visita
  residentName: string;
  residentPhone?: string;
  visitPurpose: string;
  expectedArrival: string;
  expectedDeparture?: string;
  vehicleInfo?: string;
  notes?: string;
  status?: 'SCHEDULED' | 'ARRIVED' | 'COMPLETED' | 'CANCELLED';
  arrivalTime?: Date;
  departureTime?: Date;
}

export const VisitModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isEditing = false,
  isLoading = false,
  isReadOnly = false,
  userUnits = [],
  units = [],
}: VisitModalProps) => {
  const [formData, setFormData] = useState<VisitFormData>({
    visitorName: '',
    visitorId: '',
    visitorPhone: '',
    visitorEmail: '',
    unitId: '',
    hostUserId: '',
    residentName: '',
    residentPhone: '',
    visitPurpose: '',
    expectedArrival: '',
    expectedDeparture: '',
    vehicleInfo: '',
    notes: '',
    ...initialData,
  });

  const [errors, setErrors] = useState<Partial<VisitFormData>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validación básica
    const newErrors: Partial<VisitFormData> = {};
    if (!formData.visitorName) newErrors.visitorName = 'El nombre del visitante es requerido';
    if (!formData.visitorId) newErrors.visitorId = 'La identificación del visitante es requerida';
    if (!formData.unitId) newErrors.unitId = 'La unidad es requerida';
    if (!formData.residentName) newErrors.residentName = 'El nombre del residente es requerido';
    if (!formData.visitPurpose) newErrors.visitPurpose = 'El propósito de la visita es requerido';
    if (!formData.expectedArrival)
      newErrors.expectedArrival = 'La fecha y hora de llegada es requerida';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit(formData);
  };

  const handleChange = (field: keyof VisitFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

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
        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {isReadOnly
                ? 'Ver Detalles de la Visita'
                : isEditing
                  ? 'Editar Visita'
                  : 'Nueva Visita'}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {isReadOnly
                ? 'Información detallada de la visita'
                : isEditing
                  ? 'Modifica los datos de la visita'
                  : 'Registra una nueva visita en el sistema'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Información del Visitante */}
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
                Información del Visitante
              </h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Nombre del visitante */}
              <div>
                <label
                  htmlFor="visitorName"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Nombre del visitante *
                </label>
                <input
                  type="text"
                  id="visitorName"
                  value={formData.visitorName}
                  onChange={(e) => handleChange('visitorName', e.target.value)}
                  placeholder="Ej: Juan Pérez, María García..."
                  disabled={isReadOnly}
                  readOnly={isReadOnly}
                  className={`w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white ${
                    errors.visitorName ? 'border-red-300' : 'border-gray-300 dark:border-gray-600'
                  } ${isReadOnly ? 'bg-gray-100 dark:bg-gray-600 cursor-not-allowed' : ''}`}
                />
                {errors.visitorName && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.visitorName}
                  </p>
                )}
              </div>

              {/* Identificación del visitante */}
              <div>
                <label
                  htmlFor="visitorId"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Identificación *
                </label>
                <input
                  type="text"
                  id="visitorId"
                  value={formData.visitorId}
                  onChange={(e) => handleChange('visitorId', e.target.value)}
                  placeholder="Ej: 12345678, ABC123456..."
                  disabled={isReadOnly}
                  readOnly={isReadOnly}
                  className={`w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white ${
                    errors.visitorId ? 'border-red-300' : 'border-gray-300 dark:border-gray-600'
                  } ${isReadOnly ? 'bg-gray-100 dark:bg-gray-600 cursor-not-allowed' : ''}`}
                />
                {errors.visitorId && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.visitorId}</p>
                )}
              </div>

              {/* Teléfono del visitante */}
              <div>
                <label
                  htmlFor="visitorPhone"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Teléfono del visitante
                </label>
                <input
                  type="tel"
                  id="visitorPhone"
                  value={formData.visitorPhone}
                  onChange={(e) => handleChange('visitorPhone', e.target.value)}
                  placeholder="Ej: +52 55 1234 5678"
                  disabled={isReadOnly}
                  readOnly={isReadOnly}
                  className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white ${
                    isReadOnly ? 'bg-gray-100 dark:bg-gray-600 cursor-not-allowed' : ''
                  }`}
                />
              </div>

              {/* Email del visitante */}
              <div>
                <label
                  htmlFor="visitorEmail"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Email del visitante
                </label>
                <input
                  type="email"
                  id="visitorEmail"
                  value={formData.visitorEmail}
                  onChange={(e) => handleChange('visitorEmail', e.target.value)}
                  placeholder="Ej: juan.perez@email.com"
                  disabled={isReadOnly}
                  readOnly={isReadOnly}
                  className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white ${
                    isReadOnly ? 'bg-gray-100 dark:bg-gray-600 cursor-not-allowed' : ''
                  }`}
                />
              </div>
            </div>

            {/* Información del Residente */}
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
                    d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"
                  />
                </svg>
                Información del Residente
              </h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Unidad */}
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
                  className={`w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white ${
                    errors.unitId ? 'border-red-300' : 'border-gray-300 dark:border-gray-600'
                  } ${isReadOnly ? 'bg-gray-100 dark:bg-gray-600 cursor-not-allowed' : ''}`}
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

              {/* Mostrar unidad del residente en modo de solo lectura */}
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

              {/* Nombre del residente */}
              <div>
                <label
                  htmlFor="residentName"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Nombre del residente *
                </label>
                <input
                  type="text"
                  id="residentName"
                  value={formData.residentName}
                  onChange={(e) => handleChange('residentName', e.target.value)}
                  placeholder="Ej: Carlos López, Ana Martínez..."
                  disabled={isReadOnly}
                  readOnly={isReadOnly}
                  className={`w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white ${
                    errors.residentName ? 'border-red-300' : 'border-gray-300 dark:border-gray-600'
                  } ${isReadOnly ? 'bg-gray-100 dark:bg-gray-600 cursor-not-allowed' : ''}`}
                />
                {errors.residentName && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.residentName}
                  </p>
                )}
              </div>

              {/* Teléfono del residente */}
              <div>
                <label
                  htmlFor="residentPhone"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Teléfono del residente
                </label>
                <input
                  type="tel"
                  id="residentPhone"
                  value={formData.residentPhone}
                  onChange={(e) => handleChange('residentPhone', e.target.value)}
                  placeholder="Ej: +52 55 9876 5432"
                  disabled={isReadOnly}
                  readOnly={isReadOnly}
                  className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white ${
                    isReadOnly ? 'bg-gray-100 dark:bg-gray-600 cursor-not-allowed' : ''
                  }`}
                />
              </div>
            </div>

            {/* Detalles de la Visita */}
            <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                <svg
                  className="w-4 h-4 mr-2 text-purple-600 dark:text-purple-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                Detalles de la Visita
              </h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Propósito de la visita */}
              <div className="md:col-span-2">
                <label
                  htmlFor="visitPurpose"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Propósito de la visita *
                </label>
                <select
                  id="visitPurpose"
                  value={formData.visitPurpose}
                  onChange={(e) => handleChange('visitPurpose', e.target.value)}
                  disabled={isReadOnly}
                  className={`w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white ${
                    errors.visitPurpose ? 'border-red-300' : 'border-gray-300 dark:border-gray-600'
                  } ${isReadOnly ? 'bg-gray-100 dark:bg-gray-600 cursor-not-allowed' : ''}`}
                >
                  <option value="">Seleccionar propósito</option>
                  <option value="personal">Visita personal</option>
                  <option value="business">Negocios</option>
                  <option value="delivery">Entrega</option>
                  <option value="maintenance">Mantenimiento</option>
                  <option value="emergency">Emergencia</option>
                  <option value="other">Otro</option>
                </select>
                {errors.visitPurpose && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.visitPurpose}
                  </p>
                )}
              </div>

              {/* Fecha y hora de llegada esperada */}
              <div>
                <label
                  htmlFor="expectedArrival"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Fecha y hora de llegada *
                </label>
                <input
                  type="datetime-local"
                  id="expectedArrival"
                  value={formData.expectedArrival}
                  onChange={(e) => handleChange('expectedArrival', e.target.value)}
                  disabled={isReadOnly}
                  readOnly={isReadOnly}
                  className={`w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white ${
                    errors.expectedArrival
                      ? 'border-red-300'
                      : 'border-gray-300 dark:border-gray-600'
                  } ${isReadOnly ? 'bg-gray-100 dark:bg-gray-600 cursor-not-allowed' : ''}`}
                />
                {errors.expectedArrival && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.expectedArrival}
                  </p>
                )}
              </div>

              {/* Fecha y hora de salida esperada */}
              <div>
                <label
                  htmlFor="expectedDeparture"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Fecha y hora de salida
                </label>
                <input
                  type="datetime-local"
                  id="expectedDeparture"
                  value={formData.expectedDeparture}
                  onChange={(e) => handleChange('expectedDeparture', e.target.value)}
                  disabled={isReadOnly}
                  readOnly={isReadOnly}
                  className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white ${
                    isReadOnly ? 'bg-gray-100 dark:bg-gray-600 cursor-not-allowed' : ''
                  }`}
                />
              </div>

              {/* Información del vehículo */}
              <div className="md:col-span-2">
                <label
                  htmlFor="vehicleInfo"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Información del vehículo
                </label>
                <input
                  type="text"
                  id="vehicleInfo"
                  value={formData.vehicleInfo}
                  onChange={(e) => handleChange('vehicleInfo', e.target.value)}
                  placeholder="Ej: Toyota Corolla ABC-123, Moto Honda XYZ-456..."
                  disabled={isReadOnly}
                  readOnly={isReadOnly}
                  className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white ${
                    isReadOnly ? 'bg-gray-100 dark:bg-gray-600 cursor-not-allowed' : ''
                  }`}
                />
              </div>

              {/* Notas */}
              <div className="md:col-span-2">
                <label
                  htmlFor="notes"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Notas adicionales
                </label>
                <textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleChange('notes', e.target.value)}
                  rows={3}
                  placeholder="Información adicional sobre la visita..."
                  disabled={isReadOnly}
                  readOnly={isReadOnly}
                  className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white ${
                    isReadOnly ? 'bg-gray-100 dark:bg-gray-600 cursor-not-allowed' : ''
                  }`}
                />
              </div>
            </div>

            {/* Botones */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              {isReadOnly ? (
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full px-4 py-2 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white font-medium rounded-xl transition-all duration-200"
                >
                  Cerrar
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-all duration-200"
                  >
                    {isLoading ? 'Guardando...' : isEditing ? 'Actualizar' : 'Registrar'}
                  </button>
                </>
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
  status: 'SCHEDULED' | 'ARRIVED' | 'COMPLETED' | 'CANCELLED';
}

export const StatusBadge = ({ status }: StatusBadgeProps) => {
  const statusConfig = {
    SCHEDULED: {
      text: 'Programada',
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
    ARRIVED: {
      text: 'Llegó',
      color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      ),
    },
    COMPLETED: {
      text: 'Completada',
      color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ),
    },
    CANCELLED: {
      text: 'Cancelada',
      color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
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

// Hook para manejar visitas
export const useVisits = () => {
  const [visits, setVisits] = useState<VisitFormData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createVisit = async (data: VisitFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const { VisitorsService } = await import('@/services/visitors.service');

      // Mapear VisitFormData a VisitorFormData
      const visitorData = {
        ...data,
        visitorDocument: data.visitorId, // Mapear visitorId a visitorDocument
        hostUserId: data.hostUserId || '', // Agregar hostUserId si no está presente
      };

      // Eliminar visitorId del objeto para evitar conflictos
      delete visitorData.visitorId;

      console.log('🔍 [useVisits] createVisit - data original:', data);
      console.log('🔍 [useVisits] createVisit - data mapeada:', visitorData);

      const newVisit = await VisitorsService.createVisitor(visitorData);

      setVisits((prev) => [newVisit, ...prev]);
      return newVisit;
    } catch (err) {
      setError('Error al crear la visita');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateVisit = async (id: string, data: Partial<VisitFormData>) => {
    setIsLoading(true);
    setError(null);

    try {
      const { VisitorsService } = await import('@/services/visitors.service');

      // Mapear VisitFormData a VisitorFormData para actualización
      const visitorData = { ...data };
      if (data.visitorId) {
        visitorData.visitorDocument = data.visitorId;
        delete visitorData.visitorId;
      }

      const updatedVisit = await VisitorsService.updateVisitor(id, visitorData);

      setVisits((prev) => prev.map((visit) => (visit.id === id ? updatedVisit : visit)));
    } catch (err) {
      setError('Error al actualizar la visita');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const markAsArrived = async (id: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const { VisitorsService } = await import('@/services/visitors.service');
      const updatedVisit = await VisitorsService.markAsArrived(id);

      setVisits((prev) => prev.map((visit) => (visit.id === id ? updatedVisit : visit)));
    } catch (err) {
      setError('Error al marcar como llegado');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const markAsCompleted = async (id: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const { VisitorsService } = await import('@/services/visitors.service');
      const updatedVisit = await VisitorsService.markAsCompleted(id);

      setVisits((prev) => prev.map((visit) => (visit.id === id ? updatedVisit : visit)));
    } catch (err) {
      setError('Error al marcar como completada');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    visits,
    isLoading,
    error,
    createVisit,
    updateVisit,
    markAsArrived,
    markAsCompleted,
  };
};
