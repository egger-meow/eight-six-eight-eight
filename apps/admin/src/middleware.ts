import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // If the user is requesting /login, allow them to proceed
  if (request.nextUrl.pathname.startsWith('/login')) {
    return NextResponse.next();
  }

  // Next.js middleware checking the cookie
  // The API relies on __Host-8688_session. If it's missing, the user is likely unauthenticated.
  // We use this as a client-side optimization to avoid fetching the API just to redirect.
  const hasSession = request.cookies.has('__Host-8688_session');
  
  // NOTE: In local development over HTTP without HTTPS, __Host- cookies cannot be set by the browser.
  // The API will instead set a fallback cookie like 8688_session_fallback or similar.
  // Let's just check if ANY 8688 session cookie exists
  const cookies = request.cookies.getAll();
  const hasAnySessionCookie = cookies.some(c => c.name.includes('8688_session'));

  if (!hasAnySessionCookie) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

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
