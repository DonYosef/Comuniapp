'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}

/**
 * ThemeProvider
 *
 * Proveedor de contexto para gestionar el tema de la aplicación.
 *
 * Características:
 * - Soporte para tema claro, oscuro y preferencia del sistema
 * - Persistencia automática en localStorage
 * - Detección de cambios en la preferencia del sistema
 * - Transiciones suaves entre temas
 *
 * @param children - Componentes hijos
 * @param defaultTheme - Tema por defecto (default: 'system')
 * @param storageKey - Clave para localStorage (default: 'comuniapp-theme')
 */
export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'comuniapp-theme',
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme);
  const [mounted, setMounted] = useState(false);

  // Obtener el tema resuelto (light o dark)
  const getResolvedTheme = (currentTheme: Theme): 'light' | 'dark' => {
    if (typeof window === 'undefined') return 'light';
    if (currentTheme === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return currentTheme;
  };

  // Inicializar el tema resuelto desde el DOM
  const getInitialResolvedTheme = (): 'light' | 'dark' => {
    if (typeof window === 'undefined') return 'light';
    const htmlClass = document.documentElement.classList;
    if (htmlClass.contains('dark')) return 'dark';
    if (htmlClass.contains('light')) return 'light';
    return 'light';
  };

  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(getInitialResolvedTheme);

  // Cargar el tema desde localStorage al montar
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey) as Theme | null;
      if (stored && ['light', 'dark', 'system'].includes(stored)) {
        setThemeState(stored);
        const resolved = getResolvedTheme(stored);
        setResolvedTheme(resolved);
      } else {
        // Si no hay tema guardado, sincronizar con el DOM
        const currentResolved = getInitialResolvedTheme();
        setResolvedTheme(currentResolved);
      }
    } catch (error) {
      console.error('Error loading theme from localStorage:', error);
    }
    setMounted(true);
  }, [storageKey]);

  // Aplicar el tema al documento y actualizar el tema resuelto
  useEffect(() => {
    if (!mounted) return;

    const resolved = getResolvedTheme(theme);
    setResolvedTheme(resolved);

    const root = document.documentElement;

    // Remover todas las clases de tema
    root.classList.remove('light', 'dark');

    // Agregar la clase del tema resuelto
    root.classList.add(resolved);

    // Actualizar el atributo data-theme para compatibilidad
    root.setAttribute('data-theme', resolved);

    // Persistir en localStorage
    try {
      localStorage.setItem(storageKey, theme);
    } catch (error) {
      console.error('Error saving theme to localStorage:', error);
    }
  }, [theme, mounted, storageKey]);

  // Escuchar cambios en la preferencia del sistema
  useEffect(() => {
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = () => {
      const resolved = getResolvedTheme('system');
      setResolvedTheme(resolved);

      const root = document.documentElement;
      root.classList.remove('light', 'dark');
      root.classList.add(resolved);
      root.setAttribute('data-theme', resolved);
    };

    // Navegadores modernos
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }

    // Fallback para navegadores antiguos
    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  const toggleTheme = () => {
    if (theme === 'system') {
      // Si está en system, cambiar a light o dark según el tema actual resuelto
      setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
    } else {
      // Alternar entre light y dark
      setTheme(theme === 'light' ? 'dark' : 'light');
    }
  };

  const value: ThemeContextType = {
    theme,
    resolvedTheme,
    setTheme,
    toggleTheme,
  };

  // Evitar flash de contenido sin estilo
  if (!mounted) {
    return <>{children}</>;
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/**
 * useTheme Hook
 *
 * Hook para acceder al contexto del tema.
 *
 * @returns ThemeContextType con theme, resolvedTheme, setTheme y toggleTheme
 *
 * @example
 * ```tsx
 * const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();
 *
 * // Cambiar tema manualmente
 * setTheme('dark');
 *
 * // Alternar entre light y dark
 * toggleTheme();
 *
 * // Obtener el tema actual
 * console.log(theme); // 'light' | 'dark' | 'system'
 * console.log(resolvedTheme); // 'light' | 'dark'
 * ```
 */
export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);

  if (context === undefined) {
    throw new Error('useTheme debe ser usado dentro de un ThemeProvider');
  }

  return context;
}

/**
 * useThemeSafe
 * Variante segura que no lanza error si no hay ThemeProvider.
 * Devuelve un mínimo de API: resolvedTheme y toggleTheme con fallback al DOM.
 */
export function useThemeSafe(): { resolvedTheme: 'light' | 'dark'; toggleTheme: () => void } {
  try {
    const ctx = useContext(ThemeContext);
    if (ctx) {
      return { resolvedTheme: ctx.resolvedTheme, toggleTheme: ctx.toggleTheme };
    }
  } catch (_e) {
    // ignorar y usar fallback
  }

  let resolved: 'light' | 'dark' = 'dark';
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    resolved = document.documentElement.classList.contains('light') ? 'light' : 'dark';
  }

  const toggle = () => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    const html = document.documentElement;
    const current = html.classList.contains('dark') ? 'dark' : 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    html.classList.remove('light', 'dark');
    html.classList.add(next);
    html.setAttribute('data-theme', next);
    const bg = next === 'dark' ? '#0a0a0a' : '#ffffff';
    const fg = next === 'dark' ? '#ededed' : '#171717';
    html.style.setProperty('--background', bg);
    html.style.setProperty('--foreground', fg);
    try {
      localStorage.setItem('comuniapp-theme', next);
    } catch (_err) {}
  };

  return { resolvedTheme: resolved, toggleTheme: toggle };
}
