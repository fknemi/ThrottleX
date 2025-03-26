// pages/api/internal/services/create.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    // Get the current user's session
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Parse the request body
    const body = await req.json();

    // Destructure service details from request body
    const {
      name,
      description = "",
      baseUrl,
      healthCheckUrl = "",
      tags = [],
      rateLimit = 1000,
      metadata = {},
    } = body;

    // Validate required fields
    if (!name || !baseUrl) {
      return NextResponse.json(
        { message: "Name and Base URL are required" },
        { status: 400 },
      );
    }

    // Find the user in the database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Create the backend service
    const newService = await prisma.backendService.create({
      data: {
        name,
        description,
        baseUrl,
        healthCheckUrl,
        ownerId: user.id,
        tags: Array.isArray(tags) ? tags : [],
        rateLimit: Number(rateLimit) || 1000,
        metadata,
        status: "HEALTHY", // Default status
      },
    });

    return NextResponse.json(newService, { status: 201 });
  } catch (error) {
    console.error("Error creating backend service:", error);

    // Check for unique constraint violation (duplicate service name)
    if (
      error instanceof Error &&
      error.message.includes("Unique constraint failed")
    ) {
      return NextResponse.json(
        { message: "A service with this name already exists" },
        { status: 409 },
      );
    }

    return NextResponse.json(
      {
        message: "Error creating backend service",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  } finally {
    await prisma.$disconnect();
  }
}
