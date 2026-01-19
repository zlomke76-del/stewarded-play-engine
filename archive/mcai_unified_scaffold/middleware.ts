import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const inProduct = pathname.startsWith('/app') || pathname.startsWith('/studio');
  const isSignedIn = req.cookies.get('mcai_auth')?.value === '1'; // placeholder
  if (inProduct && !isSignedIn) {
    const url = req.nextUrl.clone();
    url.pathname = '/auth/sign-in';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/app/:path*', '/studio/:path*'],
};
