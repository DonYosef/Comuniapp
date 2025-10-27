// Configuración de variables de entorno
// Asegurar que apiUrl nunca sea null o undefined
// Next.js expone NEXT_PUBLIC_* variables en ambos lados (cliente y servidor)
const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Log para debug (solo en desarrollo)
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  console.log('🔧 [env] NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL);
  console.log('🔧 [env] apiUrl config:', apiUrl);
}

export const config = {
  apiUrl,
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
};
