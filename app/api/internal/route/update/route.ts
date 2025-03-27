import { NextRequest, NextResponse } from "next/server";
import { PrismaClient, HttpMethod } from "@prisma/client";
import { PlusCircle, Search, Filter, Loader2, Trash, Pencil } from "lucide-react";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

const prisma = new PrismaClient();

export async function PUT(req: NextRequest) {
  try {
    // Authentication
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, {status: 401});
    }




    const body = await req.json();
    const { routeId, path, method, targetUrl, isActive, tags } = body;

    // Validation
    if (!routeId) {
      return NextResponse.json(
        { message: "Missing routeId" },
        { status: 400 }
      );
    }

    // Check existing route
    const existingRoute = await prisma.route.findUnique({
      where: { id: routeId },
      include: { service: { select: { ownerId: true } } }
    });

    if (!existingRoute) {
      return NextResponse.json({ message: "Route not found" }, { status: 404 });
    }

    // Permission check
    if (!["ADMIN", "SUPER_ADMIN"].includes(session.user.role!) && 
        existingRoute.service.ownerId !== session.user.id) {
      return NextResponse.json(
        { message: "Forbidden" },
        { status: 403 }
      );
    }

    // Prepare update data
    const updateData = {
      path,
      method: method?.toUpperCase(),
      targetUrl,
      isActive,
      tags: tags?.filter((t: string) => t?.trim()),
      updatedAt: new Date()
      // Only include updatedBy if your schema supports it
      // updatedBy: session.user.id
    };

    // Update route
    const updatedRoute = await prisma.route.update({
      where: { id: routeId },
      data: updateData,
      include: {
        service: { select: { name: true } },
        creator: { select: { name: true } }
      }
    });

    return NextResponse.json({
      message: "Route updated",
      data: updatedRoute
    });

  } catch (error: any) {
    console.error("Update error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
