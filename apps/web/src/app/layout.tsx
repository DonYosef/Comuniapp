import type { Metadata } from 'next';
import './globals.css';
import QueryProvider from '@/providers/QueryProvider';
import { AuthProvider } from '@/hooks/useAuth';
import { CommunityProvider } from '@/hooks/useCommunity';
import { ThemeProvider } from '@/hooks/useTheme';

export const metadata: Metadata = {
  title: 'Comuniapp',
  description: 'Aplicación de comunidades',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body>
        <ThemeProvider defaultTheme="system" storageKey="comuniapp-theme">
          <AuthProvider>
            <CommunityProvider>
              <QueryProvider>{children}</QueryProvider>
            </CommunityProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
