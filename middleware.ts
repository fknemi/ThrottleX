import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

// Enhanced logging utility
async function logRequestToAPI(logData: any) {
    // try {
    //     const logEndpoint = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/internal/route/update/logs`;
    //     await fetch(logEndpoint, {
    //         method: "POST",
    //         headers: {
    //             "Content-Type": "application/json",
    //             "Internal-Auth-Token": process.env.INTERNAL_API_TOKEN || "",
    //         },
    //         body: JSON.stringify({
    //             ...logData,
    //             timestamp: new Date().toISOString(),
    //         }),
    //     });
    // } catch (logError) {
    //     console.error("Failed to log request:", logError);
    // }
}

class RateLimiter {
    private tracker: Map<string, { count: number; resetTime: number }>;
    private windowMs: number;
    private maxRequests: number;
    private message: string;

    constructor(config: {
        windowMs: number;
        maxRequests: number;
        message?: string;
    }) {
        this.tracker = new Map();
        this.windowMs = config.windowMs;
        this.maxRequests = config.maxRequests;
        this.message =
            config.message || "Too many requests, please try again later.";
    }

    check(key: string): {
        allowed: boolean;
        remaining: number;
        resetTime: number;
        total: number;
    } {
        const now = Date.now();
        const entry = this.tracker.get(key);

        if (!entry || entry.resetTime < now) {
            const newEntry = {
                count: 1,
                resetTime: now + this.windowMs,
            };
            this.tracker.set(key, newEntry);
            return {
                allowed: true,
                remaining: this.maxRequests - 1,
                resetTime: newEntry.resetTime,
                total: this.maxRequests,
            };
        }

        if (entry.count >= this.maxRequests) {
            return {
                allowed: false,
                remaining: 0,
                resetTime: entry.resetTime,
                total: this.maxRequests,
            };
        }

        entry.count++;
        this.tracker.set(key, entry);

        return {
            allowed: true,
            remaining: Math.max(0, this.maxRequests - entry.count),
            resetTime: entry.resetTime,
            total: this.maxRequests,
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
    rateLimit?: {
        windowMs: number;
        max: number;
    };
    cacheTtl?: number;
    serviceMetadata?: any;
    id: string;
    serviceId: string;
    status: number;
}

class RouteConfigService {
    private static cache: Map<string, RouteConfig> = new Map();
    private static lastFetch: number = 0;

    static async getRouteConfig(
        pathname: string,
        method: string
    ): Promise<RouteConfig | null> {
        // Only check route config for API gateway routes
        if (!pathname.startsWith("/api/gate/")) {
            return null;
        }

        const cacheKey = `${method}:${pathname}`;
        const now = Date.now();

        // Use cached config if available and not expired (30s cache)
        if (this.cache.has(cacheKey) && now - this.lastFetch < 30000) {
            return this.cache.get(cacheKey) || null;
        }

        try {
            const cleanPath = decodeURIComponent(
                pathname.replace(/^\/api\/gate/, "")
            );
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/routes/config?path=${encodeURIComponent(cleanPath)}&method=${method}`,
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
            this.cache.set(cacheKey, config);
            this.lastFetch = now;
            return config;
        } catch (error) {
            console.error("Failed to fetch route config:", error);
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
            rateLimit?: {
                windowMs: number;
                max: number;
            };
            expiresAt: Date | null;
            createdAt: Date;
            service?: { id: string; name: string };
            user: { id: string; name: string; email: string };
        };
        error?: string;
    }> {
        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/keys/verify`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${apiKey}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            const data = await response.json();

            if (!response.ok) {
                return {
                    valid: false,
                    error: data.error || "API key verification failed",
                };
            }
            console.log(data);
            return { valid: true, key: data.keyDetails };
        } catch (error) {
            console.error("API key verification error:", error);
            return {
                valid: false,
                error: "Internal server error during API key verification",
            };
        }
    }
}

// Global rate limiter for API gateway routes only
const apiGatewayRateLimiter = new RateLimiter({
    windowMs: 60000, // 1 minute window
    maxRequests: 1000, // 1000 requests per IP per minute
    message: "Too many requests to the API gateway",
});

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const method = request.method;
    const ip =
        request.ip || request.headers.get("x-forwarded-for") || "unknown";
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

    // Only check route configuration for API gateway routes
    if (pathname.startsWith("/api/gate/")) {
        const routeConfig = await RouteConfigService.getRouteConfig(
            pathname,
            method
        );

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

        // API Key middleware for gateway routes
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
        console.log(verification);
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
            const hasRequiredScopes = requiredScopes.every((scope) =>
                verification.key!.scopes.includes(scope)
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
                    actualScopes: verification.key!.scopes,
                });
                return NextResponse.json(
                    { error: "Insufficient permissions" },
                    { status: 403 }
                );
            }
        }

        // Add verified key info to headers for downstream services
        const newHeaders = new Headers(request.headers);
        newHeaders.set("X-Api-Key-Id", verification.key!.id);
        newHeaders.set("X-Api-Key-User", verification.key!.user.id);
        newHeaders.set("X-Api-Key-Scopes", verification.key!.scopes.join(","));

        // Apply global rate limiting
        const globalLimit = apiGatewayRateLimiter.check(ip);
        if (!globalLimit.allowed) {
            await logRequestToAPI({
                ...baseLogData,
                statusCode: 429,
                error: "API gateway rate limit exceeded",
                isError: true,
                routeId: routeConfig.id,
                serviceId: routeConfig.serviceId,
            });

            return NextResponse.json(
                { error: apiGatewayRateLimiter.message },
                {
                    status: 429,
                    headers: {
                        "Retry-After": "60",
                        "X-RateLimit-Limit": globalLimit.total.toString(),
                        "X-RateLimit-Remaining": "0",
                        "X-RateLimit-Reset": globalLimit.resetTime.toString(),
                    },
                }
            );
        }

        // Apply route-specific or API key rate limiting
        const rateLimitConfig =
            routeConfig.rateLimit || verification.key!.rateLimit;
        if (rateLimitConfig) {
            const routeRateLimiter = new RateLimiter({
                windowMs: rateLimitConfig.windowMs,
                maxRequests: rateLimitConfig.max,
            });

            const rateLimitKey = `${verification.key!.id}:${ip}`;
            const { allowed, remaining, resetTime, total } =
                routeRateLimiter.check(rateLimitKey);

            if (!allowed) {
                await logRequestToAPI({
                    ...baseLogData,
                    statusCode: 429,
                    error: "API rate limit exceeded",
                    isError: true,
                    routeId: routeConfig.id,
                    serviceId: routeConfig.serviceId,
                    apiKeyId: verification.key!.id,
                });

                return NextResponse.json(
                    { error: "API rate limit exceeded" },
                    {
                        status: 429,
                        headers: {
                            "Retry-After": "60",
                            "X-RateLimit-Limit": total.toString(),
                            "X-RateLimit-Remaining": "0",
                            "X-RateLimit-Reset": resetTime.toString(),
                        },
                    }
                );
            }

            // Add rate limit headers
            // newHeaders.set("X-RateLimit-Limit", total.toString());
            // newHeaders.set("X-RateLimit-Remaining", remaining.toString());
            // newHeaders.set("X-RateLimit-Reset", resetTime.toString());
        }

        // Proxy the request to the target service
        try {
            const targetUrl = new URL(routeConfig.targetUrl);

            // Preserve query parameters
            if (request.nextUrl.search) {
                targetUrl.search = request.nextUrl.search;
            }

            // Add service authentication headers if configured
            if (
                routeConfig.serviceMetadata?.authHeader &&
                routeConfig.serviceMetadata?.apiKey
            ) {
                newHeaders.set(
                    routeConfig.serviceMetadata.authHeader,
                    `Bearer ${routeConfig.serviceMetadata.apiKey}`
                );
            }

            // Proxy the request
            const proxyResponse = await fetch(targetUrl, {
                method,
                headers: !newHeaders.keys() ? request.headers : {},
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
                isError: proxyResponse.status >= 400,
                routeId: routeConfig.id,
                serviceId: routeConfig.serviceId,
                apiKeyId: verification.key!.id,
            });

            // Return the proxied response
            const responseHeaders = new Headers(proxyResponse.headers);
            responseHeaders.set("X-API-Gateway", "true");

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
                apiKeyId: verification.key!.id,
            });

            return NextResponse.json(
                { error: "Service unavailable" },
                { status: 503 }
            );
        }
    }

    // Handle dashboard and protected pages
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

    // For all other routes (including /dashboard), just continue
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
