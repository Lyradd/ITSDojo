import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-url', request.url);

  const sessionCookie = request.cookies.get('itsdojo_session');
  const pathname = request.nextUrl.pathname;
  
  // List of paths that require student (mahasiswa) authorization
  const isDashboardPath = 
    pathname.startsWith('/duel') || 
    pathname.startsWith('/learn') || 
    pathname.startsWith('/profile') || 
    pathname.startsWith('/settings') || 
    pathname.startsWith('/goals') || 
    pathname.startsWith('/leaderboard') || 
    pathname.startsWith('/shop') || 
    pathname.startsWith('/calendar');

  if (isDashboardPath && !sessionCookie) {
    const loginUrl = new URL('/login', request.url);
    // Preserving the full path and search query (e.g. ?room=INVITECODE)
    loginUrl.searchParams.set('redirectTo', pathname + request.nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    '/duel/:path*', 
    '/learn/:path*', 
    '/profile/:path*', 
    '/settings/:path*', 
    '/goals/:path*', 
    '/leaderboard/:path*', 
    '/shop/:path*',
    '/calendar/:path*'
  ],
};
