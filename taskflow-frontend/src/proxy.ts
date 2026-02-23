// src/middleware.ts   ← IMPORTANTE: debe estar aquí, no como proxy.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const tokenFromCookie = request.cookies.get('token')?.value;
  const tokenFromHeader = request.headers.get('authorization')?.replace('Bearer ', '');
  const token = tokenFromCookie || tokenFromHeader;

  const pathname = request.nextUrl.pathname;
  const isAuthPage      = pathname.startsWith('/login') || pathname.startsWith('/register');
  const isPublicPage    = pathname === '/';
  const isProtectedPage = pathname.startsWith('/dashboard') || pathname.startsWith('/boards');

  // Si tiene token y va a auth → redirigir a dashboard
  if (token && isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Si NO tiene token y va a página protegida → redirigir a login
  if (!token && !isPublicPage && !isAuthPage) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.js|.*\\.css).*)'],
};