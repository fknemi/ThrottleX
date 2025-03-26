import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

const prisma = new PrismaClient();

export async function DELETE(req: NextRequest) {
  try {
    // Authenticate the user
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const { routeId } = await req.json();

    if (!routeId) {
      return NextResponse.json(
        { message: "Route ID is required" },
        { status: 400 }
      );
    }

    // Check if the route exists and get associated service info
    const route = await prisma.route.findUnique({
      where: { id: routeId },
      include: {
        service: {
          select: {
            ownerId: true
          }
        }
      }
    });

    if (!route) {
      return NextResponse.json(
        { message: "Route not found" },
        { status: 404 }
      );
    }

    // For non-admin users, verify they own the associated service
    if (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") {
      if (route.service.ownerId !== session.user.id) {
        return NextResponse.json(
          { message: "You do not have permission to delete this route" },
          { status: 403 }
        );
      }
    }

    // Delete the route and its associated rate limits in a transaction
    await prisma.$transaction([
      // Delete associated rate limits first (foreign key constraint)
      prisma.rateLimit.deleteMany({
        where: { routeId }
      }),
      // Then delete the route
      prisma.route.delete({
        where: { id: routeId }
      })
    ]);

    return NextResponse.json(
      { message: "Route deleted successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error deleting route:", error);

    return NextResponse.json(
      {
        message: "Internal server error",
        error: error.message,
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
