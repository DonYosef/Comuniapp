'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
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

// Componente interno que usa useSearchParams
function FlowReturnContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatusResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Solo ejecutar en el cliente
    if (typeof window === 'undefined') return;

    // Intentar obtener el token de múltiples lugares
    let token: string | null = null;

    // 1. Intentar desde los parámetros de la URL (GET)
    if (searchParams) {
      token = searchParams.get('token');

      // Verificar si hay un error en los parámetros
      const errorParam = searchParams.get('error');
      if (errorParam) {
        const errorMessages: Record<string, string> = {
          no_token: 'No se recibió el token de pago de Flow',
          processing_error: 'Error al procesar la respuesta de Flow',
        };
        setError(errorMessages[errorParam] || 'Error desconocido');
        setIsLoading(false);
        return;
      }
    }

    // 2. Si no hay token en los parámetros, intentar desde sessionStorage
    // (por si Flow redirigió como POST y el endpoint lo guardó temporalmente)
    if (!token && typeof window !== 'undefined') {
      const storedToken = sessionStorage.getItem('flow_payment_token');
      if (storedToken) {
        token = storedToken;
        sessionStorage.removeItem('flow_payment_token');
        // Actualizar la URL sin recargar la página
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.set('token', token);
        window.history.replaceState({}, '', newUrl.toString());
      }
    }

    // 3. Intentar desde localStorage (último recurso)
    if (!token && typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('flow_payment_token');
      if (storedToken) {
        token = storedToken;
        localStorage.removeItem('flow_payment_token');
        // Actualizar la URL sin recargar la página
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.set('token', token);
        window.history.replaceState({}, '', newUrl.toString());
      }
    }

    if (!token) {
      setError('No se recibió el token de pago');
      setIsLoading(false);
      return;
    }

    // Consultar el estado del pago
    fetchPaymentStatus(token);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchPaymentStatus = async (token: string) => {
    try {
      setIsLoading(true);

      // Verificar que estamos en el cliente
      if (typeof window === 'undefined') {
        console.warn('No se puede hacer la petición en el servidor');
        setError('No se puede consultar el estado en el servidor');
        setIsLoading(false);
        return;
      }

      console.log('🔍 Consultando estado del pago para token:', token.substring(0, 10) + '...');
      const status = await PaymentService.getPaymentStatus(token);
      console.log('📊 Estado del pago recibido:', status);
      setPaymentStatus(status);

      // Si el pago está pagado (status === 2), confirmar el pago automáticamente
      if (status.flow.status === 2) {
        console.log('✅ Pago exitoso detectado, confirmando pago en el sistema...');
        try {
          await PaymentService.confirmPayment(token);
          console.log('✅ Pago confirmado exitosamente en la base de datos');
        } catch (confirmError) {
          console.error('❌ Error al confirmar el pago:', confirmError);
          // No mostramos error al usuario ya que Flow ya procesó el pago
        }
      }

      // Si el pago está pendiente, volver a consultar en 3 segundos
      if (status.flow.status === 1) {
        console.log('⏳ Pago pendiente, reintentando en 3 segundos...');
        setTimeout(() => {
          fetchPaymentStatus(token);
        }, 3000);
      }
    } catch (err: any) {
      console.error('Error fetching payment status:', err);
      setError(err.message || 'Error al consultar el estado del pago');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    if (!searchParams) {
      console.error('searchParams is null');
      return;
    }
    const token = searchParams.get('token');
    if (token) {
      fetchPaymentStatus(token);
    }
  };

  const handleGoToExpenses = () => {
    // Agregar timestamp para forzar recarga de datos
    const timestamp = new Date().getTime();
    router.push(`/dashboard/mis-gastos?refresh=${timestamp}`);
  };

  const getStatusDisplay = () => {
    if (!paymentStatus) return null;

    const flowStatus = paymentStatus.flow.status;

    switch (flowStatus) {
      case 2: // Pagado
        return {
          icon: <CheckCircleIcon />,
          iconColor: 'text-green-400',
          bgColor: 'from-slate-800 to-slate-700',
          borderColor: 'border-green-500/50',
          title: '¡Pago Exitoso!',
          message: 'Tu pago ha sido procesado correctamente.',
          showExpense: true,
        };
      case 1: // Pendiente
        return {
          icon: <ClockIcon />,
          iconColor: 'text-yellow-400',
          bgColor: 'from-slate-800 to-slate-700',
          borderColor: 'border-yellow-500/50',
          title: 'Pago Pendiente',
          message:
            'Tu pago está siendo procesado. Te notificaremos cuando se complete la transacción.',
          showExpense: true,
        };
      case 3: // Rechazado
        return {
          icon: <XCircleIcon />,
          iconColor: 'text-red-400',
          bgColor: 'from-slate-800 to-slate-700',
          borderColor: 'border-red-500/50',
          title: 'Pago Rechazado',
          message: 'Tu pago no pudo ser procesado. Por favor, intenta nuevamente.',
          showExpense: true,
        };
      case 4: // Anulado
        return {
          icon: <ExclamationCircleIcon />,
          iconColor: 'text-gray-400',
          bgColor: 'from-slate-800 to-slate-700',
          borderColor: 'border-gray-500/50',
          title: 'Pago Anulado',
          message: 'La transacción fue cancelada.',
          showExpense: true,
        };
      default:
        return {
          icon: <ExclamationCircleIcon />,
          iconColor: 'text-gray-400',
          bgColor: 'from-slate-800 to-slate-700',
          borderColor: 'border-gray-500/50',
          title: 'Estado Desconocido',
          message: 'No se pudo determinar el estado del pago.',
          showExpense: false,
        };
    }
  };

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-slate-800 to-slate-700 flex items-center justify-center">
          <LoadingSpinner size="xl" text="Consultando estado del pago..." color="blue" />
        </div>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-slate-800 to-slate-700 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full">
            <div className="bg-slate-800 rounded-2xl shadow-2xl border border-red-600/30 p-8">
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
      </ProtectedRoute>
    );
  }

  const statusDisplay = getStatusDisplay();

  if (!statusDisplay) return null;

  return (
    <ProtectedRoute>
      <div
        className={`min-h-screen bg-gradient-to-br ${statusDisplay.bgColor} flex items-center justify-center p-4`}
      >
        <div className="max-w-2xl w-full">
          <div
            className={`bg-gradient-to-br ${statusDisplay.bgColor} rounded-2xl shadow-2xl border ${statusDisplay.borderColor} p-8 backdrop-blur-sm`}
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
    </ProtectedRoute>
  );
}

// Componente principal con Suspense boundary
export default function FlowReturnPage() {
  try {
    return (
      <Suspense
        fallback={
          <ProtectedRoute>
            <div className="min-h-screen bg-gradient-to-br from-slate-800 to-slate-700 flex items-center justify-center">
              <LoadingSpinner size="xl" text="Cargando página..." color="blue" />
            </div>
          </ProtectedRoute>
        }
      >
        <FlowReturnContent />
      </Suspense>
    );
  } catch (error) {
    console.error('Error in FlowReturnPage:', error);
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-slate-800 to-slate-700 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-slate-800 rounded-2xl shadow-2xl border border-red-600/30 p-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Error al Cargar la Página
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-8">
                {error instanceof Error ? error.message : 'Error desconocido'}
              </p>
              <a
                href="/dashboard/mis-gastos"
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors inline-block"
              >
                Volver a Mis Gastos
              </a>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }
}
