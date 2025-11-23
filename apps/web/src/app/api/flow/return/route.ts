import { NextRequest, NextResponse } from 'next/server';

/**
 * Obtiene la URL base de forma segura
 */
function getBaseUrl(request: NextRequest): string {
  // Intentar usar nextUrl (más confiable en Next.js 13+)
  if (request.nextUrl) {
    return request.nextUrl.origin;
  }

  // Si nextUrl no está disponible, usar headers
  const host = request.headers.get('host');
  const protocol = request.headers.get('x-forwarded-proto') || 'http';

  if (host) {
    return `${protocol}://${host}`;
  }

  // Fallback a variable de entorno o localhost
  return process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';
}

/**
 * API Route para manejar la redirección POST de Flow
 * Flow redirige con POST, pero nuestra página espera GET
 * Este endpoint convierte POST a GET y redirige
 */
export async function POST(request: NextRequest) {
  try {
    console.log('📥 [Flow Return API] Recibiendo redirección POST de Flow');

    // Obtener la URL base de forma segura
    const baseUrl = getBaseUrl(request);
    console.log('🔧 [Flow Return API] Base URL:', baseUrl);

    // Intentar obtener el token de múltiples formas
    let token: string | null = null;

    // 1. Intentar desde formData (POST tradicional)
    try {
      const formData = await request.formData();
      token = formData.get('token') as string;
    } catch (formDataError) {
      console.warn('⚠️ [Flow Return API] Error obteniendo formData:', formDataError);
    }

    // 2. Si no hay token en formData, intentar desde el body JSON
    if (!token) {
      try {
        const body = await request.json();
        token = body.token || null;
      } catch (jsonError) {
        // No es JSON, continuar
      }
    }

    // 3. Intentar desde los query params (por si Flow lo envía ahí)
    if (!token && request.nextUrl) {
      token = request.nextUrl.searchParams.get('token');
    }

    console.log(
      '🔑 [Flow Return API] Token recibido:',
      token ? token.substring(0, 10) + '...' : 'No token',
    );

    if (!token) {
      console.error('❌ [Flow Return API] No se recibió token en ningún formato');
      console.log('📋 [Flow Return API] Headers:', Object.fromEntries(request.headers.entries()));
      // Redirigir a la página con error
      const errorUrl = new URL('/flow/return?error=no_token', baseUrl);
      return NextResponse.redirect(errorUrl, 303);
    }

    // Redirigir a la página con GET incluyendo el token
    const returnUrl = new URL('/flow/return', baseUrl);
    returnUrl.searchParams.set('token', token);

    console.log('✅ [Flow Return API] Redirigiendo a:', returnUrl.toString());

    return NextResponse.redirect(returnUrl, 303); // 303 See Other - convierte POST a GET
  } catch (error) {
    console.error('❌ [Flow Return API] Error procesando redirección:', error);
    const baseUrl = getBaseUrl(request);
    const errorUrl = new URL('/flow/return?error=processing_error', baseUrl);
    return NextResponse.redirect(errorUrl, 303);
  }
}

/**
 * También manejar GET por si Flow usa GET en algunos casos
 */
export async function GET(request: NextRequest) {
  try {
    const baseUrl = getBaseUrl(request);
    console.log('🔧 [Flow Return API] Base URL (GET):', baseUrl);

    // Usar nextUrl.searchParams si está disponible, sino construir URL
    let token: string | null = null;
    if (request.nextUrl) {
      token = request.nextUrl.searchParams.get('token');
    } else {
      const url = new URL(request.url || '', baseUrl);
      token = url.searchParams.get('token');
    }

    console.log('📥 [Flow Return API] Recibiendo redirección GET de Flow');
    console.log('🔑 [Flow Return API] Token:', token ? token.substring(0, 10) + '...' : 'No token');

    // Si ya tiene token, solo redirigir a la página
    if (token) {
      const returnUrl = new URL('/flow/return', baseUrl);
      returnUrl.searchParams.set('token', token);
      return NextResponse.redirect(returnUrl, 303);
    }

    const errorUrl = new URL('/flow/return?error=no_token', baseUrl);
    return NextResponse.redirect(errorUrl, 303);
  } catch (error) {
    console.error('❌ [Flow Return API] Error procesando GET:', error);
    const baseUrl = getBaseUrl(request);
    const errorUrl = new URL('/flow/return?error=processing_error', baseUrl);
    return NextResponse.redirect(errorUrl, 303);
  }
}
