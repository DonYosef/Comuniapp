'use client';

import { Resident } from '@/types/resident';

interface ExportButtonProps {
  residents: Resident[];
  filteredResidents: Resident[];
  className?: string;
}

export default function ExportButton({
  residents,
  filteredResidents,
  className = '',
}: ExportButtonProps) {
  const exportToCSV = () => {
    const headers = [
      'Nombre',
      'Apellidos',
      'Email',
      'Teléfono',
      'Apartamento',
      'Edificio',
      'Estado',
      'Rol',
      'Fecha Ingreso',
      'Fecha Salida',
      'Contacto Emergencia',
      'Teléfono Emergencia',
      'Relación Emergencia',
      'Vehículos',
      'Mascotas',
      'Notas',
    ];

    const csvContent = [
      headers.join(','),
      ...filteredResidents.map((resident) =>
        [
          resident.firstName,
          resident.lastName,
          resident.email,
          resident.phone,
          resident.apartment,
          resident.building || '',
          resident.status === 'active'
            ? 'Activo'
            : resident.status === 'inactive'
              ? 'Inactivo'
              : 'Pendiente',
          resident.role === 'owner'
            ? 'Propietario'
            : resident.role === 'tenant'
              ? 'Inquilino'
              : 'Invitado',
          new Date(resident.moveInDate).toLocaleDateString('es-ES'),
          resident.moveOutDate ? new Date(resident.moveOutDate).toLocaleDateString('es-ES') : '',
          resident.emergencyContact.name,
          resident.emergencyContact.phone,
          resident.emergencyContact.relationship,
          resident.vehicles?.map((v) => `${v.make} ${v.model} (${v.licensePlate})`).join('; ') ||
            '',
          resident.pets?.map((p) => `${p.name} (${p.type})`).join('; ') || '',
          `"${resident.notes || ''}"`,
        ].join(','),
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `residentes_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToJSON = () => {
    const jsonContent = JSON.stringify(filteredResidents, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `residentes_${new Date().toISOString().split('T')[0]}.json`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={`relative inline-block text-left ${className}`}>
      <div className="group">
        <button
          type="button"
          className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors duration-200"
          id="export-menu"
          aria-expanded="false"
          aria-haspopup="true"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          Exportar
          <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        <div className="absolute right-0 z-10 mt-2 w-48 origin-top-right bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
          <div className="py-1">
            <button
              onClick={exportToCSV}
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
            >
              <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Exportar CSV
            </button>
            <button
              onClick={exportToJSON}
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
            >
              <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                />
              </svg>
              Exportar JSON
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
