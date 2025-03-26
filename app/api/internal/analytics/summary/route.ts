// app/api/internal/analytics/summary/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    // Authenticate the user
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { routeId } = await req.json();

    // Calculate date range (last month)
    const now = new Date();
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    // Fetch route IDs if not specified
    const routes = routeId 
      ? [routeId] 
      : await prisma.requestLog.groupBy({
          by: ['routeId'],
          _count: {
            routeId: true
          }
        });

    const summaries = [];

    // Process each route
    for (const route of routes) {
      const currentRouteId = routeId || route.routeId;

      // Get request logs for the route in the last month
      const logs = await prisma.requestLog.findMany({
        where: {
          routeId: currentRouteId,
          timestamp: {
            gte: oneMonthAgo,
            lte: now,
          },
        },
      });

      if (logs.length === 0) {
        continue; // Skip routes with no logs
      }

      // Calculate summary metrics
      const requestCount = logs.length;
      const successCount = logs.filter(log => log.statusCode >= 200 && log.statusCode < 300).length;
      const errorCount = logs.filter(log => log.statusCode >= 400).length;
      const responseTimes = logs.map(log => log.responseTime);
      const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      const maxResponseTime = Math.max(...responseTimes);
      const minResponseTime = Math.min(...responseTimes);

      // Group status codes
      const statusCodes: Record<string, number> = {};
      logs.forEach(log => {
        statusCodes[log.statusCode] = (statusCodes[log.statusCode] || 0) + 1;
      });

      // Group user agents (top 5)
      const userAgents: Record<string, number> = {};
      logs.forEach(log => {
        if (log.userAgent) {
          userAgents[log.userAgent] = (userAgents[log.userAgent] || 0) + 1;
        }
      });
      const topUserAgents = Object.entries(userAgents)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .reduce((obj, [key, val]) => ({ ...obj, [key]: val }), {});

      // Group IP addresses (top 5)
      const ipAddresses: Record<string, number> = {};
      logs.forEach(log => {
        if (log.ipAddress) {
          ipAddresses[log.ipAddress] = (ipAddresses[log.ipAddress] || 0) + 1;
        }
      });
      const topIpAddresses = Object.entries(ipAddresses)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .reduce((obj, [key, val]) => ({ ...obj, [key]: val }), {});

      // Group API keys (top 5)
      const apiKeys: Record<string, number> = {};
      logs.forEach(log => {
        if (log.apiKeyId) {
          apiKeys[log.apiKeyId] = (apiKeys[log.apiKeyId] || 0) + 1;
        }
      });
      const topApiKeys = Object.entries(apiKeys)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .reduce((obj, [key, val]) => ({ ...obj, [key]: val }), {});

      // Create or update the analytics summary
      const analyticsSummary = await prisma.analyticsSummary.upsert({
        where: {
          routeId_period_startTime: {
            routeId: currentRouteId,
            period: "MONTH",
            startTime: oneMonthAgo,
          },
        },
        create: {
          routeId: currentRouteId,
          period: "MONTH",
          startTime: oneMonthAgo,
          endTime: now,
          requestCount,
          successCount,
          errorCount,
          avgResponseTime,
          maxResponseTime,
          minResponseTime,
          statusCodes,
          userAgents: topUserAgents,
          ipAddresses: topIpAddresses,
          apiKeys: topApiKeys,
        },
        update: {
          endTime: now,
          requestCount,
          successCount,
          errorCount,
          avgResponseTime,
          maxResponseTime,
          minResponseTime,
          statusCodes,
          userAgents: topUserAgents,
          ipAddresses: topIpAddresses,
          apiKeys: topApiKeys,
        },
      });

      summaries.push(analyticsSummary);
    }

    return NextResponse.json({
      message: "Analytics summaries generated successfully",
      data: summaries,
    });
  } catch (error) {
    console.error("Error generating analytics summary:", error);
    return NextResponse.json(
      {
        message: "Error generating analytics summary",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

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

    // Calculate date range (last month)
    const now = new Date();
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    // If no routeId is provided, fetch summaries for all routes
    const whereCondition = routeId 
      ? {
          routeId,
          period: "MONTH",
          startTime: {
            lte: oneMonthAgo,
          },
          endTime: {
            gte: now,
          },
        }
      : {
          period: "MONTH",
          startTime: {
            lte: oneMonthAgo,
          },
          endTime: {
            gte: now,
          },
        };

    // Get the most recent monthly summaries
    const summaries = await prisma.analyticsSummary.findMany({
      where: whereCondition,
      orderBy: {
        startTime: "desc",
      },
    });

    if (summaries.length === 0) {
      return NextResponse.json(
        { message: "No analytics summaries found for this period" },
        { status: 404 }
      );
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
