import { NextRequest, NextResponse } from 'next/server';

/**
 * API Route para manejar la redirección POST de Flow
 * Flow redirige con POST, pero nuestra página espera GET
 * Este endpoint convierte POST a GET y redirige
 */
export async function POST(request: NextRequest) {
  try {
    console.log('📥 [Flow Return API] Recibiendo redirección POST de Flow');

    // Obtener el token de los parámetros del POST
    const formData = await request.formData();
    const token = formData.get('token') as string;

    console.log(
      '🔑 [Flow Return API] Token recibido:',
      token ? token.substring(0, 10) + '...' : 'No token',
    );

    if (!token) {
      console.error('❌ [Flow Return API] No se recibió token');
      // Redirigir a la página con error
      return NextResponse.redirect(new URL('/flow/return?error=no_token', request.url));
    }

    // Redirigir a la página con GET incluyendo el token
    const returnUrl = new URL('/flow/return', request.url);
    returnUrl.searchParams.set('token', token);

    console.log('✅ [Flow Return API] Redirigiendo a:', returnUrl.toString());

    return NextResponse.redirect(returnUrl, 303); // 303 See Other - convierte POST a GET
  } catch (error) {
    console.error('❌ [Flow Return API] Error procesando redirección:', error);
    return NextResponse.redirect(new URL('/flow/return?error=processing_error', request.url));
  }
}

/**
 * También manejar GET por si Flow usa GET en algunos casos
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    console.log('📥 [Flow Return API] Recibiendo redirección GET de Flow');
    console.log('🔑 [Flow Return API] Token:', token ? token.substring(0, 10) + '...' : 'No token');

    // Si ya tiene token, solo redirigir a la página
    if (token) {
      return NextResponse.redirect(new URL(`/flow/return?token=${token}`, request.url));
    }

    return NextResponse.redirect(new URL('/flow/return?error=no_token', request.url));
  } catch (error) {
    console.error('❌ [Flow Return API] Error procesando GET:', error);
    return NextResponse.redirect(new URL('/flow/return?error=processing_error', request.url));
  }
}
