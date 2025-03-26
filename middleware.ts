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
    middlewares?: any;
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
            const cleanPath = decodeURIComponent(
                pathname.replace(/^\/api/, "")
            );
            const response = await fetch(
                `https://127.0.0.1:3000/api/routes/config?path=${encodeURIComponent(cleanPath)}&method=${method}`,
                    {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        "Internal-Auth-Token":
                            process.env.INTERNAL_API_TOKEN || "",
                    },
                    cache: "no-store",
                }
            );

            if (!response.ok) {
                return null;
            }

            const config = await response.json();

            return config;
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
}

export async function middleware(request: NextRequest) {
    const { pathname, search } = request.nextUrl;
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

    // Process API routes
    if (pathname.startsWith("/api/")) {
        try {
            const sessionCookie = getSessionCookie(request, {
                cookieName: "session_token",
                cookiePrefix: "better-auth",
                useSecureCookies: false,
            });

            if (!sessionCookie) {
                if (
                    pathname.startsWith("/dashboard") ||
                    pathname.startsWith("/api/get/user/") ||
                pathname.startsWith("/services") ||
            pathname.startsWith("/routes") ||
        pathname.startsWith("/route") ||
    pathname.startsWith("/account")
                ) {
                    return NextResponse.redirect(
                        new URL("/sign-in", request.url)
                    );
                }

                return NextResponse.next();
            }

            const routeConfig = await RouteConfigService.getRouteConfig(
                pathname,
                method
            );

            if (!routeConfig || !routeConfig.targetUrl) {
                return NextResponse.json(
                    { error: "Route not configured" },
                    { status: 404 }
                );
            }

            // Authentication middleware
            const middlewares = routeConfig.middlewares;
            if (middlewares?.auth) {
                const isAuthenticated =
                    await AuthService.validateSession(request);
                if (!isAuthenticated) {
                    return NextResponse.redirect(
                        new URL("/sign-in", request.url)
                    );
                }
            }

            // Rate limiting
            const rateLimiter = new RateLimiter();
            const rateLimitKey = ip;
            const rateLimit = routeConfig.rateLimit ?? 100;
            const { allowed, remaining } = rateLimiter.check(
                rateLimitKey,
                rateLimit
            );

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

            // Prepare target URL
            let targetUrl;
            try {
                targetUrl = new URL(routeConfig.targetUrl);
            } catch (urlError) {
                await logRequestToAPI({
                    ...baseLogData,
                    statusCode: 500,
                    error: "Invalid target URL",
                    details:
                        urlError instanceof Error
                            ? urlError.message
                            : String(urlError),
                            isError: true,
                            routeId: routeConfig.id,
                            serviceId: routeConfig.serviceId,
                });

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
                    "Access-Control-Allow-Origin",
                    middlewares.cors.origin ?? "*"
                );
            }

            // Proxy the request with timeout
            let proxyResponse;
            try {
                proxyResponse = await fetch(targetUrl, {
                    method,
                    headers: proxyHeaders.keys().length > 0 ? proxyHeaders : {},
                    body:
                        method !== "GET" && method !== "HEAD"
                            ? request.body
                            : undefined,
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
                });
            } catch (fetchError) {
                await logRequestToAPI({
                    ...baseLogData,
                    statusCode: 503,
                    error: "Proxy request failed",
                    details:
                        fetchError instanceof Error
                            ? fetchError.message
                            : String(fetchError),
                            targetUrl: targetUrl.toString(),
                            isError: true,
                            routeId: routeConfig.id,
                            serviceId: routeConfig.serviceId,
                });

                return NextResponse.json(
                    { error: "Service unavailable" },
                    { status: 503 }
                );
            }

            // Response handling
            const responseHeaders = new Headers(proxyResponse.headers);
            responseHeaders.set("X-API-Gateway", "true");
            responseHeaders.set("X-RateLimit-Limit", rateLimit.toString());
            responseHeaders.set("X-RateLimit-Remaining", remaining.toString());

            // Caching
            if (routeConfig.cacheTtl && routeConfig.cacheTtl > 0) {
                responseHeaders.set(
                    "Cache-Control",
                    `public, max-age=${routeConfig.cacheTtl}`
                );
            }

            return new NextResponse(proxyResponse.body, {
                status: proxyResponse.status,
                statusText: proxyResponse.statusText,
                headers: responseHeaders,
            });
        } catch (error) {
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
        "/api/:path*",
        "/dashboard/:path*",
        "/route/:path*",
        "/services/:path*",
        "/service/:path*",
        "/api/((?!internal|auth|routes/update/logs).*)", // Exclude logging endpoint],
    ],
};
