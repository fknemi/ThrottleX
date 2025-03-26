import { PrismaClient } from "@prisma/client";
import { NextApiRequest, NextApiResponse } from "next";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
const prisma = new PrismaClient();

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    // Check request method
    if (req.method !== "POST") {
        return res.status(405).json({ message: "Method not allowed" });
    }

    // Authenticate the user
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    try {
        // Validate request body
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
        } = req.body;

        if (!path || !method || !targetUrl || !serviceId) {
            return res.status(400).json({
                message:
                    "Missing required fields: path, method, targetUrl, serviceId",
            });
        }

        // Check if the service exists and user has permission
        const service = await prisma.backendService.findUnique({
            where: { id: serviceId },
            select: { ownerId: true },
        });

        if (!service) {
            return res.status(404).json({ message: "Service not found" });
        }

        // For non-admin users, verify they own the service
        if (
            session.user.role !== "ADMIN" &&
            session.user.role !== "SUPER_ADMIN"
        ) {
            if (service.ownerId !== session.user.id) {
                return res.status(403).json({
                    message:
                        "You do not have permission to add routes to this service",
                });
            }
        }

        // Check if route already exists for this service
        const existingRoute = await prisma.route.findFirst({
            where: {
                serviceId,
                path,
                method,
            },
        });

        if (existingRoute) {
            return res.status(409).json({
                message:
                    "A route with this path and method already exists for the service",
            });
        }

        // Create the new route
        const newRoute = await prisma.route.create({
            data: {
                path,
                method,
                targetUrl,
                serviceId,
                description,
                isActive,
                rateLimit,
                cacheTtl,
                tags,
                middlewares,
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

        // Return the created route
        return res.status(201).json({
            message: "Route created successfully",
            data: newRoute,
        });
    } catch (error: any) {
        console.error("Error creating route:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message,
        });
    } finally {
        await prisma.$disconnect();
    }
}
