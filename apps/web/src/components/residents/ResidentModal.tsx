'use client';

import { useState, useEffect } from 'react';
import { Resident, Vehicle, Pet } from '@/types/resident';

interface ResidentModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'view' | 'edit' | 'create';
  resident?: Resident | null;
  onSave: (resident: Resident) => void;
}

export default function ResidentModal({
  isOpen,
  onClose,
  mode,
  resident,
  onSave,
}: ResidentModalProps) {
  const [formData, setFormData] = useState<Partial<Resident>>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    apartment: '',
    building: '',
    status: 'pending',
    role: 'owner',
    emergencyContact: {
      name: '',
      phone: '',
      relationship: '',
    },
    vehicles: [],
    pets: [],
    moveInDate: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const [activeTab, setActiveTab] = useState('personal');

  useEffect(() => {
    if (resident && (mode === 'view' || mode === 'edit')) {
      setFormData(resident);
    } else if (mode === 'create') {
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        apartment: '',
        building: '',
        status: 'pending',
        role: 'owner',
        emergencyContact: {
          name: '',
          phone: '',
          relationship: '',
        },
        vehicles: [],
        pets: [],
        moveInDate: new Date().toISOString().split('T')[0],
        notes: '',
      });
    }
  }, [resident, mode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'view') return;

    const residentData: Resident = {
      id: resident?.id || Date.now().toString(),
      firstName: formData.firstName || '',
      lastName: formData.lastName || '',
      email: formData.email || '',
      phone: formData.phone || '',
      apartment: formData.apartment || '',
      building: formData.building,
      status: formData.status || 'pending',
      role: formData.role || 'owner',
      emergencyContact: formData.emergencyContact || {
        name: '',
        phone: '',
        relationship: '',
      },
      vehicles: formData.vehicles || [],
      pets: formData.pets || [],
      moveInDate: formData.moveInDate || new Date().toISOString().split('T')[0],
      moveOutDate: formData.moveOutDate,
      notes: formData.notes,
      createdAt: resident?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(residentData);
    onClose();
  };

  const addVehicle = () => {
    const newVehicle: Vehicle = {
      id: Date.now().toString(),
      make: '',
      model: '',
      year: new Date().getFullYear(),
      color: '',
      licensePlate: '',
      parkingSpot: '',
    };
    setFormData((prev) => ({
      ...prev,
      vehicles: [...(prev.vehicles || []), newVehicle],
    }));
  };

  const removeVehicle = (vehicleId: string) => {
    setFormData((prev) => ({
      ...prev,
      vehicles: prev.vehicles?.filter((v) => v.id !== vehicleId) || [],
    }));
  };

  const updateVehicle = (vehicleId: string, field: keyof Vehicle, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      vehicles:
        prev.vehicles?.map((v) => (v.id === vehicleId ? { ...v, [field]: value } : v)) || [],
    }));
  };

  const addPet = () => {
    const newPet: Pet = {
      id: Date.now().toString(),
      name: '',
      type: 'dog',
      breed: '',
      weight: 0,
      vaccinated: false,
      notes: '',
    };
    setFormData((prev) => ({
      ...prev,
      pets: [...(prev.pets || []), newPet],
    }));
  };

  const removePet = (petId: string) => {
    setFormData((prev) => ({
      ...prev,
      pets: prev.pets?.filter((p) => p.id !== petId) || [],
    }));
  };

  const updatePet = (petId: string, field: keyof Pet, value: string | number | boolean) => {
    setFormData((prev) => ({
      ...prev,
      pets: prev.pets?.map((p) => (p.id === petId ? { ...p, [field]: value } : p)) || [],
    }));
  };

  if (!isOpen) return null;

  const isReadOnly = mode === 'view';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {mode === 'create'
                ? 'Nuevo Residente'
                : mode === 'edit'
                  ? 'Editar Residente'
                  : 'Detalles del Residente'}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-8 px-6">
              {['personal', 'contact', 'vehicles', 'pets'].map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab
                      ? 'border-sky-500 text-sky-600 dark:text-sky-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  {tab === 'personal'
                    ? 'Información Personal'
                    : tab === 'contact'
                      ? 'Contacto de Emergencia'
                      : tab === 'vehicles'
                        ? 'Vehículos'
                        : 'Mascotas'}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Información Personal */}
            {activeTab === 'personal' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    required
                    disabled={isReadOnly}
                    value={formData.firstName || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, firstName: e.target.value }))
                    }
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Apellidos *
                  </label>
                  <input
                    type="text"
                    required
                    disabled={isReadOnly}
                    value={formData.lastName || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, lastName: e.target.value }))}
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    disabled={isReadOnly}
                    value={formData.email || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Teléfono *
                  </label>
                  <input
                    type="tel"
                    required
                    disabled={isReadOnly}
                    value={formData.phone || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Apartamento *
                  </label>
                  <input
                    type="text"
                    required
                    disabled={isReadOnly}
                    value={formData.apartment || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, apartment: e.target.value }))
                    }
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Edificio
                  </label>
                  <select
                    disabled={isReadOnly}
                    value={formData.building || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, building: e.target.value }))}
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  >
                    <option value="">Seleccionar edificio</option>
                    <option value="Edificio Norte">Edificio Norte</option>
                    <option value="Edificio Sur">Edificio Sur</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Estado
                  </label>
                  <select
                    disabled={isReadOnly}
                    value={formData.status || 'pending'}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, status: e.target.value as any }))
                    }
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  >
                    <option value="active">Activo</option>
                    <option value="inactive">Inactivo</option>
                    <option value="pending">Pendiente</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Rol
                  </label>
                  <select
                    disabled={isReadOnly}
                    value={formData.role || 'owner'}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, role: e.target.value as any }))
                    }
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  >
                    <option value="owner">Propietario</option>
                    <option value="tenant">Inquilino</option>
                    <option value="guest">Invitado</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Fecha de Ingreso *
                  </label>
                  <input
                    type="date"
                    required
                    disabled={isReadOnly}
                    value={formData.moveInDate || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, moveInDate: e.target.value }))
                    }
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Fecha de Salida
                  </label>
                  <input
                    type="date"
                    disabled={isReadOnly}
                    value={formData.moveOutDate || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, moveOutDate: e.target.value }))
                    }
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Notas
                  </label>
                  <textarea
                    rows={3}
                    disabled={isReadOnly}
                    value={formData.notes || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  />
                </div>
              </div>
            )}

            {/* Contacto de Emergencia */}
            {activeTab === 'contact' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nombre del Contacto
                  </label>
                  <input
                    type="text"
                    disabled={isReadOnly}
                    value={formData.emergencyContact?.name || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        emergencyContact: {
                          ...prev.emergencyContact!,
                          name: e.target.value,
                        },
                      }))
                    }
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Teléfono del Contacto
                  </label>
                  <input
                    type="tel"
                    disabled={isReadOnly}
                    value={formData.emergencyContact?.phone || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        emergencyContact: {
                          ...prev.emergencyContact!,
                          phone: e.target.value,
                        },
                      }))
                    }
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Relación
                  </label>
                  <input
                    type="text"
                    disabled={isReadOnly}
                    value={formData.emergencyContact?.relationship || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        emergencyContact: {
                          ...prev.emergencyContact!,
                          relationship: e.target.value,
                        },
                      }))
                    }
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  />
                </div>
              </div>
            )}

            {/* Vehículos */}
            {activeTab === 'vehicles' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Vehículos</h3>
                  {!isReadOnly && (
                    <button
                      type="button"
                      onClick={addVehicle}
                      className="inline-flex items-center px-3 py-2 bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium rounded-lg transition-colors duration-200"
                    >
                      <svg
                        className="w-4 h-4 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                        />
                      </svg>
                      Añadir Vehículo
                    </button>
                  )}
                </div>

                {formData.vehicles?.map((vehicle, index) => (
                  <div
                    key={vehicle.id}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                  >
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-md font-medium text-gray-900 dark:text-white">
                        Vehículo #{index + 1}
                      </h4>
                      {!isReadOnly && (
                        <button
                          type="button"
                          onClick={() => removeVehicle(vehicle.id)}
                          className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
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
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Marca
                        </label>
                        <input
                          type="text"
                          disabled={isReadOnly}
                          value={vehicle.make}
                          onChange={(e) => updateVehicle(vehicle.id, 'make', e.target.value)}
                          className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Modelo
                        </label>
                        <input
                          type="text"
                          disabled={isReadOnly}
                          value={vehicle.model}
                          onChange={(e) => updateVehicle(vehicle.id, 'model', e.target.value)}
                          className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Año
                        </label>
                        <input
                          type="number"
                          disabled={isReadOnly}
                          value={vehicle.year}
                          onChange={(e) =>
                            updateVehicle(vehicle.id, 'year', parseInt(e.target.value))
                          }
                          className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Color
                        </label>
                        <input
                          type="text"
                          disabled={isReadOnly}
                          value={vehicle.color}
                          onChange={(e) => updateVehicle(vehicle.id, 'color', e.target.value)}
                          className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Matrícula
                        </label>
                        <input
                          type="text"
                          disabled={isReadOnly}
                          value={vehicle.licensePlate}
                          onChange={(e) =>
                            updateVehicle(vehicle.id, 'licensePlate', e.target.value)
                          }
                          className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Plaza de Aparcamiento
                        </label>
                        <input
                          type="text"
                          disabled={isReadOnly}
                          value={vehicle.parkingSpot || ''}
                          onChange={(e) => updateVehicle(vehicle.id, 'parkingSpot', e.target.value)}
                          className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                {!formData.vehicles?.length && (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    No hay vehículos registrados
                  </div>
                )}
              </div>
            )}

            {/* Mascotas */}
            {activeTab === 'pets' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Mascotas</h3>
                  {!isReadOnly && (
                    <button
                      type="button"
                      onClick={addPet}
                      className="inline-flex items-center px-3 py-2 bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium rounded-lg transition-colors duration-200"
                    >
                      <svg
                        className="w-4 h-4 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                        />
                      </svg>
                      Añadir Mascota
                    </button>
                  )}
                </div>

                {formData.pets?.map((pet, index) => (
                  <div
                    key={pet.id}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                  >
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-md font-medium text-gray-900 dark:text-white">
                        Mascota #{index + 1}
                      </h4>
                      {!isReadOnly && (
                        <button
                          type="button"
                          onClick={() => removePet(pet.id)}
                          className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
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
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Nombre
                        </label>
                        <input
                          type="text"
                          disabled={isReadOnly}
                          value={pet.name}
                          onChange={(e) => updatePet(pet.id, 'name', e.target.value)}
                          className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Tipo
                        </label>
                        <select
                          disabled={isReadOnly}
                          value={pet.type}
                          onChange={(e) => updatePet(pet.id, 'type', e.target.value)}
                          className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                        >
                          <option value="dog">Perro</option>
                          <option value="cat">Gato</option>
                          <option value="bird">Ave</option>
                          <option value="fish">Pez</option>
                          <option value="other">Otro</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Raza
                        </label>
                        <input
                          type="text"
                          disabled={isReadOnly}
                          value={pet.breed || ''}
                          onChange={(e) => updatePet(pet.id, 'breed', e.target.value)}
                          className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Peso (kg)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          disabled={isReadOnly}
                          value={pet.weight || ''}
                          onChange={(e) =>
                            updatePet(pet.id, 'weight', parseFloat(e.target.value) || 0)
                          }
                          className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                        />
                      </div>

                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          disabled={isReadOnly}
                          checked={pet.vaccinated}
                          onChange={(e) => updatePet(pet.id, 'vaccinated', e.target.checked)}
                          className="h-4 w-4 text-sky-600 focus:ring-sky-500 border-gray-300 dark:border-gray-600 rounded"
                        />
                        <label className="ml-2 block text-sm text-gray-900 dark:text-white">
                          Vacunado
                        </label>
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Notas
                        </label>
                        <textarea
                          rows={2}
                          disabled={isReadOnly}
                          value={pet.notes || ''}
                          onChange={(e) => updatePet(pet.id, 'notes', e.target.value)}
                          className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                {!formData.pets?.length && (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    No hay mascotas registradas
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end space-x-4 p-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500"
            >
              {mode === 'view' ? 'Cerrar' : 'Cancelar'}
            </button>
            {mode !== 'view' && (
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-sky-600 border border-transparent rounded-lg hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500"
              >
                {mode === 'create' ? 'Crear Residente' : 'Guardar Cambios'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
