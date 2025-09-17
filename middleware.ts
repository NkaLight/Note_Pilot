import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  console.log('Middleware hit for:', request.nextUrl.pathname);
  const sessionToken = request.cookies.get('session_token')?.value;

  // If there's no session token, the user is unauthenticated
  if (!sessionToken) {
    const isApiRoute = request.nextUrl.pathname.startsWith('/api/');

    // If it's an API route, return a JSON error
    if (isApiRoute) {
      return new NextResponse(
        JSON.stringify({ error: 'Authentication required' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // If it's a page, redirect to the login page
    return NextResponse.redirect(new URL('/', request.url));
  }

  const validationApiUrl = `${request.nextUrl.origin}/api/validate_session`
  try {
    const response = await fetch(validationApiUrl, {
      headers: {
        // Pass the token in the Authorization header
        Authorization: `Bearer ${sessionToken}`,
      },
    });

    // No token → block access
    if (response.status != 200) {
      if (request.nextUrl.pathname.startsWith('/api/')) {
        return new NextResponse(
          JSON.stringify({ error: 'Authentication required' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }
      return NextResponse.redirect(new URL('/', request.url));
    }else{
      if (request.nextUrl.pathname === '/') {
        return NextResponse.redirect(new URL('/ai/dashboard', request.url));
      }
    }
    
  } catch (err: any) {
    console.error('API Validation Error:', err.message);
    const response = NextResponse.redirect(new URL('/', request.url));
    response.cookies.delete('session_token');
    return response;
  }
  // If authenticated, allow the request to continue
  return NextResponse.next();
}

// The matcher protects both pages and API routes
export const config = {
  matcher: [
    '/ai/dashboard/',
    '/account/path:*',
    '/api/remove_session',
    '/api/summarize',
    '/api/upload',
     // Protects all API routes under /api/protected
  ],
};