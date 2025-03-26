import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Cache for route configurations (with TTL)
const routeCache = new Map<string, { route: any; expires: number }>();
const CACHE_TTL = 10000; // 10 seconds

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const method = request.method;

  // Check authentication first
  const sessionCookie = getSessionCookie(request, {
    cookieName: "session_token",
    cookiePrefix: "better-auth",
    useSecureCookies: false,
  });

  // Handle authentication for protected routes
  if (!sessionCookie) {
    if (pathname.startsWith("/dashboard") || pathname.startsWith("/api/protected")) {
      return NextResponse.redirect(new URL("/sign-in", request.url));
    }
  }

  // Check if this is an API route we should proxy
  if (pathname.startsWith("/api/") && !pathname.startsWith("/api/internal")) {
    try {
      // Check cache first
      const cacheKey = `${method}:${pathname}`;
      const cachedRoute = routeCache.get(cacheKey);
      
      let routeConfig;
      if (cachedRoute && cachedRoute.expires > Date.now()) {
        routeConfig = cachedRoute.route;
      } else {
        // Get route from database
        routeConfig = await prisma.route.findFirst({
          where: {
            path: pathname,
            method: method as any,
            isActive: true
          },
          include: {
            service: true
          }
        });

        if (routeConfig) {
          // Cache the route
          routeCache.set(cacheKey, {
            route: routeConfig,
            expires: Date.now() + CACHE_TTL
          });
        }
      }

      if (!routeConfig) {
        return NextResponse.json(
          { message: "Route not found" },
          { status: 404 }
        );
      }

      // Check rate limiting
      const rateLimitKey = sessionCookie?.userId 
        ? `user:${sessionCookie.userId}` 
        : `ip:${request.ip}`;
      
  // In your middleware.ts
const isRateLimited = await checkRateLimit(
  sessionCookie?.userId 
    ? `user:${sessionCookie.userId}`
    : `ip:${request.ip ?? 'unknown'}`,
  routeConfig.rateLimit || routeConfig.service.rateLimit || 1000
);

if (isRateLimited) {
  return NextResponse.json(
    { message: "Rate limit exceeded" },
    { status: 429, headers: { 'Retry-After': '60' } }
  );
}     // Prepare proxy request
      const targetUrl = new URL(
        pathname.replace('/api', '') + search,
        routeConfig.targetUrl
      );

      const headers = new Headers(request.headers);
      
      // Add authentication headers if needed
      if (routeConfig.service.metadata?.authHeader) {
        headers.set(
          routeConfig.service.metadata.authHeader, 
          `Bearer ${routeConfig.service.metadata.apiKey}`
        );
      }

      // Apply route-specific middlewares
      if (routeConfig.middlewares) {
        await applyMiddlewares(routeConfig.middlewares, {
          request,
          headers,
          session: sessionCookie
        });
      }

      // Proxy the request
      const response = await fetch(targetUrl.toString(), {
        method,
        headers,
        body: method !== 'GET' && method !== 'HEAD' ? request.body : undefined,
        redirect: 'manual'
      });

      // Handle response
      if (response.status >= 300 && response.status < 400) {
        // Handle redirects
        const location = response.headers.get('location');
        if (location) {
          return NextResponse.redirect(location);
        }
      }

      const responseHeaders = new Headers(response.headers);
      responseHeaders.set('x-api-gateway', 'true');

      // Apply response middlewares
      if (routeConfig.middlewares?.response) {
        await applyResponseMiddlewares(routeConfig.middlewares.response, {
          response,
          headers: responseHeaders
        });
      }

      return new NextResponse(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders
      });

    } catch (error) {
      console.error('Proxy error:', error);
      return NextResponse.json(
        { message: "Internal server error" },
        { status: 500 }
      );
    }
  }

  // Continue for non-proxy routes
  return NextResponse.next();
}

// Rate limiting helper
async function checkRateLimit(key: string, limit: number): Promise<boolean> {
  // Implement your rate limiting logic here
  // This could use Redis, Prisma, or other storage
  // For simplicity, we'll use a basic in-memory approach
  
  // In production, you should use a distributed rate limiter
  return false; // Temporary implementation
}

// Middleware application
async function applyMiddlewares(
  middlewares: any, 
  context: { request: NextRequest; headers: Headers; session: any }
) {
  if (middlewares.auth && !context.session) {
    throw new Error('Authentication required');
  }

  if (middlewares.cors) {
    context.headers.set('Access-Control-Allow-Origin', middlewares.cors.origin || '*');
  }

  // Add more middleware handlers as needed
}

async function applyResponseMiddlewares(
  middlewares: any,
  context: { response: Response; headers: Headers }
) {
  if (middlewares.cacheControl) {
    context.headers.set('Cache-Control', middlewares.cacheControl);
  }

  // Add more response middleware handlers as needed
}

export const config = {
  matcher: [
    "/api/:path*",
    "/dashboard/:path*",
    "/sign-in"
  ]
};
