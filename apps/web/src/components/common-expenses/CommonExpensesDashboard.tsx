'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { CommunityService } from '@/services/communityService';
import { CommonExpenseService } from '@/services/commonExpenseService';
import { StatCard, LoadingSpinner } from '@/components/common-expenses/CommonExpenseComponents';

// Iconos SVG como componentes
const CurrencyDollarIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
    />
  </svg>
);

const CalendarIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
    />
  </svg>
);

const BuildingIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
    />
  </svg>
);

const TrendingUpIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
    />
  </svg>
);

const ArrowRightIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

interface Community {
  id: string;
  name: string;
  _count?: {
    units: number;
  };
}

interface ExpenseSummary {
  id: string;
  communityId: string;
  communityName: string;
  period: string;
  totalAmount: number;
  dueDate: string;
  totalUnits: number;
  paidUnits: number;
  pendingUnits: number;
  overdueUnits: number;
  createdAt: string;
}

interface CommonExpensesDashboardProps {
  communityId?: string;
}

export default function CommonExpensesDashboard({ communityId }: CommonExpensesDashboardProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [expenses, setExpenses] = useState<ExpenseSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user, communityId]);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (communityId) {
        // Si se proporciona un communityId específico, cargar solo esa comunidad
        try {
          const communityData = await CommunityService.getCommunityById(communityId);
          setCommunities([communityData]);
        } catch (error) {
          console.error('Error al cargar comunidad:', error);
          setError('Error al cargar la información de la comunidad');
          return;
        }

        // Cargar gastos de esa comunidad específica
        try {
          const communityExpenses =
            await CommonExpenseService.getCommonExpensesByCommunity(communityId);
          setExpenses(communityExpenses);
        } catch (error) {
          console.warn(
            'No se pudieron cargar los gastos comunes (puede que no existan aún):',
            error,
          );
          setExpenses([]); // Establecer array vacío en lugar de fallar
        }
      } else {
        // Cargar todas las comunidades del usuario
        const communitiesData = await CommunityService.getCommunities();
        setCommunities(communitiesData);

        // Cargar gastos comunes de todas las comunidades
        const allExpenses: ExpenseSummary[] = [];
        for (const community of communitiesData) {
          try {
            const communityExpenses = await CommonExpenseService.getCommonExpensesByCommunity(
              community.id,
            );
            allExpenses.push(...communityExpenses);
          } catch (error) {
            console.warn(`Error al cargar gastos para la comunidad ${community.name}:`, error);
          }
        }
        setExpenses(allExpenses);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar los datos';
      setError(errorMessage);
      console.error('Error fetching dashboard data:', err);

      // Si es un error de autenticación, no cerrar sesión automáticamente aquí
      if (err instanceof Error && err.message.includes('401')) {
        setError('Error de autenticación. Por favor, verifica tu sesión.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Calcular estadísticas globales
  const globalStats = expenses.reduce(
    (acc, expense) => {
      const expenseStats = CommonExpenseService.calculateStats(expense);
      acc.totalAmount += expenseStats.totalAmount;
      acc.paidAmount += expenseStats.paidAmount;
      acc.pendingAmount += expenseStats.pendingAmount;
      acc.overdueAmount += expenseStats.overdueAmount;
      acc.totalUnits += expenseStats.totalUnits;
      acc.paidUnits += expenseStats.paidUnits;
      acc.pendingUnits += expenseStats.pendingUnits;
      acc.overdueUnits += expenseStats.overdueUnits;
      return acc;
    },
    {
      totalAmount: 0,
      paidAmount: 0,
      pendingAmount: 0,
      overdueAmount: 0,
      totalUnits: 0,
      paidUnits: 0,
      pendingUnits: 0,
      overdueUnits: 0,
    },
  );

  const paymentPercentage =
    globalStats.totalUnits > 0 ? (globalStats.paidUnits / globalStats.totalUnits) * 100 : 0;

  // Obtener gastos recientes (últimos 3 meses)
  const recentExpenses = expenses
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  // Obtener gastos vencidos
  const overdueExpenses = expenses.filter((expense) => {
    const dueDate = new Date(expense.dueDate);
    const now = new Date();
    return dueDate < now && expense.pendingUnits > 0;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" text="Cargando resumen de gastos..." color="blue" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <div className="mt-2 text-sm text-red-700">
              {error instanceof Error ? error.message : String(error)}
            </div>
            <div className="mt-4">
              <button
                onClick={fetchDashboardData}
                className="text-sm bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded"
              >
                Reintentar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Resumen de Gastos Comunes
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Vista general de todos tus gastos comunes
          </p>
        </div>
        <button
          onClick={fetchDashboardData}
          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
        >
          <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Actualizar
        </button>
      </div>

      {/* Métricas Globales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Comunidades"
          value={communities.length}
          icon={<BuildingIcon />}
          color="blue"
          subtitle="Con gastos activos"
        />
        <StatCard
          title="Total Períodos"
          value={expenses.length}
          icon={<CalendarIcon />}
          color="indigo"
          subtitle="Ciclos creados"
        />
        <StatCard
          title="Total Recaudado"
          value={`$${globalStats.paidAmount.toFixed(2)}`}
          icon={<CurrencyDollarIcon />}
          color="green"
          subtitle={`${paymentPercentage.toFixed(1)}% pagado`}
          trend={{
            value: paymentPercentage,
            isPositive: paymentPercentage > 50,
          }}
        />
        <StatCard
          title="Pendiente"
          value={`$${globalStats.pendingAmount.toFixed(2)}`}
          icon={<TrendingUpIcon />}
          color="yellow"
          subtitle={`${globalStats.pendingUnits} unidades`}
        />
      </div>

      {/* Resumen Financiero */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl p-6 border border-indigo-100 dark:border-indigo-800">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <div className="p-2 bg-indigo-100 dark:bg-indigo-900 rounded-lg mr-3">
            <CurrencyDollarIcon />
          </div>
          Resumen Financiero Global
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Generado</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              ${globalStats.totalAmount.toFixed(2)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">Recaudado</p>
            <p className="text-2xl font-bold text-green-600">
              ${globalStats.paidAmount.toFixed(2)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">Pendiente</p>
            <p className="text-2xl font-bold text-yellow-600">
              ${globalStats.pendingAmount.toFixed(2)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">Vencido</p>
            <p className="text-2xl font-bold text-red-600">
              ${globalStats.overdueAmount.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* Gastos Recientes */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-900/20">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg mr-3">
                <CalendarIcon />
              </div>
              Gastos Recientes
            </h3>
            <button
              onClick={() => router.push('/dashboard/comunidad')}
              className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 flex items-center"
            >
              Ver todos
              <ArrowRightIcon />
            </button>
          </div>
        </div>

        {recentExpenses.length === 0 ? (
          <div className="text-center py-12">
            <CalendarIcon />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              No hay gastos recientes
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Los gastos comunes aparecerán aquí una vez que se creen.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {recentExpenses.map((expense) => {
              const expenseStats = CommonExpenseService.calculateStats(expense);
              return (
                <div
                  key={expense.id}
                  className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                        <span className="text-sm font-bold text-white">
                          {expense.period.split('-')[1]}
                        </span>
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                          {expense.communityName} - {expense.period}
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Vence: {new Date(expense.dueDate).toLocaleDateString('es-ES')} |
                          {expense.totalUnits} unidades |{expenseStats.paymentPercentage.toFixed(1)}
                          % pagado
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          ${expense.totalAmount.toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          ${expenseStats.paidAmount.toFixed(2)} recaudado
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          router.push(`/dashboard/comunidad/${expense.communityId}/gastos`)
                        }
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
                      >
                        Ver detalles
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Alertas de Gastos Vencidos */}
      {overdueExpenses.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                <svg
                  className="w-6 h-6 text-red-600 dark:text-red-400"
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
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-red-900 dark:text-red-300 mb-2">
                Gastos Vencidos Requieren Atención
              </h3>
              <p className="text-red-800 dark:text-red-400 mb-4">
                Tienes {overdueExpenses.length} gasto{overdueExpenses.length !== 1 ? 's' : ''} común
                {overdueExpenses.length !== 1 ? 'es' : ''} vencido
                {overdueExpenses.length !== 1 ? 's' : ''} que requieren seguimiento inmediato.
              </p>
              <div className="space-y-2">
                {overdueExpenses.slice(0, 3).map((expense) => (
                  <div
                    key={expense.id}
                    className="flex justify-between items-center bg-white dark:bg-gray-800 rounded-lg p-3 border border-red-200 dark:border-red-700"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {expense.communityName} - {expense.period}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Vencido: {new Date(expense.dueDate).toLocaleDateString('es-ES')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-red-600">
                        ${expense.totalAmount.toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {expense.pendingUnits} unidades pendientes
                      </p>
                    </div>
                  </div>
                ))}
                {overdueExpenses.length > 3 && (
                  <p className="text-sm text-red-700 dark:text-red-300">
                    Y {overdueExpenses.length - 3} más...
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
