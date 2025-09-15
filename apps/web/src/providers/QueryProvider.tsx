'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

interface QueryProviderProps {
  children: React.ReactNode;
}

export default function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Tiempo que los datos se consideran "frescos"
            staleTime: 5 * 60 * 1000, // 5 minutos
            // Tiempo que los datos se mantienen en cache
            gcTime: 10 * 60 * 1000, // 10 minutos
            // Reintentar automáticamente en caso de error
            retry: (failureCount, error: any) => {
              // No reintentar para errores 4xx (client errors)
              if (error?.response?.status >= 400 && error?.response?.status < 500) {
                return false;
              }
              // Reintentar hasta 3 veces para otros errores
              return failureCount < 3;
            },
            // Refetch cuando la ventana recupera el foco
            refetchOnWindowFocus: false,
          },
          mutations: {
            // Reintentar mutaciones en caso de error
            retry: (failureCount, error: any) => {
              // No reintentar para errores 4xx
              if (error?.response?.status >= 400 && error?.response?.status < 500) {
                return false;
              }
              return failureCount < 2;
            },
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
