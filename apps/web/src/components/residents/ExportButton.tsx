'use client';

import { UserResponseDto } from '@/types/api';

interface ExportButtonProps {
  residents: UserResponseDto[];
  filteredResidents: UserResponseDto[];
  className?: string;
}

export default function ExportButton({
  residents,
  filteredResidents,
  className = '',
}: ExportButtonProps) {
  const exportToCSV = () => {
    const headers = [
      'ID',
      'Nombre',
      'Email',
      'Teléfono',
      'Estado',
      'Organización ID',
      'Fecha Creación',
      'Fecha Actualización',
    ];

    const csvContent = [
      headers.join(','),
      ...filteredResidents.map((user) =>
        [
          user.id,
          user.name,
          user.email,
          user.phone || '',
          user.status === 'ACTIVE'
            ? 'Activo'
            : user.status === 'INACTIVE'
              ? 'Inactivo'
              : 'Suspendido',
          user.organizationId || '',
          new Date(user.createdAt).toLocaleDateString('es-ES'),
          new Date(user.updatedAt).toLocaleDateString('es-ES'),
        ].join(','),
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `usuarios_${new Date().toISOString().split('T')[0]}.csv`);
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
    link.setAttribute('download', `usuarios_${new Date().toISOString().split('T')[0]}.json`);
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
          className="inline-flex items-center px-5 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm font-semibold rounded-xl shadow-sm hover:shadow-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
          id="export-menu"
          aria-expanded="false"
          aria-haspopup="true"
        >
          <svg
            className="w-5 h-5 mr-2 text-gray-500 dark:text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          Exportar
          <svg
            className="w-4 h-4 ml-2 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors duration-200"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        <div className="absolute right-0 z-10 mt-3 w-56 origin-top-right bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform scale-95 group-hover:scale-100">
          <div className="py-2">
            <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Formato de exportación
              </p>
            </div>
            <button
              onClick={exportToCSV}
              className="flex items-center w-full px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors duration-200 group"
            >
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg mr-3 group-hover:bg-green-200 dark:group-hover:bg-green-800 transition-colors duration-200">
                <svg
                  className="w-4 h-4 text-green-600 dark:text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <div>
                <div className="font-medium">Exportar CSV</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Archivo Excel compatible
                </div>
              </div>
            </button>
            <button
              onClick={exportToJSON}
              className="flex items-center w-full px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors duration-200 group"
            >
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg mr-3 group-hover:bg-blue-200 dark:group-hover:bg-blue-800 transition-colors duration-200">
                <svg
                  className="w-4 h-4 text-blue-600 dark:text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                  />
                </svg>
              </div>
              <div>
                <div className="font-medium">Exportar JSON</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Datos estructurados</div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
