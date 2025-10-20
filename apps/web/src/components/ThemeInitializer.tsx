'use client';

import { useEffect } from 'react';

/**
 * ThemeInitializer
 *
 * Componente que sincroniza el tema con el script inline.
 * Solo se ejecuta si el script no aplicó el tema correctamente.
 */
export default function ThemeInitializer() {
  useEffect(() => {
    // Solo verificar si el tema ya está aplicado correctamente
    const checkAndSyncTheme = () => {
      try {
        const storageKey = 'comuniapp-theme';
        const savedTheme = localStorage.getItem(storageKey);

        let expectedTheme;
        if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
          if (savedTheme === 'system') {
            expectedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
              ? 'dark'
              : 'light';
          } else {
            expectedTheme = savedTheme;
          }
        } else {
          // Si no hay tema guardado, usar preferencia del sistema
          expectedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
            ? 'dark'
            : 'light';
        }

        const currentTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';

        // Solo aplicar si el tema no coincide
        if (currentTheme !== expectedTheme) {
          const root = document.documentElement;
          root.classList.remove('light', 'dark');
          root.classList.add(expectedTheme);
          root.setAttribute('data-theme', expectedTheme);

          // Solo configurar variables CSS - NO estilos inline para evitar hydration mismatch
          const bgColor = expectedTheme === 'dark' ? '#0a0a0a' : '#ffffff';
          const textColor = expectedTheme === 'dark' ? '#ededed' : '#171717';

          root.style.setProperty('--background', bgColor);
          root.style.setProperty('--foreground', textColor);

          console.log('🎨 Tema sincronizado:', expectedTheme);
        }
      } catch (error) {
        console.error('Error sincronizando tema:', error);
      }
    };

    // Verificar después de un pequeño delay para permitir que el script se ejecute
    setTimeout(checkAndSyncTheme, 10);
  }, []);

  // Este componente no renderiza nada
  return null;
}
