import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Public routes that don't require authentication
    const publicRoutes = ['/login'];

    // Check if the current route is public
    if (publicRoutes.some(route => pathname.startsWith(route))) {
        return NextResponse.next();
    }

    // Check for auth token (basic check, client-side validation handles the rest via AuthContext)
    // In a real app, you might verify the session cookie here.
    // Since we rely on client-side SDK for initial auth state, we might push the user to login 
    // if we can't detect a session, but typically with Firebase client SDK, 
    // the middleware can't fully validate without session cookies.
    // For this implementation, we'll let the client-side AuthContext handle the redirect 
    // to avoid flashing or complex session cookie management unless requested.
    // However, the prompt asked for "Auth guard so all routes except /login require login".
    // A robust way without session cookies is hard in middleware. 
    // BUT, we can check for a marker or just rely on client-side.

    // Let's implement a client-side protected route wrapper instead of middleware blocking 
    // because middleware doesn't have access to Firebase Auth state (LocalStorage/IndexedDB).
    // UNLESS we use firebase-admin and session cookies.

    // As a compromise for "Auth guard", we will enforce it strictly in AuthContext/Layout 
    // and use Middleware for simple redirects if possible, but without session cookies it's limited.

    // Leaving middleware specific for other tasks or if we add session cookies later.
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
