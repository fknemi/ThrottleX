import { NextRequest, NextResponse } from "next/server";
import { HttpMethod } from "@prisma/client";
import { prisma } from "@/lib/prisma";

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
  
  try {
    const route = await prisma.route.findFirst({
      where: {
        path: `/api/gate/${path}`,
        method: method as HttpMethod,
        isActive: true,
      },
    });

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
