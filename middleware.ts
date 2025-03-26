// File: src/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// In middleware.ts
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const method = request.method;
  
  console.log('Incoming Request:', {
    pathname,
    method,
    fullUrl: request.url
  });

  if (pathname.startsWith('/api/')) {
    try {
      const routeCheckUrl = new URL('/api/route-check', request.nextUrl.origin);
      routeCheckUrl.searchParams.set('path', pathname);
      routeCheckUrl.searchParams.set('method', method);
      
      console.log('Route Check URL:', routeCheckUrl.toString());
      
      const routeCheckResponse = await fetch(routeCheckUrl.toString());
      const routeData = await routeCheckResponse.json();
      
      console.log('Route Check Response:', routeData);
      
      if (!routeData.exists) {
        console.warn('Route not found:', { pathname, method });
        return new NextResponse(JSON.stringify({ 
          error: 'Route not found',
          details: { pathname, method }
        }), { status: 404 });
      }

      // More detailed logging for target URL construction
      console.log('Target URL Construction:', {
        pathname,
        targetUrl: routeData.targetUrl,
        constructedTargetUrl: `https://${routeData.targetUrl}${pathname.replace('/api', '')}`
      });

      const targetUrl = new URL(
        pathname.replace('/api', ''), 
        `https://${routeData.targetUrl}`
      );
      
      console.log('Final Target URL:', targetUrl.toString());

      // Rest of the code remains the same...
    } catch (error) {
      console.error('Middleware Error:', error);
      // Error handling...
    }
  }
  return NextResponse.next();
}
