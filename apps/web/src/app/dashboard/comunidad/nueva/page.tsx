'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import {
  communityService,
  CommunityFormData as ServiceCommunityFormData,
  CommonSpace,
} from '@/services/communityService';
import { useCommunities } from '@/hooks/useCommunities';

interface CommunityFormData {
  name: string;
  description: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  type: 'CONDOMINIO' | 'EDIFICIO';
  totalUnits: string;
  constructionYear: string;
  floors?: string;
  unitsPerFloor?: string;
  buildingStructure?: { [floor: number]: string[] };
  commonSpaces: CommonSpace[];
  image: File | null;
  imagePreview: string | null;
}

const initialFormData: CommunityFormData = {
  name: '',
  description: '',
  address: '',
  phone: '',
  email: '',
  website: '',
  type: 'EDIFICIO', // Cambiar valor por defecto a EDIFICIO
  totalUnits: '',
  constructionYear: '',
  floors: '',
  unitsPerFloor: '',
  buildingStructure: {},
  commonSpaces: [],
  image: null,
  imagePreview: null,
};

const availableCommonSpaces = [
  { name: 'Piscina', icon: '🏊‍♀️', defaultQuantity: 1 },
  { name: 'Gimnasio', icon: '💪', defaultQuantity: 1 },
  { name: 'Parque infantil', icon: '🎠', defaultQuantity: 1 },
  { name: 'Área de juegos', icon: '🎮', defaultQuantity: 1 },
  { name: 'Salón de eventos', icon: '🎉', defaultQuantity: 1 },
  { name: 'Cancha de tenis', icon: '🎾', defaultQuantity: 1 },
  { name: 'Cancha de fútbol', icon: '⚽', defaultQuantity: 1 },
  { name: 'Área de barbacoa', icon: '🔥', defaultQuantity: 1 },
  { name: 'Quincho', icon: '🍖', defaultQuantity: 1 },
  { name: 'Estacionamiento visitas', icon: '🚗', defaultQuantity: 1 },
  { name: 'Seguridad 24/7', icon: '🛡️', defaultQuantity: 1 },
  { name: 'Jardines', icon: '🌿', defaultQuantity: 1 },
  { name: 'Terraza', icon: '🏞️', defaultQuantity: 1 },
  { name: 'Lavandería', icon: '👕', defaultQuantity: 1 },
  { name: 'Ascensor', icon: '🛗', defaultQuantity: 1 },
  { name: 'Área de mascotas', icon: '🐕', defaultQuantity: 1 },
  { name: 'Salón de usos múltiples', icon: '🏛️', defaultQuantity: 1 },
  { name: 'Sala de reuniones', icon: '🤝', defaultQuantity: 1 },
  { name: 'Área de oficinas', icon: '💼', defaultQuantity: 1 },
];

export default function NuevaComunidadPage() {
  const router = useRouter();
  const { refetch } = useCommunities();
  const [formData, setFormData] = useState<CommunityFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<CommunityFormData>>({});
  const [isDragOver, setIsDragOver] = useState(false);
  const [isStructureModalOpen, setIsStructureModalOpen] = useState(false);
  const [showAllCommonSpaces, setShowAllCommonSpaces] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
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

  // Función para manejar la selección de espacios comunes
  const handleCommonSpaceToggle = (spaceName: string) => {
    setFormData((prev) => {
      const currentSpaces = prev.commonSpaces;
      const isSelected = currentSpaces.some((space) => space.name === spaceName);

      if (isSelected) {
        // Remover el espacio
        return {
          ...prev,
          commonSpaces: currentSpaces.filter((space) => space.name !== spaceName),
        };
      } else {
        // Agregar el espacio con cantidad por defecto
        const spaceConfig = availableCommonSpaces.find((s) => s.name === spaceName);
        return {
          ...prev,
          commonSpaces: [
            ...currentSpaces,
            {
              name: spaceName,
              quantity: spaceConfig?.defaultQuantity || 1,
              description: '',
            },
          ],
        };
      }
    });
  };

  // Función para cambiar la cantidad de un espacio común
  const handleCommonSpaceQuantityChange = (spaceName: string, quantity: number) => {
    if (quantity < 1) return; // No permitir cantidades menores a 1

    setFormData((prev) => ({
      ...prev,
      commonSpaces: prev.commonSpaces.map((space) =>
        space.name === spaceName ? { ...space, quantity } : space,
      ),
    }));
  };

  const handleImageChange = (file: File | null) => {
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFormData((prev) => ({
          ...prev,
          image: file,
          imagePreview: e.target?.result as string,
        }));
      };
      reader.readAsDataURL(file);
    } else {
      setFormData((prev) => ({
        ...prev,
        image: null,
        imagePreview: null,
      }));
    }
  };

  const showSuccessToast = (message: string) => {
    // Crear elemento toast
    const toast = document.createElement('div');
    toast.className =
      'fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-xl shadow-lg transform transition-all duration-300 translate-x-full opacity-0';
    toast.innerHTML = `
      <div class="flex items-center space-x-2">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>
        <span class="font-medium">${message}</span>
      </div>
    `;

    document.body.appendChild(toast);

    // Animar entrada
    setTimeout(() => {
      toast.classList.remove('translate-x-full', 'opacity-0');
      toast.classList.add('translate-x-0', 'opacity-100');
    }, 100);

    // Remover después de 3 segundos
    setTimeout(() => {
      toast.classList.remove('translate-x-0', 'opacity-100');
      toast.classList.add('translate-x-full', 'opacity-0');
      setTimeout(() => {
        if (document.body.contains(toast)) {
          document.body.removeChild(toast);
        }
      }, 300);
    }, 3000);
  };

  const showErrorToast = (message: string) => {
    // Crear elemento toast
    const toast = document.createElement('div');
    toast.className =
      'fixed top-4 right-4 z-50 bg-red-500 text-white px-6 py-3 rounded-xl shadow-lg transform transition-all duration-300 translate-x-full opacity-0';
    toast.innerHTML = `
      <div class="flex items-center space-x-2">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
        <span class="font-medium">${message}</span>
      </div>
    `;

    document.body.appendChild(toast);

    // Animar entrada
    setTimeout(() => {
      toast.classList.remove('translate-x-full', 'opacity-0');
      toast.classList.add('translate-x-0', 'opacity-100');
    }, 100);

    // Remover después de 4 segundos
    setTimeout(() => {
      toast.classList.remove('translate-x-0', 'opacity-100');
      toast.classList.add('translate-x-full', 'opacity-0');
      setTimeout(() => {
        if (document.body.contains(toast)) {
          document.body.removeChild(toast);
        }
      }, 300);
    }, 4000);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    handleImageChange(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      handleImageChange(file);
    }
  };

  const removeImage = () => {
    handleImageChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Función para manejar el cambio de tipo (edificio/condominio)
  const handleTypeChange = (type: 'CONDOMINIO' | 'EDIFICIO') => {
    setFormData((prev) => ({
      ...prev,
      type,
      // Reset campos específicos del edificio si cambia a condominio
      ...(type === 'CONDOMINIO'
        ? {
            floors: '',
            unitsPerFloor: '',
            buildingStructure: {},
          }
        : {}),
    }));
  };

  // Función para calcular total de unidades automáticamente
  const calculateTotalUnits = (floors: string, unitsPerFloor: string) => {
    const floorsNum = parseInt(floors) || 0;
    const unitsPerFloorNum = parseInt(unitsPerFloor) || 0;
    return (floorsNum * unitsPerFloorNum).toString();
  };

  // Función para manejar cambios en pisos o unidades por piso
  const handleBuildingDataChange = (field: 'floors' | 'unitsPerFloor', value: string) => {
    const newData = { ...formData, [field]: value };

    // Calcular total de unidades automáticamente
    const totalUnits = calculateTotalUnits(
      field === 'floors' ? value : newData.floors || '',
      field === 'unitsPerFloor' ? value : newData.unitsPerFloor || '',
    );

    // Generar estructura inicial del edificio
    const floors = parseInt(field === 'floors' ? value : newData.floors || '0');
    const unitsPerFloor = parseInt(
      field === 'unitsPerFloor' ? value : newData.unitsPerFloor || '0',
    );

    let buildingStructure = { ...formData.buildingStructure };
    if (floors > 0 && unitsPerFloor > 0) {
      // Generar estructura inicial
      for (let floor = 1; floor <= floors; floor++) {
        if (!buildingStructure[floor]) {
          buildingStructure[floor] = [];
        }
        // Generar unidades iniciales si no existen
        while (buildingStructure[floor].length < unitsPerFloor) {
          const unitNumber = buildingStructure[floor].length + 1;
          buildingStructure[floor].push(`${floor}${unitNumber.toString().padStart(2, '0')}`);
        }
        // Eliminar unidades excedentes
        if (buildingStructure[floor].length > unitsPerFloor) {
          buildingStructure[floor] = buildingStructure[floor].slice(0, unitsPerFloor);
        }
      }
    }

    setFormData((prev) => ({
      ...prev,
      [field]: value,
      totalUnits,
      buildingStructure,
    }));
  };

  // Función para agregar unidad a un piso
  const addUnitToFloor = (floor: number) => {
    setFormData((prev) => {
      const currentUnits = prev.buildingStructure?.[floor] || [];
      const nextUnitNumber = currentUnits.length + 1;
      const newUnit = `${floor}${nextUnitNumber.toString().padStart(2, '0')}`;

      const newBuildingStructure = {
        ...prev.buildingStructure,
        [floor]: [...currentUnits, newUnit],
      };

      // Calcular nuevo total de unidades
      const totalUnits = Object.values(newBuildingStructure).reduce(
        (total, units) => total + units.length,
        0,
      );

      return {
        ...prev,
        buildingStructure: newBuildingStructure,
        totalUnits: totalUnits.toString(),
      };
    });
  };

  // Función para eliminar unidad de un piso
  const removeUnitFromFloor = (floor: number, unitIndex: number) => {
    setFormData((prev) => {
      const newBuildingStructure = {
        ...prev.buildingStructure,
        [floor]: prev.buildingStructure?.[floor]?.filter((_, index) => index !== unitIndex) || [],
      };

      // Calcular nuevo total de unidades
      const totalUnits = Object.values(newBuildingStructure).reduce(
        (total, units) => total + units.length,
        0,
      );

      return {
        ...prev,
        buildingStructure: newBuildingStructure,
        totalUnits: totalUnits.toString(),
      };
    });
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<CommunityFormData> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre de la comunidad es requerido';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'La descripción es requerida';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'La dirección es requerida';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'El teléfono es requerido';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'El email no es válido';
    }

    if (!formData.totalUnits.trim()) {
      newErrors.totalUnits = 'El número de unidades es requerido';
    } else if (isNaN(Number(formData.totalUnits)) || Number(formData.totalUnits) <= 0) {
      newErrors.totalUnits = 'El número de unidades debe ser un número válido';
    }

    // Validaciones específicas para edificio
    if (formData.type === 'EDIFICIO') {
      if (!formData.floors?.trim()) {
        newErrors.floors = 'El número de pisos es requerido';
      } else if (isNaN(Number(formData.floors)) || Number(formData.floors) <= 0) {
        newErrors.floors = 'El número de pisos debe ser un número válido';
      }

      if (!formData.unitsPerFloor?.trim()) {
        newErrors.unitsPerFloor = 'Las unidades por piso son requeridas';
      } else if (isNaN(Number(formData.unitsPerFloor)) || Number(formData.unitsPerFloor) <= 0) {
        newErrors.unitsPerFloor = 'Las unidades por piso deben ser un número válido';
      }
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
      // Preparar datos para enviar al servicio
      const communityData: ServiceCommunityFormData = {
        name: formData.name,
        description: formData.description,
        address: formData.address,
        phone: formData.phone,
        email: formData.email,
        website: formData.website,
        type: formData.type,
        totalUnits: parseInt(formData.totalUnits),
        constructionYear: formData.constructionYear
          ? parseInt(formData.constructionYear)
          : undefined,
        floors: formData.floors ? parseInt(formData.floors) : undefined,
        unitsPerFloor: formData.unitsPerFloor ? parseInt(formData.unitsPerFloor) : undefined,
        buildingStructure: formData.buildingStructure,
        commonSpaces: formData.commonSpaces,
        imageUrl: formData.imagePreview || undefined, // Por ahora usar la URL de preview, en el futuro subir la imagen
      };

      // Crear la comunidad
      const newCommunity = await communityService.createCommunity(communityData);

      console.log('Comunidad creada exitosamente:', newCommunity);

      // Mostrar toast de éxito inmediatamente
      showSuccessToast('Comunidad creada exitosamente ✅');

      // Redirigir al dashboard después del toast
      setTimeout(() => {
        console.log('🔄 [FRONTEND] Redirigiendo al dashboard...');
        router.push('/dashboard');
        // Recargar la página para actualizar los datos
        setTimeout(() => {
          window.location.reload();
        }, 100);
      }, 1000);
    } catch (error) {
      console.error('Error al crear la comunidad:', error);
      showErrorToast(
        error instanceof Error ? error.message : 'Hubo un error al crear la comunidad.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-8 animate-fade-in">
          {/* Header moderno */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-4 sm:p-6 md:p-8 border border-green-100 dark:border-gray-700 animate-slide-down">
            <div className="flex items-center space-x-3">
              <div className="p-2 sm:p-3 bg-green-100 dark:bg-green-900 rounded-xl">
                <svg
                  className="w-6 h-6 sm:w-8 sm:h-8 text-green-600 dark:text-green-400"
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
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                  Crear Nueva Comunidad
                </h1>
                <p className="text-sm sm:text-base lg:text-lg text-gray-600 dark:text-gray-400">
                  Completa la información para crear una nueva comunidad residencial
                </p>
              </div>
            </div>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Información Básica */}
            <div
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden animate-fade-in-up"
              style={{ animationDelay: '0.1s' }}
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
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      />
                    </svg>
                  </div>
                  Información Básica
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  Datos principales de la comunidad residencial
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
                      placeholder="Ej: Residencial Los Pinos"
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
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Descripción *
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                    className={`w-full px-4 py-3 border-2 rounded-xl text-base transition-all duration-200 resize-none ${
                      errors.description
                        ? 'border-red-400 dark:border-red-500 bg-red-50 dark:bg-red-900/20'
                        : 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:border-green-500 focus:ring-4 focus:ring-green-100 dark:focus:ring-green-900/30'
                    } text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500`}
                    placeholder="Describe las características principales de la comunidad, su ubicación, estilo arquitectónico y aspectos destacados..."
                  />
                  {errors.description && (
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
                      {errors.description}
                    </p>
                  )}
                </div>

                {/* Foto con Drag & Drop */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Foto de la Comunidad
                  </label>
                  <div
                    className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all duration-200 ${
                      isDragOver
                        ? 'border-green-400 bg-green-50 dark:bg-green-900/20'
                        : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 hover:border-green-400 hover:bg-green-50 dark:hover:bg-green-900/20'
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileInputChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />

                    {formData.imagePreview ? (
                      <div className="relative">
                        <img
                          src={formData.imagePreview}
                          alt="Preview"
                          className="mx-auto h-32 w-auto rounded-lg object-cover"
                        />
                        <button
                          type="button"
                          onClick={removeImage}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                        >
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
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="mx-auto w-12 h-12 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center">
                          <svg
                            className="w-8 h-8 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                        </div>
                        <div>
                          <p className="text-base font-medium text-gray-900 dark:text-white">
                            Arrastra una imagen aquí o haz clic para seleccionar
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            PNG, JPG, GIF hasta 5MB
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Información de Contacto */}
            <div
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden animate-fade-in-up"
              style={{ animationDelay: '0.2s' }}
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
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                      />
                    </svg>
                  </div>
                  Información de Contacto
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  Datos de contacto y ubicación de la comunidad
                </p>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                  {/* Dirección */}
                  <div className="lg:col-span-2">
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
                        className={`w-full px-4 py-3 lg:py-2 border-2 rounded-xl text-base transition-all duration-200 ${
                          errors.address
                            ? 'border-red-400 dark:border-red-500 bg-red-50 dark:bg-red-900/20'
                            : 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:border-green-500 focus:ring-4 focus:ring-green-100 dark:focus:ring-green-900/30'
                        } text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500`}
                        placeholder="Calle Principal 123, Ciudad, Estado, Código Postal"
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
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      <span className="mr-2">📞</span>
                      Teléfono *
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 border-2 rounded-xl text-base transition-all duration-200 ${
                          errors.phone
                            ? 'border-red-400 dark:border-red-500 bg-red-50 dark:bg-red-900/20'
                            : 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:border-green-500 focus:ring-4 focus:ring-green-100 dark:focus:ring-green-900/30'
                        } text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500`}
                        placeholder="+1 (555) 123-4567"
                      />
                      {formData.phone && !errors.phone && (
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
                    {errors.phone && (
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
                        {errors.phone}
                      </p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      <span className="mr-2">📧</span>
                      Email *
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 border-2 rounded-xl text-base transition-all duration-200 ${
                          errors.email
                            ? 'border-red-400 dark:border-red-500 bg-red-50 dark:bg-red-900/20'
                            : 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:border-green-500 focus:ring-4 focus:ring-green-100 dark:focus:ring-green-900/30'
                        } text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500`}
                        placeholder="contacto@comunidad.com"
                      />
                      {formData.email && !errors.email && (
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
                    {errors.email && (
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
                        {errors.email}
                      </p>
                    )}
                  </div>

                  {/* Sitio Web */}
                  <div className="lg:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      <span className="mr-2">🌐</span>
                      Sitio Web
                    </label>
                    <input
                      type="url"
                      name="website"
                      value={formData.website}
                      onChange={handleInputChange}
                      className="w-full px-4 py-4 border-2 border-gray-200 dark:border-gray-600 rounded-xl text-lg transition-all duration-200 bg-gray-50 dark:bg-gray-700 focus:border-green-500 focus:ring-4 focus:ring-green-100 dark:focus:ring-green-900/30 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                      placeholder="https://www.comunidad.com"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Información Técnica */}
            <div
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden animate-fade-in-up"
              style={{ animationDelay: '0.3s' }}
            >
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 px-8 py-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg mr-3">
                    <svg
                      className="w-6 h-6 text-purple-600 dark:text-purple-400"
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
                  Información Técnica
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  Datos técnicos y estadísticas de la comunidad
                </p>
              </div>

              <div className="p-6 space-y-6">
                {/* Selector de Tipo */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Tipo de Comunidad *
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => handleTypeChange('CONDOMINIO')}
                      className={`p-4 rounded-2xl border-2 transition-all duration-200 ${
                        formData.type === 'CONDOMINIO'
                          ? 'border-green-400 bg-green-50 dark:bg-green-900/20 shadow-md'
                          : 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 hover:border-green-300'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            formData.type === 'CONDOMINIO'
                              ? 'bg-green-500'
                              : 'bg-gray-300 dark:bg-gray-600'
                          }`}
                        >
                          <span className="text-xl">🏘️</span>
                        </div>
                        <div className="text-left">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Condominio
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Casas o unidades independientes
                          </p>
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleTypeChange('EDIFICIO')}
                      className={`p-4 rounded-2xl border-2 transition-all duration-200 ${
                        formData.type === 'EDIFICIO'
                          ? 'border-green-400 bg-green-50 dark:bg-green-900/20 shadow-md'
                          : 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 hover:border-green-300'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            formData.type === 'EDIFICIO'
                              ? 'bg-green-500'
                              : 'bg-gray-300 dark:bg-gray-600'
                          }`}
                        >
                          <span className="text-xl">🏢</span>
                        </div>
                        <div className="text-left">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Edificio
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Apartamentos en edificio
                          </p>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Campos según el tipo seleccionado */}
                {formData.type === 'CONDOMINIO' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Total de Unidades */}
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-4 border border-green-200 dark:border-green-800">
                      <div className="flex items-center mb-3">
                        <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-xl flex items-center justify-center mr-3">
                          <span className="text-xl">🏠</span>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Total de Unidades
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Número total de casas
                          </p>
                        </div>
                      </div>
                      <div className="relative">
                        <input
                          type="number"
                          name="totalUnits"
                          value={formData.totalUnits}
                          onChange={handleInputChange}
                          min="1"
                          className={`w-full px-3 py-3 border-2 rounded-xl text-base font-semibold text-center transition-all duration-200 ${
                            errors.totalUnits
                              ? 'border-red-400 dark:border-red-500 bg-red-50 dark:bg-red-900/20'
                              : 'border-green-200 dark:border-green-700 bg-white dark:bg-gray-800 focus:border-green-500 focus:ring-4 focus:ring-green-100 dark:focus:ring-green-900/30'
                          } text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500`}
                          placeholder="50"
                        />
                        {formData.totalUnits && !errors.totalUnits && (
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
                      {errors.totalUnits && (
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
                          {errors.totalUnits}
                        </p>
                      )}
                    </div>

                    {/* Año de Construcción */}
                    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-2xl p-6 border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center mb-4">
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-xl flex items-center justify-center mr-4">
                          <span className="text-2xl">📅</span>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Año de Construcción
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Año en que se construyó
                          </p>
                        </div>
                      </div>
                      <input
                        type="number"
                        name="constructionYear"
                        value={formData.constructionYear}
                        onChange={handleInputChange}
                        min="1900"
                        max={new Date().getFullYear()}
                        className="w-full px-4 py-4 border-2 border-blue-200 dark:border-blue-700 rounded-xl text-lg font-semibold text-center transition-all duration-200 bg-white dark:bg-gray-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                        placeholder="2020"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {/* Campos del Edificio */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      {/* Número de Pisos */}
                      <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-6 border border-purple-200 dark:border-purple-800">
                        <div className="flex items-center mb-4">
                          <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-xl flex items-center justify-center mr-4">
                            <span className="text-2xl">🏗️</span>
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                              Número de Pisos
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Total de pisos
                            </p>
                          </div>
                        </div>
                        <div className="relative">
                          <input
                            type="number"
                            value={formData.floors || ''}
                            onChange={(e) => handleBuildingDataChange('floors', e.target.value)}
                            min="1"
                            className={`w-full px-3 py-3 border-2 rounded-xl text-base font-semibold text-center transition-all duration-200 ${
                              errors.floors
                                ? 'border-red-400 dark:border-red-500 bg-red-50 dark:bg-red-900/20'
                                : 'border-purple-200 dark:border-purple-700 bg-white dark:bg-gray-800 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 dark:focus:ring-purple-900/30'
                            } text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500`}
                            placeholder="10"
                          />
                          {formData.floors && !errors.floors && (
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
                        {errors.floors && (
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
                            {errors.floors}
                          </p>
                        )}
                      </div>

                      {/* Unidades por Piso */}
                      <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-2xl p-6 border border-orange-200 dark:border-orange-800">
                        <div className="flex items-center mb-4">
                          <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-xl flex items-center justify-center mr-4">
                            <span className="text-2xl">🚪</span>
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                              Unidades por Piso
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Apartamentos por piso
                            </p>
                          </div>
                        </div>
                        <div className="relative">
                          <input
                            type="number"
                            value={formData.unitsPerFloor || ''}
                            onChange={(e) =>
                              handleBuildingDataChange('unitsPerFloor', e.target.value)
                            }
                            min="1"
                            className={`w-full px-3 py-3 border-2 rounded-xl text-base font-semibold text-center transition-all duration-200 ${
                              errors.unitsPerFloor
                                ? 'border-red-400 dark:border-red-500 bg-red-50 dark:bg-red-900/20'
                                : 'border-orange-200 dark:border-orange-700 bg-white dark:bg-gray-800 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 dark:focus:ring-orange-900/30'
                            } text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500`}
                            placeholder="4"
                          />
                          {formData.unitsPerFloor && !errors.unitsPerFloor && (
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
                        {errors.unitsPerFloor && (
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
                            {errors.unitsPerFloor}
                          </p>
                        )}
                      </div>

                      {/* Total de Unidades (Calculado) */}
                      <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-6 border border-green-200 dark:border-green-800">
                        <div className="flex items-center mb-4">
                          <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-xl flex items-center justify-center mr-4">
                            <span className="text-xl">🏢</span>
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                              Total de Unidades
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Calculado automáticamente
                            </p>
                          </div>
                        </div>
                        <div className="relative">
                          <input
                            type="text"
                            value={formData.totalUnits}
                            readOnly
                            className="w-full px-4 py-4 border-2 border-green-200 dark:border-green-700 rounded-xl text-lg font-semibold text-center bg-green-100 dark:bg-green-900/30 text-gray-900 dark:text-white"
                          />
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
                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Año de Construcción */}
                    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-2xl p-6 border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center mb-4">
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-xl flex items-center justify-center mr-4">
                          <span className="text-2xl">📅</span>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Año de Construcción
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Año en que se construyó
                          </p>
                        </div>
                      </div>
                      <input
                        type="number"
                        name="constructionYear"
                        value={formData.constructionYear}
                        onChange={handleInputChange}
                        min="1900"
                        max={new Date().getFullYear()}
                        className="w-full px-4 py-4 border-2 border-blue-200 dark:border-blue-700 rounded-xl text-lg font-semibold text-center transition-all duration-200 bg-white dark:bg-gray-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                        placeholder="2020"
                      />
                    </div>

                    {/* Estructura del Edificio */}
                    {formData.floors && formData.unitsPerFloor && (
                      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl p-6 border border-indigo-200 dark:border-indigo-800">
                        <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center">
                            <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900 rounded-xl flex items-center justify-center mr-4">
                              <span className="text-2xl">🏗️</span>
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                Estructura del Edificio
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                Gestiona la distribución de unidades
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setIsStructureModalOpen(true)}
                            className="px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-semibold transition-all duration-200 flex items-center"
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
                                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                              />
                            </svg>
                            Gestionar Estructura
                          </button>
                        </div>
                        <div className="text-center">
                          <p className="text-gray-600 dark:text-gray-400">
                            Haz clic en "Gestionar Estructura" para configurar las unidades por piso
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Espacios Comunes */}
            <div
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden animate-fade-in-up"
              style={{ animationDelay: '0.4s' }}
            >
              <div className="bg-gradient-to-r from-orange-50 to-pink-50 dark:from-orange-900/20 dark:to-pink-900/20 px-8 py-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                  <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg mr-3">
                    <svg
                      className="w-6 h-6 text-orange-600 dark:text-orange-400"
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
                  </div>
                  Espacios Comunes
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  Selecciona los espacios comunes disponibles en la comunidad y especifica la
                  cantidad
                </p>
              </div>

              <div className="p-6 space-y-5">
                {/* Grid de espacios comunes */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {(showAllCommonSpaces
                    ? availableCommonSpaces
                    : availableCommonSpaces.slice(0, 9)
                  ).map((space) => {
                    const selectedSpace = formData.commonSpaces.find((s) => s.name === space.name);
                    const isSelected = selectedSpace !== undefined;
                    const quantity = selectedSpace?.quantity || 0;

                    return (
                      <div
                        key={space.name}
                        className={`relative rounded-xl border-2 transition-all duration-200 ${
                          isSelected
                            ? 'border-green-400 bg-green-50 dark:bg-green-900/20 shadow-md'
                            : 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 hover:border-green-300 hover:bg-green-50 dark:hover:bg-green-900/20'
                        }`}
                      >
                        {/* Header del espacio común */}
                        <div
                          className="p-4 cursor-pointer"
                          onClick={() => handleCommonSpaceToggle(space.name)}
                        >
                          <div className="flex items-center space-x-3">
                            <div
                              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 ${
                                isSelected ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                              }`}
                            >
                              {isSelected ? (
                                <svg
                                  className="w-5 h-5 text-white"
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
                              ) : (
                                <span className="text-lg">{space.icon}</span>
                              )}
                            </div>
                            <div className="flex-1">
                              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                                {space.name}
                              </h3>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {isSelected ? 'Seleccionado' : 'No seleccionado'}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Selector de cantidad */}
                        {isSelected && (
                          <div className="px-4 pb-4 border-t border-gray-200 dark:border-gray-600 pt-4">
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Cantidad
                            </label>
                            <div className="flex items-center space-x-2">
                              <button
                                type="button"
                                onClick={() =>
                                  handleCommonSpaceQuantityChange(
                                    space.name,
                                    Math.max(1, quantity - 1),
                                  )
                                }
                                className="w-8 h-8 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-300 rounded-lg flex items-center justify-center transition-colors"
                                disabled={quantity <= 1}
                              >
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
                                    d="M20 12H4"
                                  />
                                </svg>
                              </button>

                              <input
                                type="number"
                                min="1"
                                max="99"
                                value={quantity}
                                onChange={(e) =>
                                  handleCommonSpaceQuantityChange(
                                    space.name,
                                    parseInt(e.target.value) || 1,
                                  )
                                }
                                className="w-16 px-2 py-1 text-center border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm font-medium focus:border-green-500 focus:ring-2 focus:ring-green-200 dark:focus:ring-green-900/30"
                              />

                              <button
                                type="button"
                                onClick={() =>
                                  handleCommonSpaceQuantityChange(space.name, quantity + 1)
                                }
                                className="w-8 h-8 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-300 rounded-lg flex items-center justify-center transition-colors"
                              >
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
                                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                                  />
                                </svg>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Botón Mostrar más/Mostrar menos */}
                {availableCommonSpaces.length > 9 && (
                  <div className="flex justify-center">
                    <button
                      type="button"
                      onClick={() => setShowAllCommonSpaces(!showAllCommonSpaces)}
                      className="inline-flex items-center px-6 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-xl transition-all duration-200 border border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
                    >
                      {showAllCommonSpaces ? 'Mostrar menos' : 'Mostrar más...'}
                    </button>
                  </div>
                )}

                {/* Resumen de espacios seleccionados */}
                {Object.keys(formData.commonSpaces).length > 0 && (
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800 p-6">
                    <h3 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-4 flex items-center">
                      <span className="mr-2">📋</span>
                      Resumen de Espacios Comunes
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {formData.commonSpaces.map((space) => {
                        const spaceConfig = availableCommonSpaces.find(
                          (s) => s.name === space.name,
                        );
                        return (
                          <div
                            key={space.name}
                            className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg p-3 border border-green-200 dark:border-green-700"
                          >
                            <div className="flex items-center space-x-2">
                              <span className="text-lg">{spaceConfig?.icon}</span>
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {space.name}
                              </span>
                            </div>
                            <span className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded-full text-xs font-bold">
                              {space.quantity}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="mt-4 pt-4 border-t border-green-200 dark:border-green-700">
                      <p className="text-sm text-green-700 dark:text-green-300">
                        <span className="font-semibold">
                          {formData.commonSpaces.reduce((sum, space) => sum + space.quantity, 0)}
                        </span>{' '}
                        espacios comunes seleccionados en total
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Botones de Acción */}
            <div
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-8 animate-fade-in-up"
              style={{ animationDelay: '0.5s' }}
            >
              <div className="flex flex-col sm:flex-row justify-end gap-4">
                <button
                  type="button"
                  onClick={() => setFormData(initialFormData)}
                  className="px-8 py-4 border-2 border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500 transition-all duration-200 flex items-center justify-center"
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
                  Limpiar Formulario
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-600 hover:to-emerald-700 focus:outline-none focus:ring-4 focus:ring-green-200 dark:focus:ring-green-900/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center"
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
                      Creando Comunidad...
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
                          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                        />
                      </svg>
                      Crear Comunidad
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
          {/* Modal de Estructura del Edificio */}
          {isStructureModalOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
                {/* Header del Modal */}
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-8 py-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-white flex items-center">
                        <span className="mr-3">🏗️</span>
                        Estructura del Edificio
                      </h2>
                      <p className="text-indigo-100 mt-2">
                        Gestiona las unidades por piso del edificio
                      </p>
                    </div>
                    <button
                      onClick={() => setIsStructureModalOpen(false)}
                      className="text-white hover:bg-white/20 p-2 rounded-xl transition-colors"
                    >
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
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

                {/* Contenido del Modal */}
                <div className="p-8 max-h-[calc(90vh-120px)] overflow-y-auto">
                  <div className="space-y-6">
                    {formData.buildingStructure &&
                    Object.keys(formData.buildingStructure).length > 0 ? (
                      Object.entries(formData.buildingStructure || {})
                        .sort(([a], [b]) => parseInt(b) - parseInt(a)) // Ordenar de arriba hacia abajo
                        .map(([floor, units]) => (
                          <div key={floor} className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6">
                            <div className="flex items-center justify-between mb-4">
                              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                                <span className="w-8 h-8 bg-indigo-500 text-white rounded-lg flex items-center justify-center mr-3 text-sm font-bold">
                                  {floor}
                                </span>
                                Piso {floor}
                              </h3>
                              <button
                                onClick={() => addUnitToFloor(parseInt(floor))}
                                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center"
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
                                Agregar Unidad
                              </button>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                              {units.map((unit, index) => (
                                <div
                                  key={index}
                                  className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 rounded-lg p-3 flex items-center justify-between group hover:border-red-400 transition-colors"
                                >
                                  <span className="font-medium text-gray-900 dark:text-white">
                                    {unit}
                                  </span>
                                  <button
                                    onClick={() => removeUnitFromFloor(parseInt(floor), index)}
                                    className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 transition-all"
                                  >
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
                                        d="M6 18L18 6M6 6l12 12"
                                      />
                                    </svg>
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))
                    ) : (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-4">
                          <svg
                            className="w-8 h-8 text-gray-400"
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
                        </div>
                        <p className="text-gray-500 dark:text-gray-400">
                          No hay estructura definida. Completa los campos de pisos y unidades por
                          piso.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer del Modal */}
                <div className="bg-gray-50 dark:bg-gray-700 px-8 py-4 flex justify-end">
                  <button
                    onClick={() => setIsStructureModalOpen(false)}
                    className="px-6 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-semibold transition-colors"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
