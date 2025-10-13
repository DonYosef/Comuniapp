import type { Metadata } from 'next';
import './globals.css';
import QueryProvider from '@/providers/QueryProvider';
import { AuthProvider } from '@/hooks/useAuth';
import { CommunityProvider } from '@/hooks/useCommunity';
import { ThemeProvider } from '@/hooks/useTheme';
import { Chatbot } from '@/components/chatbot';

export const metadata: Metadata = {
  title: 'Comuniapp',
  description: 'Aplicación de comunidades',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const storageKey = 'comuniapp-theme';
                const theme = localStorage.getItem(storageKey) || 'system';
                let resolvedTheme = theme;
                
                if (theme === 'system') {
                  resolvedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                }
                
                document.documentElement.classList.remove('light', 'dark');
                document.documentElement.classList.add(resolvedTheme);
                document.documentElement.setAttribute('data-theme', resolvedTheme);
              })();
            `,
          }}
        />
      </head>
      <body>
        <ThemeProvider defaultTheme="system" storageKey="comuniapp-theme">
          <AuthProvider>
            <CommunityProvider>
              <QueryProvider>
                {children}
                <Chatbot />
              </QueryProvider>
            </CommunityProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
