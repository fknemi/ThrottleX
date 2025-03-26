import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    // Get the current user's session
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Find the user in the database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Get all services created by this user with route counts
    const services = await prisma.backendService.findMany({
      where: { ownerId: user.id },
      select: {
        id: true,
        name: true,
        description: true,
        baseUrl: true,
        status: true,
        createdAt: true,
        tags: true,
        _count: {
          select: {
            routes: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Transform the data to include routeCount directly in the response
    const transformedServices = services.map(service => ({
      ...service,
      routeCount: service._count.routes,
      // Remove the _count field from the response
      _count: undefined,
    }));

    return NextResponse.json(transformedServices, { status: 200 });
  } catch (error) {
    console.error("Error fetching services:", error);
    return NextResponse.json(
      {
        message: "Error fetching services",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  } finally {
    await prisma.$disconnect();
  }
}
