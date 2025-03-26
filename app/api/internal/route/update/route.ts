import { NextRequest, NextResponse } from "next/server";
import { PrismaClient, HttpMethod } from "@prisma/client";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

const prisma = new PrismaClient();

export async function PUT(req: NextRequest) {
  try {
    // Authenticate the user
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const body = await req.json();

    // Validate required fields
    const { routeId, ...updateData } = body;

    if (!routeId) {
      return NextResponse.json(
        {
          message: "Missing required field: routeId",
        },
        { status: 400 },
      );
    }

    // Get the existing route
    const existingRoute = await prisma.route.findUnique({
      where: { id: routeId },
      include: {
        service: {
          select: {
            ownerId: true,
          },
        },
      },
    });

    if (!existingRoute) {
      return NextResponse.json({ message: "Route not found" }, { status: 404 });
    }

    // Check permissions
    if (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") {
      if (existingRoute.service.ownerId !== session.user.id) {
        return NextResponse.json(
          {
            message: "You do not have permission to update this route",
          },
          { status: 403 },
        );
      }
    }

    // Validate HTTP method if provided
    if (updateData.method) {
      const validHttpMethods = [
        "GET",
        "POST",
        "PUT",
        "PATCH",
        "DELETE",
        "HEAD",
        "OPTIONS",
      ];
      if (!validHttpMethods.includes(updateData.method.toUpperCase())) {
        return NextResponse.json(
          {
            message: "Invalid HTTP method",
          },
          { status: 400 },
        );
      }
      updateData.method = updateData.method.toUpperCase();
    }

    // Check for route conflicts if path or method is being updated
    if (updateData.path || updateData.method) {
      const path = updateData.path || existingRoute.path;
      const method = (updateData.method || existingRoute.method) as HttpMethod;

      const conflictingRoute = await prisma.route.findFirst({
        where: {
          serviceId: existingRoute.serviceId,
          path,
          method,
          NOT: {
            id: routeId,
          },
        },
      });

      if (conflictingRoute) {
        return NextResponse.json(
          {
            message:
              "A route with this path and method already exists for the service",
          },
          { status: 409 },
        );
      }
    }

    // Prepare tags and middlewares
    if (updateData.tags) {
      updateData.tags = updateData.tags.filter(
        (tag: string) => tag && tag.trim() !== "",
      );
    }
    if (updateData.middlewares) {
      updateData.middlewares = JSON.parse(
        JSON.stringify(updateData.middlewares),
      );
    }

    // Update the route
    const updatedRoute = await prisma.route.update({
      where: { id: routeId },
      data: {
        ...updateData,
        updatedBy: session.user.id,
        updatedAt: new Date(),
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
    return NextResponse.json(
      {
        message: "Route updated successfully",
        data: updatedRoute,
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("Error updating route:", error);

    return NextResponse.json(
      {
        message: "Internal server error",
        error: error.message,
      },
      { status: 500 },
    );
  } finally {
    await prisma.$disconnect();
  }
}
