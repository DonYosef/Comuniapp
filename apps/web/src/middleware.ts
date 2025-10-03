import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  try {
    const { pathname } = request.nextUrl;

    // Rutas que requieren autenticación
    const protectedRoutes = ['/dashboard'];

    // Verificar si la ruta está protegida
    const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));

    if (isProtectedRoute) {
      // Verificar si hay token en las cookies o headers
      let token = request.cookies.get('token')?.value;

      if (!token) {
        const authHeader = request.headers.get('authorization');
        if (authHeader && typeof authHeader === 'string') {
          token = authHeader.replace('Bearer ', '');
        }
      }

      if (!token) {
        // Redirigir al login si no hay token
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
      }
    }

    return NextResponse.next();
  } catch (error) {
    console.error('Error en middleware:', error);
    // En caso de error, permitir que la request continúe
    return NextResponse.next();
  }
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
