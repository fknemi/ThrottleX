// app/api/internal/services/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import {prisma} from "@/lib/prisma";


export async function GET(
  req: NextRequest,
) {
  try {

      const id = req.nextUrl.searchParams.get('id')
if(!id){
return NextResponse.json({ error: "Service not found" }, { status: 404 });

}
    const service = await prisma.backendService.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            routes: true,
            apiKeys: true,
          },
        },
      },
    });

    if (!service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    return NextResponse.json(service);
  } catch (error) {
    console.error("Error fetching service:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
