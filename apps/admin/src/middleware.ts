import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Auth is verified by the browser client against the API session cookie.
  // The API cookie belongs to api.8688bnb.com, so this admin domain middleware
  // cannot reliably inspect it.
  void request;
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
