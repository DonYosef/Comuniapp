import { useRouter as useNextRouter } from 'next/navigation';
import { useCallback } from 'react';

// Wrapper para el router de Next.js que maneja errores de URL
export function useRouter() {
  const router = useNextRouter();

  const safeReplace = useCallback(
    (url: string) => {
      try {
        // Validar que la URL sea un string válido
        if (typeof url !== 'string' || url.trim() === '') {
          console.error('URL inválida para router.replace:', url);
          return;
        }

        // Asegurar que la URL comience con /
        const normalizedUrl = url.startsWith('/') ? url : `/${url}`;

        router.replace(normalizedUrl);
      } catch (error) {
        console.error('Error en router.replace:', error);
        // Fallback: usar window.location si router.replace falla
        if (typeof window !== 'undefined') {
          window.location.href = url;
        }
      }
    },
    [router],
  );

  const safePush = useCallback(
    (url: string) => {
      try {
        // Validar que la URL sea un string válido
        if (typeof url !== 'string' || url.trim() === '') {
          console.error('URL inválida para router.push:', url);
          return;
        }

        // Asegurar que la URL comience con /
        const normalizedUrl = url.startsWith('/') ? url : `/${url}`;

        router.push(normalizedUrl);
      } catch (error) {
        console.error('Error en router.push:', error);
        // Fallback: usar window.location si router.push falla
        if (typeof window !== 'undefined') {
          window.location.href = url;
        }
      }
    },
    [router],
  );

  return {
    ...router,
    replace: safeReplace,
    push: safePush,
  };
}
