import { NextRequest, NextResponse } from "next/server";
import { PrismaClient, HttpMethod } from "@prisma/client";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
    try {
        // Authenticate the user
        const session = await auth.api.getSession({
            headers: await headers()
        });
        
        
        if (!session) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        // Parse request body
        const body = await req.json();
        console.log(body)
        // Validate required fields and method
        const {
            path,
            method,
            targetUrl,
            serviceId,
            description,
            isActive = true,
            rateLimit,
            cacheTtl,
            tags = [],
            middlewares,
        } = body;

        // Validate required fields and method
        if (!path || !method || !targetUrl || !serviceId) {
            return NextResponse.json({
                message: "Missing required fields: path, method, targetUrl, serviceId",
            }, { status: 400 });
        }

        // Validate HTTP method
        const validHttpMethods = [
            "GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"
        ];
        if (!validHttpMethods.includes(method.toUpperCase())) {
            return NextResponse.json({
                message: "Invalid HTTP method",
            }, { status: 400 });
        }

        // Check if the service exists and user has permission
        const service = await prisma.backendService.findUnique({
            where: { id: serviceId },
            select: { ownerId: true },
        });

        if (!service) {
            return NextResponse.json({ message: "Service not found" }, { status: 404 });
        }

        // For non-admin users, verify they own the service
        if (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") {
            if (service.ownerId !== session.user.id) {
                return NextResponse.json({
                    message: "You do not have permission to add routes to this service",
                }, { status: 403 });
            }
        }

        // Check if route already exists for this service
        const existingRoute = await prisma.route.findFirst({
            where: {
                serviceId,
                path,
                method: method.toUpperCase() as HttpMethod,
            },
        });

        if (existingRoute) {
            return NextResponse.json({
                message: "A route with this path and method already exists for the service",
            }, { status: 409 });
        }

        // Prepare tags and validate middleware
        const sanitizedTags = tags.filter((tag: string) => tag && tag.trim() !== '');
        const sanitizedMiddlewares = middlewares 
            ? JSON.parse(JSON.stringify(middlewares)) 
            : undefined;

        // Create the new route
        const newRoute = await prisma.route.create({
            data: {
                path,
                method: method.toUpperCase() as HttpMethod,
                targetUrl,
                serviceId,
                description: description || undefined,
                isActive,
                rateLimit: rateLimit || undefined,
                cacheTtl: cacheTtl || undefined,
                tags: sanitizedTags,
                middlewares: sanitizedMiddlewares,
                createdBy: session.user.id,
            },
            include: {
                service: {
                    select: {
                        name: true,
                        baseUrl: true,
                    },
                },
                creator: {
                    select: {
                        name: true,
                        email: true,
                    },
                },
            },
        });

        // Return success response
        return NextResponse.json({
            message: "Route created successfully",
            data: newRoute,
        }, { status: 201 });

    } catch (error: any) {
        console.error("Error creating route:", error);
        
        return NextResponse.json({
            message: "Internal server error",
            error: error.message,
        }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}
