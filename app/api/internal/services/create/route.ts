// pages/api/services/create.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
import { auth, Session } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
const prisma = new PrismaClient();

export async function POST(req: NextApiRequest) {
    if (req.method !== "POST") {
        return NextResponse.json(
            { message: "Method not allowed" },
            { status: 405 }
        );
    }

    try {
        // Get the current user's session
        //
        //
        //
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 }
            );
        }

        if (!session) {
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 }
            );
        }

        // Find the user in the database
        const user = await prisma.user.findUnique({
            where: { email: session.user?.email! },
        });

        if (!user) {
            return NextResponse.json(
                { message: "User not found" },
                { status: 404 }
            );
        }

        // Destructure service details from request body
        const {
            name,
            description,
            baseUrl,
            healthCheckUrl,
            tags,
            rateLimit,
            metadata,
        } = req.body;

        // Validate required fields
        if (!name || !baseUrl) {
            return NextResponse.json(
                { message: "Name and Base URL are required" },
                { status: 400 }
            );
        }

        // Create the backend service
        const newService = await prisma.backendService.create({
            data: {
                name,
                description,
                baseUrl,
                healthCheckUrl,
                ownerId: user.id,
                tags: tags || [],
                rateLimit,
                metadata: metadata ? JSON.parse(metadata) : undefined,
                status: "HEALTHY", // Default status
            },
        });

        NextResponse.json(newService, { status: 401 });
    } catch (error) {
        console.error("Error creating backend service:", error);

        // Check for unique constraint violation (duplicate service name)
        if (
            error instanceof Error &&
            error.message.includes("Unique constraint failed")
        ) {
            return NextResponse.json(
                { message: "A service with this name already exists" },
                { status: 409 }
            );
        }

        NextResponse.json(
            {
                message: "Error creating backend service",
                error: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}
