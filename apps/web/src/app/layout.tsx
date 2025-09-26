import type { Metadata } from 'next';
import './globals.css';
import QueryProvider from '@/providers/QueryProvider';
import { AuthProvider } from '@/hooks/useAuth';
import { CommunityProvider } from '@/hooks/useCommunity';

export const metadata: Metadata = {
  title: 'Comuniapp',
  description: 'Aplicación de comunidades',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <AuthProvider>
          <CommunityProvider>
            <QueryProvider>{children}</QueryProvider>
          </CommunityProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
