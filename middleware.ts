import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

// In-memory route cache with TTL
const routeCache = new Map<string, { route: RouteConfig; expires: number }>();
const CACHE_TTL = 10000; // 10 seconds

// Type definitions for route configuration
interface ServiceMetadata {
  authHeader?: string;
  apiKey?: string;
}

interface RouteConfig {
  path: string;
  method: string;
  isActive: boolean;
  targetUrl: string;
  rateLimit?: number;
  middlewares?: {
    auth?: boolean;
    cors?: { origin?: string };
    response?: {
      cacheControl?: string;
    };
  };
  service: {
    metadata?: ServiceMetadata;
    rateLimit?: number;
  };
}

// Predefined route configurations (replace with your actual routes)
const routeConfigurations: RouteConfig[] = [
  {
    path: "/api/users",
    method: "GET",
    isActive: true,
    targetUrl: "https://user-service.example.com",
    rateLimit: 100,
    middlewares: {
      auth: true,
      cors: { origin: "*" }
    },
    service: {
      metadata: {
        authHeader: "Authorization",
        apiKey: "service-secret-key"
      },
      rateLimit: 1000
    }
  },
  // Add more route configurations here
];

// Rate limiting tracker (in-memory, replace with distributed solution in production)
const rateLimitTracker = new Map<string, { count: number; resetTime: number }>();

// Rate limiting helper
function checkRateLimit(key: string, limit: number): boolean {
  const now = Date.now();
  const tracker = rateLimitTracker.get(key);

  // Reset if past the tracking window (1 minute)
  if (!tracker || tracker.resetTime < now) {
    rateLimitTracker.set(key, { count: 1, resetTime: now + 60000 });
    return false;
  }

  // Check if limit exceeded
  if (tracker.count >= limit) {
    return true;
  }

  // Increment count
  rateLimitTracker.set(key, { 
    count: tracker.count + 1, 
    resetTime: tracker.resetTime 
  });

  return false;
}

// Middleware for applying route-specific logic
async function applyMiddlewares(
  middlewares: RouteConfig['middlewares'], 
  context: { 
    request: NextRequest; 
    headers: Headers; 
    session: ReturnType<typeof getSessionCookie> 
  }
) {
  // Authentication middleware
  if (middlewares?.auth && !context.session) {
    throw new Error('Authentication required');
  }

  // CORS middleware
  if (middlewares?.cors) {
    context.headers.set(
      'Access-Control-Allow-Origin', 
      middlewares.cors.origin || '*'
    );
  }
}

// Main middleware function
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

  // Only process API routes
  if (pathname.startsWith("/api/") && !pathname.startsWith("/api/internal") && !pathname.startsWith("/api/auth")) {
    try {
      // Find route configuration
      const cacheKey = `${method}:${pathname}`;
      const cachedRoute = routeCache.get(cacheKey);
      
      let routeConfig: RouteConfig | undefined;
      
      // Use cached route if not expired
      if (cachedRoute && cachedRoute.expires > Date.now()) {
        routeConfig = cachedRoute.route;
      } else {
        // Find route in predefined configurations
        routeConfig = routeConfigurations.find(
          route => route.path === pathname && 
                   route.method === method && 
                   route.isActive
        );

        // Cache the route if found
        if (routeConfig) {
          routeCache.set(cacheKey, {
            route: routeConfig,
            expires: Date.now() + CACHE_TTL
          });
        }
      }

      // Return 404 if no route found
      if (!routeConfig) {
        return NextResponse.json(
          { message: "Route not found" },
          { status: 404 }
        );
      }

      // Rate limiting
      const rateLimitKey = sessionCookie?.userId 
        ? `user:${sessionCookie.userId}` 
        : `ip:${request.ip ?? 'unknown'}`;
      
      const rateLimit = routeConfig.rateLimit || routeConfig.service.rateLimit || 1000;
      
      if (checkRateLimit(rateLimitKey, rateLimit)) {
        return NextResponse.json(
          { message: "Rate limit exceeded" },
          { status: 429, headers: { 'Retry-After': '60' } }
        );
      }

      // Prepare proxy request
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

      // Handle redirects
      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get('location');
        if (location) {
          return NextResponse.redirect(location);
        }
      }

      // Prepare response headers
      const responseHeaders = new Headers(response.headers);
      responseHeaders.set('x-api-gateway', 'true');

      // Apply response middlewares
      if (routeConfig.middlewares?.response) {
        const cacheControl = routeConfig.middlewares.response.cacheControl;
        if (cacheControl) {
          responseHeaders.set('Cache-Control', cacheControl);
        }
      }

      // Return proxied response
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

// Middleware configuration
export const config = {
  matcher: [
    "/api/:path*",
    "/dashboard/:path*",
    "/sign-in"
  ]
};
