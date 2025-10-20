import type { Metadata } from 'next';
import './globals.css';
import QueryProvider from '@/providers/QueryProvider';
import { AuthProvider } from '@/hooks/useAuth';
import { CommunityProvider } from '@/hooks/useCommunity';
import { ThemeProvider } from '@/hooks/useTheme';
import { ToastProvider } from '@/contexts/ToastContext';
import { Chatbot } from '@/components/chatbot';

export const metadata: Metadata = {
  title: 'Comuniapp',
  description: 'Aplicación de comunidades',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const storageKey = 'comuniapp-theme';
                  let resolvedTheme = 'dark'; // Tema oscuro por defecto
                  
                  // Intentar leer el tema guardado
                  try {
                    const savedTheme = localStorage.getItem(storageKey);
                    if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
                      if (savedTheme === 'system') {
                        resolvedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                      } else {
                        resolvedTheme = savedTheme;
                      }
                    } else {
                      // No hay tema guardado, usar preferencia del sistema
                      resolvedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                    }
                  } catch (e) {
                    // Si hay error leyendo localStorage, mantener tema oscuro por defecto
                    resolvedTheme = 'dark';
                  }
                  
                  // Aplicar inmediatamente ANTES de cualquier renderizado
                  const root = document.documentElement;
                  
                  // Limpiar todas las clases de tema
                  root.classList.remove('light', 'dark');
                  
                  // Aplicar el tema correcto
                  root.classList.add(resolvedTheme);
                  root.setAttribute('data-theme', resolvedTheme);
                  
                  // Configurar variables CSS inmediatamente
                  const bgColor = resolvedTheme === 'dark' ? '#0a0a0a' : '#ffffff';
                  const textColor = resolvedTheme === 'dark' ? '#ededed' : '#171717';
                  
                  root.style.setProperty('--background', bgColor);
                  root.style.setProperty('--foreground', textColor);
                } catch (e) {
                  // Silenciar errores
                }
              })();
            `,
          }}
        />
      </head>
      <body>
        {/* Removido GlobalThemeHandler para evitar conflictos */}
        <ThemeProvider defaultTheme="system" storageKey="comuniapp-theme">
          <AuthProvider>
            <CommunityProvider>
              <ToastProvider>
                <QueryProvider>
                  {children}
                  <Chatbot />
                </QueryProvider>
              </ToastProvider>
            </CommunityProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
