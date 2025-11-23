'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { CommunityService } from '@/services/communityService';
import { CommonExpenseService } from '@/services/commonExpenseService';
import { CommunityIncomeService } from '@/services/communityIncomeService';
import {
  StatCard,
  LoadingSpinner,
  StatusBadge,
} from '@/components/common-expenses/CommonExpenseComponents';
import MonthlyExpensesTable from '@/components/common-expenses/MonthlyExpensesTableConnected';
import ProrrateModal from '@/components/common-expenses/ProrrateModal';
import { eventBus, EVENTS } from '@/utils/eventBus';
import { ExpenseStatus } from '@comuniapp/types';

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

interface IncomeSummary {
  id: string;
  communityId: string;
  communityName?: string;
  period: string;
  totalAmount: number;
  dueDate: string;
  createdAt: string;
}

interface CommonExpensesDashboardProps {
  communityId?: string;
  key?: number; // Para forzar re-render
  onConfigExpenses?: () => void; // Callback para configurar egresos
  onConfigIncome?: () => void; // Callback para configurar ingresos
}

export default function CommonExpensesDashboard({
  communityId,
  onConfigExpenses,
  onConfigIncome,
}: CommonExpensesDashboardProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [expenses, setExpenses] = useState<ExpenseSummary[]>([]);
  const [incomes, setIncomes] = useState<IncomeSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isProrrateModalOpen, setIsProrrateModalOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('');

  // Generar opciones de período (últimos 12 meses)
  const generatePeriodOptions = () => {
    const options = [];
    const now = new Date();

    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const value = `${year}-${month}`;
      const monthNames = [
        'Enero',
        'Febrero',
        'Marzo',
        'Abril',
        'Mayo',
        'Junio',
        'Julio',
        'Agosto',
        'Septiembre',
        'Octubre',
        'Noviembre',
        'Diciembre',
      ];
      const label = `${monthNames[date.getMonth()]} ${year}`;

      options.push({ value, label });
    }

    return options;
  };

  // Inicializar período actual
  useEffect(() => {
    const now = new Date();
    const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    setSelectedPeriod(currentPeriod);
  }, []);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user, communityId, selectedPeriod]);

  // Escuchar eventos de actualización de datos
  useEffect(() => {
    const handleDataRefresh = (data: { communityId: string }) => {
      if (data.communityId === communityId) {
        console.log('📢 Evento recibido: actualizando dashboard de gastos');
        fetchDashboardData();
      }
    };

    // Suscribirse a eventos
    eventBus.on(EVENTS.DATA_REFRESH_NEEDED, handleDataRefresh);
    eventBus.on(EVENTS.EXPENSE_CREATED, handleDataRefresh);
    eventBus.on(EVENTS.EXPENSE_DELETED, handleDataRefresh);

    // Limpiar suscripción al desmontar
    return () => {
      eventBus.off(EVENTS.DATA_REFRESH_NEEDED, handleDataRefresh);
      eventBus.off(EVENTS.EXPENSE_CREATED, handleDataRefresh);
      eventBus.off(EVENTS.EXPENSE_DELETED, handleDataRefresh);
    };
  }, [communityId]);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (communityId) {
        // Si se proporciona un communityId: admins usan ese id; residentes usan su propia comunidad
        let effectiveCommunityId = communityId;
        try {
          const isAdmin =
            user &&
            (user.roles || []).some(
              (r: any) => r.name === 'SUPER_ADMIN' || r.name === 'COMMUNITY_ADMIN',
            );
          const communityData = isAdmin
            ? await CommunityService.getCommunityById(communityId)
            : await CommunityService.getMyCommunity();
          setCommunities([communityData]);
          if (!isAdmin) {
            effectiveCommunityId = communityData.id;
          }
        } catch (error) {
          console.error('Error al cargar comunidad:', error);
          setError('Error al cargar la información de la comunidad');
          return;
        }

        // Cargar gastos e ingresos de la comunidad efectiva para el período seleccionado
        try {
          const [communityExpenses, communityIncomes] = await Promise.all([
            CommonExpenseService.getCommonExpensesByCommunity(effectiveCommunityId, selectedPeriod),
            CommunityIncomeService.getCommunityIncomes(effectiveCommunityId, selectedPeriod),
          ]);

          // Convertir datos a los tipos esperados
          const convertedExpenses = communityExpenses.map((expense) => ({
            ...expense,
            dueDate:
              typeof expense.dueDate === 'string' ? expense.dueDate : expense.dueDate.toISOString(),
            createdAt:
              typeof expense.createdAt === 'string'
                ? expense.createdAt
                : expense.createdAt.toISOString(),
          }));

          const convertedIncomes = communityIncomes.map((income) => ({
            ...income,
            dueDate:
              typeof income.dueDate === 'string'
                ? income.dueDate
                : (income.dueDate as Date).toISOString(),
            createdAt:
              typeof income.createdAt === 'string'
                ? income.createdAt
                : (income.createdAt as Date).toISOString(),
            communityName: income.communityName || 'Sin nombre',
          }));

          setExpenses(convertedExpenses);
          setIncomes(convertedIncomes);
        } catch (error) {
          console.warn(
            'No se pudieron cargar los gastos comunes (puede que no existan aún):',
            error,
          );
          setExpenses([]); // Establecer array vacío en lugar de fallar
          setIncomes([]);
        }
      } else {
        // Cargar comunidades según rol: admins ven todas, residentes solo su comunidad
        const endpoint =
          user &&
          (user.roles || []).some(
            (r: any) => r.name === 'SUPER_ADMIN' || r.name === 'COMMUNITY_ADMIN',
          )
            ? '/communities'
            : '/communities/my-community';
        const communitiesData = await CommunityService.getCommunities(endpoint);
        const communitiesArray = Array.isArray(communitiesData)
          ? communitiesData
          : [communitiesData];
        setCommunities(communitiesArray);

        // Cargar gastos e ingresos comunes de todas las comunidades
        const allExpenses: ExpenseSummary[] = [];
        const allIncomes: IncomeSummary[] = [];

        for (const community of communitiesArray) {
          try {
            const [communityExpenses, communityIncomes] = await Promise.all([
              CommonExpenseService.getCommonExpensesByCommunity(community.id),
              CommunityIncomeService.getCommunityIncomes(community.id),
            ]);

            // Convertir datos a los tipos esperados
            const convertedExpenses = communityExpenses.map((expense) => ({
              ...expense,
              dueDate:
                typeof expense.dueDate === 'string'
                  ? expense.dueDate
                  : expense.dueDate.toISOString(),
              createdAt:
                typeof expense.createdAt === 'string'
                  ? expense.createdAt
                  : expense.createdAt.toISOString(),
            }));

            const convertedIncomes = communityIncomes.map((income) => ({
              ...income,
              dueDate:
                typeof income.dueDate === 'string'
                  ? income.dueDate
                  : (income.dueDate as Date).toISOString(),
              createdAt:
                typeof income.createdAt === 'string'
                  ? income.createdAt
                  : (income.createdAt as Date).toISOString(),
              communityName: income.communityName || 'Sin nombre',
            }));

            allExpenses.push(...convertedExpenses);
            allIncomes.push(...convertedIncomes);
          } catch (error) {
            console.warn(`Error al cargar datos para la comunidad ${community.name}:`, error);
          }
        }
        setExpenses(allExpenses);
        setIncomes(allIncomes);
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
      const expenseStats = CommonExpenseService.calculateStats(expense as any);
      acc.totalAmount += expenseStats.totalAmount;
      acc.paidAmount += expenseStats.paidAmount;
      acc.pendingAmount += expenseStats.pendingAmount;
      acc.overdueAmount += expenseStats.overdueAmount;
      acc.totalUnits += expenseStats.totalUnits;
      acc.paidUnits += (expenseStats as any).paidUnits || 0;
      acc.pendingUnits += (expenseStats as any).pendingUnits || 0;
      acc.overdueUnits += (expenseStats as any).overdueUnits || 0;
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

  // Calcular estadísticas de ingresos
  const incomeStats = incomes.reduce(
    (acc, income) => {
      const amount = Number(income.totalAmount) || 0;
      acc.totalIncome += amount;
      return acc;
    },
    {
      totalIncome: 0,
    },
  );

  // Calcular balance (ingresos - gastos)
  const balance = (Number(incomeStats.totalIncome) || 0) - globalStats.totalAmount;

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
            <div className="mt-2 text-sm text-red-700">{String(error)}</div>
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
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center space-y-4 lg:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Resumen de Gastos Comunes
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Vista general de todos tus gastos comunes
          </p>
        </div>

        {/* Selector de período */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <label
              htmlFor="period-select"
              className="text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Período:
            </label>
            <select
              id="period-select"
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {generatePeriodOptions().map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex space-x-2">
            <button
              onClick={() => setIsProrrateModalOpen(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-sm font-medium rounded-md text-white hover:bg-blue-700 transition-colors"
            >
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                />
              </svg>
              Prorratear y generar cobros
            </button>
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
        </div>
      </div>

      {/* Métricas Globales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
        <StatCard
          title="Balance"
          value={`$${balance.toFixed(2)}`}
          icon={<CurrencyDollarIcon />}
          color={balance >= 0 ? 'green' : 'red'}
          subtitle={balance >= 0 ? 'Positivo' : 'Negativo'}
          trend={{
            value: Math.abs(balance),
            isPositive: balance >= 0,
          }}
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
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Gastos</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              ${globalStats.totalAmount.toFixed(2)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Ingresos</p>
            <p className="text-2xl font-bold text-blue-600">
              ${(Number(incomeStats.totalIncome) || 0).toFixed(2)}
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
            <p className="text-sm text-gray-600 dark:text-gray-400">Balance</p>
            <p className={`text-2xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${balance.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* Tabla de Gastos Mensuales */}
      {communityId && (
        <>
          <MonthlyExpensesTable
            communityId={communityId}
            period={selectedPeriod}
            onDataChange={() => {
              // Refrescar datos del dashboard cuando cambien los gastos
              fetchDashboardData();
            }}
            onConfigExpenses={onConfigExpenses}
            onConfigIncome={onConfigIncome}
          />

          {/* Estado de Pagos del Período Actual - Solo mostrar cuando hay un gasto común generado */}
          <ExpensePaymentsList communityId={communityId} period={selectedPeriod} />
        </>
      )}

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

      {/* Modal de Prorrateo */}
      {communityId && (
        <ProrrateModal
          isOpen={isProrrateModalOpen}
          onClose={() => setIsProrrateModalOpen(false)}
          communityId={communityId}
          period={selectedPeriod}
          expenses={expenses}
          incomes={incomes}
          expenseType="expenses" // Por defecto usar gastos, se puede cambiar según la tabla activa
          onSuccess={() => {
            fetchDashboardData();
            eventBus.emit(EVENTS.DATA_REFRESH_NEEDED, { communityId });
          }}
        />
      )}
    </div>
  );
}

// Componente para mostrar el estado de pagos de las unidades
function ExpensePaymentsList({ communityId, period }: { communityId: string; period: string }) {
  const [expense, setExpense] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchExpense = async () => {
      try {
        setIsLoading(true);
        const expenses = await CommonExpenseService.getCommonExpensesByCommunity(
          communityId,
          period,
        );
        if (expenses && expenses.length > 0) {
          // Obtener detalles completos del gasto común
          const fullExpense = await CommonExpenseService.getCommonExpenseById(expenses[0].id);
          setExpense(fullExpense);
        } else {
          setExpense(null);
        }
      } catch (error) {
        console.error('Error al cargar el estado de pagos:', error);
        setExpense(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchExpense();
  }, [communityId, period]);

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner size="md" text="Cargando estado de pagos..." color="blue" />
        </div>
      </div>
    );
  }

  // Solo mostrar si existe el gasto común Y tiene gastos de unidades prorrateados
  if (!expense || !expense.unitExpenses || expense.unitExpenses.length === 0) {
    return null;
  }

  const paidUnits = expense.unitExpenses.filter((u: any) => u.status === ExpenseStatus.PAID);
  const pendingUnits = expense.unitExpenses.filter((u: any) => u.status === ExpenseStatus.PENDING);
  const overdueUnits = expense.unitExpenses.filter((u: any) => u.status === ExpenseStatus.OVERDUE);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-purple-50 dark:from-gray-900 dark:to-purple-900/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <BuildingIcon />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Estado de Pagos - Período {period}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Resumen de unidades que han pagado y pendientes de pago
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-b border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">Pagadas</p>
            <p className="text-2xl font-bold text-green-600">{paidUnits.length}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              de {expense.unitExpenses.length} unidades
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">Pendientes</p>
            <p className="text-2xl font-bold text-yellow-600">{pendingUnits.length}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Por pagar</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">Vencidas</p>
            <p className="text-2xl font-bold text-red-600">{overdueUnits.length}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Requieren atención</p>
          </div>
        </div>
      </div>

      {/* Lista de Unidades */}
      {expense.unitExpenses.length > 0 && (
        <div className="p-6">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <BuildingIcon />
            <span className="ml-2">Unidades ({expense.unitExpenses.length})</span>
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
            {expense.unitExpenses.map((unitExpense: any) => (
              <div
                key={unitExpense.id}
                className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                  unitExpense.status === ExpenseStatus.PAID
                    ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20'
                    : unitExpense.status === ExpenseStatus.OVERDUE
                      ? 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20'
                      : 'border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg">
                      <span className="text-sm font-bold text-white">{unitExpense.unitNumber}</span>
                    </div>
                    <div>
                      <h5 className="text-sm font-semibold text-gray-900 dark:text-white">
                        Unidad {unitExpense.unitNumber}
                      </h5>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        ${unitExpense.amount.toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={unitExpense.status} size="sm" />
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                  Vence: {new Date(unitExpense.dueDate).toLocaleDateString('es-ES')}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
