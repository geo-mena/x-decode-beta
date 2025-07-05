import { clerkMiddleware } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// import { NextRequest } from 'next/server';

// const isProtectedRoute = createRouteMatcher(['/service(.*)']);

// export default clerkMiddleware();
// export default clerkMiddleware(async () => {
    // Temporarily commented out for development
    // if (isProtectedRoute(req)) await auth.protect();
// });

export default clerkMiddleware((_auth, _req) => {
  return NextResponse.next();
});
export const config = {
    matcher: [
        // Skip Next.js internals and all static files, unless found in search params
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        // Always run for API routes
        '/(api|trpc)(.*)'
    ]
};
