import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

const prisma = new PrismaClient();

export async function PATCH(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...updateData } = body;

    // Verify user has permission to update this service
    const existingService = await prisma.backendService.findUnique({
      where: { id },
      select: { ownerId: true },
    });

    if (!existingService) {
      return NextResponse.json(
        { message: "Service not found" },
        { status: 404 },
      );
    }

    if (
      existingService.ownerId !== session.user.id &&
      session.user.role !== "ADMIN"
    ) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const updatedService = await prisma.backendService.update({
      where: { id },
      data: {
        ...updateData,
        // Prevent updating certain fields
        id: undefined,
        ownerId: undefined,
        createdAt: undefined,
        updatedAt: undefined,
      },
    });

    return NextResponse.json({
      message: "Service updated successfully",
      data: updatedService,
    });
  } catch (error: any) {
    console.error("Error updating service:", error);
    return NextResponse.json(
      { message: "Internal server error", error: error.message },
      { status: 500 },
    );
  } finally {
    await prisma.$disconnect();
  }
}
