import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:3000',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key',
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
          });
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Obtener la sesión del usuario
  const { data: { user } } = await supabase.auth.getUser();

  const url = request.nextUrl.clone();

  // Rutas públicas que no requieren autenticación
  const isPublicRoute = url.pathname === '/login' || url.pathname === '/' || url.pathname.startsWith('/marketplace');

  // 1. Si el usuario NO está autenticado
  if (!user) {
    if (!isPublicRoute) {
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }
    return response;
  }

  // 2. Si el usuario SÍ está autenticado
  if (user) {
    // Si intenta ir a /login o a la raíz /, consultar perfil para enviarlo a su dashboard
    if (url.pathname === '/login' || url.pathname === '/') {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      const role = profile?.role || 'technician';

      if (role === 'super_admin') {
        url.pathname = '/admin';
      } else if (role === 'company_admin') {
        url.pathname = '/empresa';
      } else if (role === 'creator') {
        url.pathname = '/creador';
      } else {
        url.pathname = '/simulador';
      }
      return NextResponse.redirect(url);
    }

    // Proteger rutas según el rol (solo si la ruta requiere rol específico)
    if (url.pathname.startsWith('/admin') || url.pathname.startsWith('/empresa') || url.pathname.startsWith('/creador')) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      const role = profile?.role;

      // El super_admin tiene acceso a todo
      if (role !== 'super_admin') {
        if (url.pathname.startsWith('/admin')) {
          url.pathname = '/login';
          return NextResponse.redirect(url);
        }
        if (url.pathname.startsWith('/empresa') && role !== 'company_admin') {
          url.pathname = '/login';
          return NextResponse.redirect(url);
        }
        if (url.pathname.startsWith('/creador') && role !== 'creator') {
          url.pathname = '/login';
          return NextResponse.redirect(url);
        }
      }
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Coincide con todas las rutas excepto:
     * - api (rutas de API)
     * - _next/static (archivos estáticos)
     * - _next/image (optimización de imágenes)
     * - favicon.ico (archivo de icono)
     * - archivos con extensiones comunes (png, jpg, svg, js, css, etc.)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|js|css|woff|woff2|ttf|eot)).*)',
  ],
};
