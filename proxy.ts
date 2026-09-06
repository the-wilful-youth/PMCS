import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySessionCookie } from './lib/server-auth';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Ignore static assets, next internal routes, images, and favicon
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  const isValidSession = verifySessionCookie(request);
  const isLoginPage = pathname === '/login';

  // If user has a valid verified session and visits /login, redirect to dashboard /
  if (isLoginPage && isValidSession) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // If user does not have a valid verified session and visits protected pages, redirect to /login
  if (!isLoginPage && !isValidSession) {
    const loginUrl = new URL('/login', request.url);
    if (pathname !== '/') {
      loginUrl.searchParams.set('redirect', pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export default proxy;

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
