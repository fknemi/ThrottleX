import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { HttpMethod } from "@prisma/client";
// Singleton Prisma client to avoid multiple instances
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ["query"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export async function GET(request: NextRequest) {
  // Validate internal request
  const internalToken = request.headers.get("Internal-Auth-Token");
  if (internalToken !== process.env.INTERNAL_API_TOKEN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Extract path and method from query params
  const { searchParams } = new URL(request.url);
  const path = searchParams.get("path")?.replace(/^\//, "") || "";
  const method = searchParams.get("method") || "";
  console.log("HERE" + path + "------" + method);
  try {
    console.log("Searching for route with:", {
      path: path,
      method: method,
      fullPath: searchParams.get("path"),
    });

    const route = await prisma.route.findFirst({
      where: {
        path: `/api/${path}`,
        method: method as HttpMethod,
        isActive: true,
      },
    });

    console.log("Found route:", route);

    if (!route) {
      return NextResponse.json({ error: "Route not found" }, { status: 404 });
    }
    return NextResponse.json({
      targetUrl: route.targetUrl,
      middlewares: route.middlewares ?? undefined,
      rateLimit: route.rateLimit ?? 100,
      cacheTtl: route.cacheTtl ?? 100,
      id: route.id,
      serviceId: route.serviceId,
        
    });
  } catch (error) {
    console.error("Route configuration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
