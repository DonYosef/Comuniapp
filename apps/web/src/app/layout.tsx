import type { Metadata } from 'next';
import './globals.css';
import QueryProvider from '@/providers/QueryProvider';

export const metadata: Metadata = {
  title: 'Comuniapp',
  description: 'Aplicación de comunidades',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
