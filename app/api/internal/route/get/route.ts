import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    // 1. Authenticate the user
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // 2. Get query parameters
    const { searchParams } = new URL(req.url);
    const serviceId = searchParams.get("serviceId");

    // 3. Base where clause - start with serviceId if provided
    const where: any = serviceId ? { serviceId } : {};

    // 4. For non-admin users, add ownership filter
    if (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") {
      // If serviceId was provided, verify ownership
      if (serviceId) {
        const service = await prisma.backendService.findUnique({
          where: { id: serviceId },
          select: { ownerId: true },
        });

        if (!service || service.ownerId !== session.user.id) {
          return NextResponse.json({ message: "Forbidden" }, { status: 403 });
        }
      } else {
        // If no serviceId, filter by owned services
        where.service = { ownerId: session.user.id };
      }
    }

    // 5. Add other filters if needed
    const method = searchParams.get("method");
    if (method) {
      where.method = method.toUpperCase();
    }

    const isActive = searchParams.get("isActive");
    if (isActive !== null) {
      where.isActive = isActive === "true";
    }

    // 6. Get pagination parameters
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    // 7. Fetch data
    const [total, routes] = await Promise.all([
      prisma.route.count({ where }),
      prisma.route.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          service: {
            select: {
              id: true,
              name: true,
              baseUrl: true,
              status: true,
              owner: { select: { id: true, name: true } },
            },
          },
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
    ]);

    // 8. Return response
    return NextResponse.json({
      data: routes,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    });
  } catch (error: any) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  } finally {
    await prisma.$disconnect();
  }
}
