import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const session = request.cookies.get('session');
  const { pathname } = request.nextUrl;

  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/signup');
  const isProtectedPage = pathname.startsWith('/dashboard') || pathname.startsWith('/profile');

  // If the user has a session and tries to access an auth page (login/signup),
  // redirect them to the dashboard.
  if (session && isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // If the user does not have a session and tries to access a protected page,
  // redirect them to the login page.
  if (!session && isProtectedPage) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Otherwise, continue to the requested page.
  return NextResponse.next();
}

// Configure the middleware to run on specific paths.
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
