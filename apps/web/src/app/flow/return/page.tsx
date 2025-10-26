'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { LoadingSpinner } from '@/components/common-expenses/CommonExpenseComponents';
import { PaymentService, PaymentStatusResponse } from '@/services/paymentService';

const CheckCircleIcon = () => (
  <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const ClockIcon = () => (
  <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const XCircleIcon = () => (
  <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const ExclamationCircleIcon = () => (
  <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

export default function FlowReturnPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatusResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setError('No se recibió el token de pago');
      setIsLoading(false);
      return;
    }

    // Consultar el estado del pago
    fetchPaymentStatus(token);
  }, [searchParams]);

  const fetchPaymentStatus = async (token: string) => {
    try {
      setIsLoading(true);
      const status = await PaymentService.getPaymentStatus(token);
      setPaymentStatus(status);
    } catch (err: any) {
      console.error('Error fetching payment status:', err);
      setError(err.message || 'Error al consultar el estado del pago');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    const token = searchParams.get('token');
    if (token) {
      fetchPaymentStatus(token);
    }
  };

  const handleGoToExpenses = () => {
    router.push('/dashboard/mis-gastos');
  };

  const getStatusDisplay = () => {
    if (!paymentStatus) return null;

    const flowStatus = paymentStatus.flow.status;

    switch (flowStatus) {
      case 2: // Pagado
        return {
          icon: <CheckCircleIcon />,
          iconColor: 'text-green-600',
          bgColor: 'from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20',
          borderColor: 'border-green-200 dark:border-green-800',
          title: '¡Pago Exitoso!',
          message: 'Tu pago ha sido procesado correctamente.',
          showExpense: true,
        };
      case 1: // Pendiente
        return {
          icon: <ClockIcon />,
          iconColor: 'text-yellow-600',
          bgColor: 'from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20',
          borderColor: 'border-yellow-200 dark:border-yellow-800',
          title: 'Pago Pendiente',
          message:
            'Tu pago está siendo procesado. Te notificaremos cuando se complete la transacción.',
          showExpense: true,
        };
      case 3: // Rechazado
        return {
          icon: <XCircleIcon />,
          iconColor: 'text-red-600',
          bgColor: 'from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20',
          borderColor: 'border-red-200 dark:border-red-800',
          title: 'Pago Rechazado',
          message: 'Tu pago no pudo ser procesado. Por favor, intenta nuevamente.',
          showExpense: true,
        };
      case 4: // Anulado
        return {
          icon: <ExclamationCircleIcon />,
          iconColor: 'text-gray-600',
          bgColor: 'from-gray-50 to-slate-50 dark:from-gray-900/20 dark:to-slate-900/20',
          borderColor: 'border-gray-200 dark:border-gray-800',
          title: 'Pago Anulado',
          message: 'La transacción fue cancelada.',
          showExpense: true,
        };
      default:
        return {
          icon: <ExclamationCircleIcon />,
          iconColor: 'text-gray-600',
          bgColor: 'from-gray-50 to-slate-50 dark:from-gray-900/20 dark:to-slate-900/20',
          borderColor: 'border-gray-200 dark:border-gray-800',
          title: 'Estado Desconocido',
          message: 'No se pudo determinar el estado del pago.',
          showExpense: false,
        };
    }
  };

  if (isLoading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
            <LoadingSpinner size="xl" text="Consultando estado del pago..." color="blue" />
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
            <div className="max-w-2xl w-full">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-red-200 dark:border-red-800 p-8">
                <div className="text-center">
                  <div className="mx-auto w-24 h-24 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-6">
                    <XCircleIcon />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    Error al Consultar el Pago
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mb-8">{error}</p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button
                      onClick={handleRetry}
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                    >
                      Reintentar
                    </button>
                    <button
                      onClick={handleGoToExpenses}
                      className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors"
                    >
                      Volver a Mis Gastos
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  const statusDisplay = getStatusDisplay();

  if (!statusDisplay) return null;

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full">
            <div
              className={`bg-gradient-to-br ${statusDisplay.bgColor} rounded-2xl shadow-xl border ${statusDisplay.borderColor} p-8`}
            >
              <div className="text-center">
                {/* Icono */}
                <div
                  className={`mx-auto w-24 h-24 ${statusDisplay.iconColor} flex items-center justify-center mb-6`}
                >
                  {statusDisplay.icon}
                </div>

                {/* Título */}
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                  {statusDisplay.title}
                </h2>

                {/* Mensaje */}
                <p className="text-lg text-gray-700 dark:text-gray-300 mb-8">
                  {statusDisplay.message}
                </p>

                {/* Detalles del pago */}
                {paymentStatus && statusDisplay.showExpense && paymentStatus.payment && (
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 mb-8 text-left">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Detalles del Gasto
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Concepto:</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {paymentStatus.payment.expense.concept}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Monto:</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          ${paymentStatus.payment.expense.amount.toLocaleString('es-CL')} CLP
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Estado del Pago:</span>
                        <span
                          className={`font-medium ${
                            paymentStatus.flow.status === 2
                              ? 'text-green-600'
                              : paymentStatus.flow.status === 1
                                ? 'text-yellow-600'
                                : 'text-red-600'
                          }`}
                        >
                          {paymentStatus.flow.statusText}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Orden de Comercio:</span>
                        <span className="font-mono text-sm text-gray-900 dark:text-white">
                          {paymentStatus.flow.commerceOrder}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Orden Flow:</span>
                        <span className="font-mono text-sm text-gray-900 dark:text-white">
                          {paymentStatus.flow.flowOrder}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Botones de acción */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={handleGoToExpenses}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors shadow-lg hover:shadow-xl"
                  >
                    Volver a Mis Gastos
                  </button>
                  {paymentStatus && paymentStatus.flow.status === 1 && (
                    <button
                      onClick={handleRetry}
                      className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors"
                    >
                      Consultar Estado
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
