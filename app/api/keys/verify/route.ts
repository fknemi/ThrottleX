import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

// Enhanced logging utility
async function logRequestToAPI(logData: any) {
    try {
        const logEndpoint = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/internal/route/update/logs`;
        await fetch(logEndpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Internal-Auth-Token": process.env.INTERNAL_API_TOKEN || "",
            },
            body: JSON.stringify({
                ...logData,
                timestamp: new Date().toISOString(),
            }),
        });
    } catch (logError) {
        console.error("Failed to log request:", logError);
    }
}

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
            remaining: Math.max(0, limit - entry.count),
        };
    }
}

interface RouteConfig {
    targetUrl: string;
    middlewares?: {
        auth?: boolean;
        apiKey?: boolean;
        requiredScopes?: string[];
        cors?: {
            origin: string;
        };
    };
    rateLimit?: number;
    cacheTtl?: number;
    serviceMetadata?: any;
    id: string;
    serviceId: string;
    status: number;
}

class RouteConfigService {
    static async getRouteConfig(
        pathname: string,
        method: string
    ): Promise<RouteConfig | null> {
        try {
            const cleanPath = decodeURIComponent(pathname.replace(/^\/api/, ""));
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/routes/config?path=${encodeURIComponent(cleanPath)}&method=${method}`,
                {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        "Internal-Auth-Token": process.env.INTERNAL_API_TOKEN || "",
                    },
                    cache: "no-store",
                }
            );

            if (!response.ok) {
                return null;
            }

            return await response.json();
        } catch (error) {
            return null;
        }
    }
}

class AuthService {
    static async validateSession(request: NextRequest): Promise<boolean> {
        const sessionToken = request.cookies.get("session_token")?.value;
        return !!sessionToken;
    }

    static async verifyApiKey(apiKey: string): Promise<{
        valid: boolean;
        key?: {
            id: string;
            name: string;
            prefix: string;
            scopes: string[];
            rateLimit: number;
            expiresAt: Date | null;
            createdAt: Date;
            service?: { id: string; name: string };
            user: { id: string; name: string; email: string };
        };
        error?: string;
    }> {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/keys/verify`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${apiKey}`,
                    "Content-Type": "application/json",
                },
            });

            const data = await response.json();
            
            if (!response.ok) {
                return { valid: false, error: data.error || "API key verification failed" };
            }

            return { valid: true, key: data.key };
        } catch (error) {
            console.error("API key verification error:", error);
            return { valid: false, error: "Internal server error during API key verification" };
        }
    }
}

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const method = request.method;
    const ip = request.ip || "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";

    // Base log data for all requests
    const baseLogData = {
        path: pathname,
        method,
        ip,
        userAgent,
        timestamp: new Date().toISOString(),
    };

    // Skip internal routes
    if (
        pathname.startsWith("/api/internal") ||
        pathname.startsWith("/api/auth") ||
        pathname.startsWith("/api/routes/")
    ) {
        await logRequestToAPI({
            ...baseLogData,
            action: "Skipped internal route",
        });
        return NextResponse.next();
    }

    // Get route configuration
    const routeConfig = await RouteConfigService.getRouteConfig(pathname, method);
    
    if (!routeConfig) {
        await logRequestToAPI({
            ...baseLogData,
            statusCode: 404,
            error: "Route not configured",
            isError: true,
        });
        return NextResponse.json(
            { error: "Route not configured" },
            { status: 404 }
        );
    }

    // Authentication middleware
    if (routeConfig.middlewares?.auth) {
        const isAuthenticated = await AuthService.validateSession(request);
        if (!isAuthenticated) {
            await logRequestToAPI({
                ...baseLogData,
                statusCode: 401,
                error: "Unauthorized",
                isError: true,
                routeId: routeConfig.id,
                serviceId: routeConfig.serviceId,
            });
            return NextResponse.redirect(new URL("/sign-in", request.url));
        }
    }

    // API Key middleware
    if (pathname.startsWith("/api/gate/") || routeConfig.middlewares?.apiKey) {
        const authHeader = request.headers.get("authorization");
        const apiKey = authHeader?.split(" ")[1]; // Bearer <token>

        if (!apiKey) {
            await logRequestToAPI({
                ...baseLogData,
                statusCode: 401,
                error: "API key required",
                isError: true,
                routeId: routeConfig.id,
                serviceId: routeConfig.serviceId,
            });
            return NextResponse.json(
                { error: "API key is required in Authorization header" },
                { status: 401 }
            );
        }

        const verification = await AuthService.verifyApiKey(apiKey);
        if (!verification.valid || !verification.key) {
            await logRequestToAPI({
                ...baseLogData,
                statusCode: 401,
                error: verification.error || "Invalid API key",
                isError: true,
                routeId: routeConfig.id,
                serviceId: routeConfig.serviceId,
            });
            return NextResponse.json(
                { error: verification.error || "Invalid API key" },
                { status: 401 }
            );
        }

        // Check required scopes
        const requiredScopes = routeConfig.middlewares?.requiredScopes || [];
        if (requiredScopes.length > 0) {
            const hasRequiredScopes = requiredScopes.every(scope =>
                verification.key.scopes.includes(scope)
            );

            if (!hasRequiredScopes) {
                await logRequestToAPI({
                    ...baseLogData,
                    statusCode: 403,
                    error: "Insufficient permissions",
                    isError: true,
                    routeId: routeConfig.id,
                    serviceId: routeConfig.serviceId,
                    requiredScopes,
                    actualScopes: verification.key.scopes,
                });
                return NextResponse.json(
                    { error: "Insufficient permissions" },
                    { status: 403 }
                );
            }
        }

        // Apply rate limiting from API key if not overridden by route config
        const rateLimit = routeConfig.rateLimit ?? verification.key.rateLimit;
        
        // Rate limiting
        const rateLimiter = new RateLimiter();
        const rateLimitKey = `${verification.key.id}:${ip}`;
        const { allowed, remaining } = rateLimiter.check(rateLimitKey, rateLimit);

        if (!allowed) {
            await logRequestToAPI({
                ...baseLogData,
                statusCode: 429,
                error: "Rate limit exceeded",
                rateLimit,
                remaining,
                isError: true,
                routeId: routeConfig.id,
                serviceId: routeConfig.serviceId,
                apiKeyId: verification.key.id,
            });

            return NextResponse.json(
                { error: "Rate limit exceeded" },
                {
                    status: 429,
                    headers: {
                        "Retry-After": "60",
                        "X-RateLimit-Limit": rateLimit.toString(),
                        "X-RateLimit-Remaining": "0",
                    },
                }
            );
        }

        // Add verified key info to headers for downstream services
        const newHeaders = new Headers(request.headers);
        newHeaders.set("X-Api-Key-Id", verification.key.id);
        newHeaders.set("X-Api-Key-User", verification.key.user.id);
        newHeaders.set("X-Api-Key-Scopes", verification.key.scopes.join(","));
        newHeaders.set("X-RateLimit-Limit", rateLimit.toString());
        newHeaders.set("X-RateLimit-Remaining", remaining.toString());

        // For API gateway routes, we'll proxy the request
        if (pathname.startsWith("/api/gate/")) {
            try {
                const targetUrl = new URL(
                    pathname.replace(/^\/api\/gate/, routeConfig.targetUrl),
                    process.env.NEXT_PUBLIC_API_BASE_URL
                );

                // Add original query parameters
                if (request.nextUrl.search) {
                    targetUrl.search = request.nextUrl.search;
                }

                // Add service authentication headers if configured
                if (routeConfig.serviceMetadata?.authHeader && routeConfig.serviceMetadata?.apiKey) {
                    newHeaders.set(
                        routeConfig.serviceMetadata.authHeader,
                        `Bearer ${routeConfig.serviceMetadata.apiKey}`
                    );
                }

                // Proxy the request
                const proxyResponse = await fetch(targetUrl, {
                    method,
                    headers: newHeaders,
                    body: method !== "GET" && method !== "HEAD" ? request.body : undefined,
                    redirect: "manual",
                    signal: AbortSignal.timeout(5000),
                });

                await logRequestToAPI({
                    ...baseLogData,
                    statusCode: proxyResponse.status,
                    action: "Proxied request",
                    targetUrl: targetUrl.toString(),
                    proxyStatus: proxyResponse.status,
                    rateLimit,
                    remaining,
                    isError: proxyResponse.status >= 400,
                    routeId: routeConfig.id,
                    serviceId: routeConfig.serviceId,
                    apiKeyId: verification.key.id,
                });

                // Return the proxied response
                const responseHeaders = new Headers(proxyResponse.headers);
                responseHeaders.set("X-API-Gateway", "true");
                responseHeaders.set("X-RateLimit-Limit", rateLimit.toString());
                responseHeaders.set("X-RateLimit-Remaining", remaining.toString());

                return new NextResponse(proxyResponse.body, {
                    status: proxyResponse.status,
                    statusText: proxyResponse.statusText,
                    headers: responseHeaders,
                });
            } catch (error) {
                await logRequestToAPI({
                    ...baseLogData,
                    statusCode: 503,
                    error: "Proxy request failed",
                    details: error instanceof Error ? error.message : String(error),
                    isError: true,
                    routeId: routeConfig.id,
                    serviceId: routeConfig.serviceId,
                    apiKeyId: verification.key.id,
                });

                return NextResponse.json(
                    { error: "Service unavailable" },
                    { status: 503 }
                );
            }
        }

        // For non-gateway API routes that require API keys
        const response = NextResponse.next({
            request: {
                headers: newHeaders,
            },
        });

        return response;
    }

    // Handle non-API key routes (dashboard, etc.)
    if (
        pathname.startsWith("/dashboard") ||
        pathname.startsWith("/account") ||
        pathname.startsWith("/services") ||
        pathname.startsWith("/routes")
    ) {
        const sessionToken = getSessionCookie(request, {
            cookieName: "session_token",
            cookiePrefix: "better-auth",
            useSecureCookies: false,
        });

        if (!sessionToken) {
            return NextResponse.redirect(new URL("/sign-in", request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        "/api/:path*",
        "/dashboard/:path*",
        "/account/:path*",
        "/services/:path*",
        "/routes/:path*",
    ],
};
