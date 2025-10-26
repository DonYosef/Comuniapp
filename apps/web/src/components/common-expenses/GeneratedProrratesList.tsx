'use client';

import { useState, useEffect } from 'react';
import { CommonExpenseService } from '@/services/commonExpenseService';
import { LoadingSpinner, ConfirmationModal } from './CommonExpenseComponents';
import { useToast } from '@/contexts/ToastContext';

interface UnitExpense {
  id: string;
  unitId: string;
  unitNumber: string;
  amount: number;
  concept: string;
  description?: string;
  dueDate: string;
  status: 'PENDING' | 'PAID' | 'OVERDUE';
}

interface CommonExpense {
  id: string;
  communityId: string;
  period: string;
  totalAmount: number;
  dueDate: string;
  prorrateMethod: 'EQUAL' | 'COEFFICIENT';
  createdAt: string;
  items: Array<{
    id: string;
    name: string;
    amount: number;
    description?: string;
  }>;
  unitExpenses?: UnitExpense[];
}

interface GeneratedProrratesListProps {
  communityId: string;
  period?: string;
}

export default function GeneratedProrratesList({
  communityId,
  period,
}: GeneratedProrratesListProps) {
  const { showToast } = useToast();
  const [prorrates, setProrrates] = useState<CommonExpense[]>([]);
  const [unitExpenses, setUnitExpenses] = useState<Map<string, UnitExpense[]>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState<Map<string, boolean>>(new Map());
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [prorrateToDelete, setProrrateToDelete] = useState<CommonExpense | null>(null);

  useEffect(() => {
    fetchProrrates();
  }, [communityId, period]);

  const fetchProrrates = async () => {
    try {
      setIsLoading(true);
      const data = await CommonExpenseService.getCommonExpensesByCommunity(communityId, period);
      setProrrates(data);

      // Build unit expenses map from data
      const unitExpensesMap = new Map<string, UnitExpense[]>();
      data.forEach((prorrate) => {
        if (prorrate.unitExpenses) {
          unitExpensesMap.set(prorrate.id, prorrate.unitExpenses);
        }
      });
      setUnitExpenses(unitExpensesMap);
    } catch (error) {
      console.error('Error fetching prorrates:', error);
      showToast('Error al cargar los prorrateos generados', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClick = (prorrate: CommonExpense) => {
    setProrrateToDelete(prorrate);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!prorrateToDelete) return;

    try {
      setIsDeleting(prorrateToDelete.id);
      await CommonExpenseService.deleteCommonExpense(prorrateToDelete.id);
      showToast('Prorrateo eliminado exitosamente', 'success');
      await fetchProrrates();
    } catch (error) {
      console.error('Error deleting prorrate:', error);
      showToast('Error al eliminar el prorrateo', 'error');
    } finally {
      setIsDeleting(null);
      setShowDeleteModal(false);
      setProrrateToDelete(null);
    }
  };

  const toggleExpand = (prorrateId: string) => {
    const newExpanded = new Map(isExpanded);
    newExpanded.set(prorrateId, !isExpanded.get(prorrateId));
    setIsExpanded(newExpanded);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      PENDING: { text: 'Pendiente', className: 'bg-yellow-100 text-yellow-800' },
      PAID: { text: 'Pagado', className: 'bg-green-100 text-green-800' },
      OVERDUE: { text: 'Vencido', className: 'bg-red-100 text-red-800' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING;

    return (
      <span
        className={`px-2 py-1 text-xs font-semibold rounded-full ${config.className} dark:opacity-90`}
      >
        {config.text}
      </span>
    );
  };

  const getStatsForProrrate = (units: UnitExpense[]) => {
    const stats = units.reduce(
      (acc, unit) => {
        acc.total++;
        acc.totalAmount += unit.amount;

        if (unit.status === 'PAID') {
          acc.paid++;
          acc.paidAmount += unit.amount;
        } else if (unit.status === 'OVERDUE') {
          acc.overdue++;
          acc.overdueAmount += unit.amount;
        } else {
          acc.pending++;
          acc.pendingAmount += unit.amount;
        }

        return acc;
      },
      {
        total: 0,
        paid: 0,
        pending: 0,
        overdue: 0,
        totalAmount: 0,
        paidAmount: 0,
        pendingAmount: 0,
        overdueAmount: 0,
      },
    );

    return stats;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <LoadingSpinner size="lg" text="Cargando prorrateos..." color="blue" />
      </div>
    );
  }

  if (prorrates.length === 0) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
          <svg
            className="w-6 h-6 mr-2 text-blue-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
            />
          </svg>
          Prorrateos Generados
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          {prorrates.length} prorrateo{prorrates.length !== 1 ? 's' : ''} generado
          {prorrates.length !== 1 ? 's' : ''} para este período
        </p>
      </div>

      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {prorrates.map((prorrate) => {
          const units = unitExpenses.get(prorrate.id) || [];
          const stats = getStatsForProrrate(units);
          const expanded = isExpanded.get(prorrate.id) || false;

          return (
            <div key={prorrate.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {prorrate.period}
                    </h4>
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      {prorrate.prorrateMethod === 'EQUAL'
                        ? 'Por partes iguales'
                        : 'Por coeficiente'}
                    </span>
                  </div>

                  <div className="mt-2 grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                        ${prorrate.totalAmount.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Unidades</p>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                        {stats.total} {stats.total === 1 ? 'unidad' : 'unidades'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Pagadas</p>
                      <p className="text-lg font-bold text-green-600">
                        {stats.paid} ({((stats.paid / stats.total) * 100).toFixed(0)}%)
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Pendientes</p>
                      <p className="text-lg font-bold text-yellow-600">
                        {stats.pending} ({((stats.pending / stats.total) * 100).toFixed(0)}%)
                      </p>
                    </div>
                  </div>

                  <div className="mt-3">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Vencimiento: {new Date(prorrate.dueDate).toLocaleDateString('es-ES')}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Creado: {new Date(prorrate.createdAt).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-2 ml-4">
                  <button
                    onClick={() => handleDeleteClick(prorrate)}
                    disabled={isDeleting === prorrate.id}
                    className="px-4 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-300 rounded-lg hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-red-900/20 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/30"
                  >
                    {isDeleting === prorrate.id ? (
                      <div className="flex items-center">
                        <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        Eliminando...
                      </div>
                    ) : (
                      'Eliminar'
                    )}
                  </button>
                </div>
              </div>

              <div className="mt-4">
                <button
                  onClick={() => toggleExpand(prorrate.id)}
                  className="flex items-center space-x-2 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  <span>{expanded ? 'Ocultar' : 'Mostrar'} detalles por unidad</span>
                  <svg
                    className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {expanded && (
                  <div className="mt-4 bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead>
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Unidad
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Monto
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Estado
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Vencimiento
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                          {units.map((unit) => (
                            <tr key={unit.id} className="hover:bg-gray-100 dark:hover:bg-gray-800">
                              <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                                Unidad {unit.unitNumber}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                                ${unit.amount.toFixed(2)}
                              </td>
                              <td className="px-4 py-3 text-sm">{getStatusBadge(unit.status)}</td>
                              <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                                {new Date(unit.dueDate).toLocaleDateString('es-ES')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="bg-gray-100 dark:bg-gray-800 font-semibold">
                            <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                              TOTAL
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                              ${stats.totalAmount.toFixed(2)}
                            </td>
                            <td className="px-4 py-3 text-sm" colSpan={2}>
                              {stats.paid} pagado, {stats.pending} pendiente, {stats.overdue}{' '}
                              vencido
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal de confirmación de eliminación */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          if (!isDeleting) {
            setShowDeleteModal(false);
            setProrrateToDelete(null);
          }
        }}
        onConfirm={handleConfirmDelete}
        title="Eliminar Prorrateo"
        message={`¿Estás seguro de que deseas eliminar el prorrateo del período ${prorrateToDelete?.period}? Esta acción eliminará todos los gastos asociados y no se puede deshacer.`}
        confirmText={isDeleting ? 'Eliminando...' : 'Eliminar'}
        cancelText="Cancelar"
        type="danger"
        closeOnConfirm={false}
      />
    </div>
  );
}
