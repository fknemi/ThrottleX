import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Rate limiting utility
class RateLimiter {
  private tracker: Map<string, { count: number; resetTime: number }>;
  private windowMs: number;

  constructor(windowMs: number = 60000) {
    this.tracker = new Map();
    this.windowMs = windowMs;
  }

  check(key: string, limit: number): { allowed: boolean; remaining: number } {
    const now = Date.now();
    const entry = this.tracker.get(key);

    if (!entry || entry.resetTime < now) {
      const newEntry = { count: 1, resetTime: now + this.windowMs };
      this.tracker.set(key, newEntry);
      return { allowed: true, remaining: limit - 1 };
    }

    if (entry.count >= limit) {
      return { allowed: false, remaining: 0 };
    }

    entry.count++;
    this.tracker.set(key, entry);

    return { 
      allowed: true, 
      remaining: Math.max(0, limit - entry.count) 
    };
  }
}

// Route configuration interface
interface RouteConfig {
  targetUrl: string;
  middlewares?: any;
  rateLimit?: number;
  cacheTtl?: number;
  serviceMetadata?: any;
}

// Route configuration service
class RouteConfigService {
  static async getRouteConfig(pathname: string, method: string): Promise<RouteConfig | null> {
    try {
      // Remove '/api' prefix and decode the path
      const cleanPath = decodeURIComponent(pathname.replace(/^\/api/, ''));

      // Fetch route configuration from an internal API route
      const response = await fetch(`http://localhost:3000/api/routes/config?path=${encodeURIComponent(cleanPath)}&method=${method}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Internal-Auth-Token': process.env.INTERNAL_API_TOKEN || ''
        },
        cache: 'no-store' // Ensure fresh configuration
      });


      if (!response.ok) {
        console.error('Route config fetch failed:', response.status, response.statusText);
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('Route configuration fetch error:', error);
      return null;
    }
  }
}

// Authentication service (placeholder)
class AuthService {
  static async validateSession(request: NextRequest): Promise<boolean> {
    const sessionToken = request.cookies.get('session_token')?.value;
    return !!sessionToken; // Simple existence check
  }
}

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const method = request.method;

  // Skip internal routes
  if (pathname.startsWith("/api/internal") || pathname.startsWith("/api/auth") || pathname.startsWith("/api/routes/")) {
    return NextResponse.next();
  }

  // Process API routes
  if (pathname.startsWith("/api/")) {
    try {
      // Fetch route configuration
      const routeConfig = await RouteConfigService.getRouteConfig(pathname, method);
      
      if (!routeConfig || !routeConfig.targetUrl) {
        console.error('No valid route configuration found for', pathname);
        return NextResponse.json(
          { error: "Route not configured" }, 
          { status: 404 }
        );
      }

      // Authentication middleware
      const middlewares = routeConfig.middlewares;
      if (middlewares?.auth) {
        const isAuthenticated = await AuthService.validateSession(request);
        if (!isAuthenticated) {
          return NextResponse.redirect(new URL("/sign-in", request.url));
        }
      }

      // Rate limiting
      const rateLimiter = new RateLimiter();
      const rateLimitKey = request.ip ?? 'unknown';
      const rateLimit = routeConfig.rateLimit ?? 100;
      const { allowed, remaining } = rateLimiter.check(rateLimitKey, rateLimit);

      if (!allowed) {
        return NextResponse.json(
          { error: "Rate limit exceeded" },
          { 
            status: 429, 
            headers: { 
              'Retry-After': '60',
              'X-RateLimit-Limit': rateLimit.toString(),
              'X-RateLimit-Remaining': '0'
            } 
          }
        );
      }

      // Prepare target URL
      let targetUrl;
      try {
        targetUrl = new URL(
          pathname.replace('/api', '') + search,
          routeConfig.targetUrl
        );
      } catch (urlError) {
        console.error('Invalid target URL:', urlError);
        return NextResponse.json(
          { error: "Invalid service configuration" }, 
          { status: 500 }
        );
      }

      // Prepare proxy headers
      const proxyHeaders = new Headers(request.headers);

      // Add service authentication headers
      const serviceMetadata = routeConfig.serviceMetadata;
      if (serviceMetadata?.authHeader && serviceMetadata?.apiKey) {
        proxyHeaders.set(
          serviceMetadata.authHeader, 
          `Bearer ${serviceMetadata.apiKey}`
        );
      }

      // CORS handling
      if (middlewares?.cors) {
        proxyHeaders.set(
          'Access-Control-Allow-Origin', 
          middlewares.cors.origin ?? '*'
        );
      }



      // TODO: FIX ME
      // Proxy the request with timeout
      let proxyResponse;
      try {
        proxyResponse = await fetch(targetUrl.toString(), {
          method,
          headers: proxyHeaders,
          body: method !== 'GET' && method !== 'HEAD' ? request.body : undefined,
          redirect: 'manual',
          signal: AbortSignal.timeout(5000) // 5-second timeout
        });
      } catch (fetchError) {
        console.error('Proxy request failed:', fetchError);
        return NextResponse.json(
          { error: "Service unavailable" }, 
          { status: 503 }
        );
      }

      // Response handling
      const responseHeaders = new Headers(proxyResponse.headers);
      responseHeaders.set('X-API-Gateway', 'true');
      responseHeaders.set('X-RateLimit-Limit', rateLimit.toString());
      responseHeaders.set('X-RateLimit-Remaining', remaining.toString());

      // Caching
      if (routeConfig.cacheTtl && routeConfig.cacheTtl > 0) {
        responseHeaders.set('Cache-Control', `public, max-age=${routeConfig.cacheTtl}`);
      }

      return new NextResponse(proxyResponse.body, {
        status: proxyResponse.status,
        statusText: proxyResponse.statusText,
        headers: responseHeaders
      });

    } catch (error) {
      console.error('API Gateway Unexpected Error:', error);
      return NextResponse.json(
        { error: "Internal server error" }, 
        { status: 500 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/api/:path*"
  ]
};
