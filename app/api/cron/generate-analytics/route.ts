// app/api/cron/generate-analytics/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Get all active routes
    const routes = await prisma.route.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
      },
    });

    // Generate summaries for each route
    for (const route of routes) {
      // Calculate date range (last month)
      const now = new Date();
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

      // Check if summary already exists for this period
      const existingSummary = await prisma.analyticsSummary.findFirst({
        where: {
          routeId: route.id,
          period: "MONTH",
          startTime: {
            lte: oneMonthAgo,
          },
          endTime: {
            gte: now,
          },
        },
      });

      if (!existingSummary) {
        // Trigger summary generation by calling our POST endpoint
        await fetch(`${process.env.NEXTAUTH_URL}/api/internal/analytics/summary`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.CRON_SECRET}`,
          },
          body: JSON.stringify({ routeId: route.id }),
        });
      }
    }

    return NextResponse.json({
      message: "Analytics summaries generation initiated",
      routesProcessed: routes.length,
    });
  } catch (error) {
    console.error("Error in analytics generation cron job:", error);
    return NextResponse.json(
      {
        message: "Error generating analytics summaries",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
