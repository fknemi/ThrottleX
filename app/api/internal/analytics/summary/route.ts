import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    // Authenticate the user
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const routeId = searchParams.get("routeId");

    // Calculate date range (expanded to broader range)
    const now = new Date();
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    // Fetch route IDs if not specified
    let routeIds: string[] = [];
    if (routeId) {
      // Verify route exists
      const route = await prisma.route.findUnique({
        where: { id: routeId },
        select: { id: true }
      });

      if (!route) {
        return NextResponse.json(
          { message: "Route not found" }, 
          { status: 404 }
        );
      }
      routeIds = [routeId];
    } else {
      // Fetch all route IDs with request logs
      const routes = await prisma.requestLog.groupBy({
        by: ['routeId'],
        _count: {
          routeId: true
        }
      });
      routeIds = routes.map(route => route.routeId);
    }

    // If no routes found
    if (routeIds.length === 0) {
      return NextResponse.json(
        { message: "No routes with analytics data found" }, 
        { status: 404 }
      );
    }

    // Fetch analytics summaries for the routes
    const summaries = await prisma.analyticsSummary.findMany({
      where: {
        routeId: { in: routeIds },
        period: "DAY",
        startTime: {
          gte: threeMonthsAgo,
        },
        endTime: {
          lte: now,
        }
      },
      orderBy: {
        startTime: "desc",
      },
      include: {
        route: {
          select: {
            path: true,
            method: true,
            service: {
              select: {
                name: true
              }
            }
          }
        }
      }
    });

    // If no summaries found
    if (summaries.length === 0) {
      // Try to fetch the most recent summary without date restrictions
      const fallbackSummaries = await prisma.analyticsSummary.findMany({
        where: {
          routeId: { in: routeIds },
          period: "MONTH"
        },
        orderBy: {
          startTime: "desc",
        },
        take: 5,
        include: {
          route: {
            select: {
              path: true,
              method: true,
              service: {
                select: {
                  name: true
                }
              }
            }
          }
        }
      });

      return NextResponse.json({
        message: "No recent analytics summaries found. Showing oldest available.",
        data: fallbackSummaries,
      });
    }

    return NextResponse.json({
      message: "Analytics summaries retrieved successfully",
      data: summaries,
    });
  } catch (error) {
    console.error("Error retrieving analytics summary:", error);
    return NextResponse.json(
      {
        message: "Error retrieving analytics summary",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
