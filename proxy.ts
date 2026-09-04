import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

interface SessionData {
  expiresAt: number;
  user?: {
    username: string;
    role: string;
  };
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Ignore static assets, images, and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  const sessionCookie = request.cookies.get('pmcs_session')?.value;
  let isValidSession = false;

  if (sessionCookie) {
    try {
      const parsed: SessionData = JSON.parse(decodeURIComponent(sessionCookie));
      if (parsed && parsed.expiresAt && Date.now() < parsed.expiresAt) {
        isValidSession = true;
      }
    } catch {
      isValidSession = false;
    }
  }

  const isLoginPage = pathname === '/login';

  // If user has a valid session and visits /login, redirect to dashboard /
  if (isLoginPage && isValidSession) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // If user does not have a valid session and visits protected pages, redirect to /login
  if (!isLoginPage && !isValidSession) {
    const loginUrl = new URL('/login', request.url);
    // Add redirect param for seamless post-login redirection
    if (pathname !== '/') {
      loginUrl.searchParams.set('redirect', pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
