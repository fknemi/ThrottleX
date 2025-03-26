import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// Initialize Prisma client outside the handler
const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    // Parse request body first to handle errors early
    let body;
    try {
      body = await req.json();
    } catch (parseError) {
        console.log("Invalid")
      return NextResponse.json(
        { message: "Invalid JSON payload" },
        { status: 400 }
      );
    }

    // Validate required fields
    const requiredFields = ['routeId', 'serviceId', 'method', 'path', 'statusCode'];
    const missingFields = requiredFields.filter(field => !body[field]);
    
    if (missingFields.length > 0) {
        console.log(missingFields.join(', '))
      return NextResponse.json(
        {
          message: `Missing required fields: ${missingFields.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Destructure with defaults
    const {
      routeId,
      serviceId,
      apiKeyId = null,
      userId = null,
      ipAddress = null,
      userAgent = null,
      method,
      path,
      statusCode,
      requestHeaders = {},
      responseHeaders = {},
      requestBody = null,
      responseBody = null,
      responseTime = 0,
      isError = false,
      errorMessage = null,
    } = body;

    // Verify existence of referenced entities in parallel
    const [routeExists, serviceExists, userExists, apiKeyExists] = await Promise.all([
      prisma.route.findUnique({ where: { id: routeId }, select: { id: true } }),
      prisma.backendService.findUnique({ where: { id: serviceId }, select: { id: true } }),
      userId ? prisma.user.findUnique({ where: { id: userId }, select: { id: true } }) : Promise.resolve(true),
      apiKeyId ? prisma.apiKey.findUnique({ where: { id: apiKeyId }, select: { id: true } }) : Promise.resolve(true),
    ]);

    if (!routeExists) {
      return NextResponse.json({ message: "Route not found" }, { status: 404 });
    }
    if (!serviceExists) {
      return NextResponse.json({ message: "Service not found" }, { status: 404 });
    }
    if (userId && userExists === null) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }
    if (apiKeyId && apiKeyExists === null) {
      return NextResponse.json({ message: "API key not found" }, { status: 404 });
    }

    // Create the log entry
    const newLog = await prisma.requestLog.create({
      data: {
        routeId,
        serviceId,
        apiKeyId,
        userId,
        ipAddress,
        userAgent,
        method,
        path,
        statusCode,
        requestHeaders,
        responseHeaders,
        requestBody,
        responseBody,
        responseTime,
        isError,
        errorMessage,
        timestamp: new Date(),
      },
      include: {
        route: { select: { path: true, method: true } },
        service: { select: { name: true } },
        apiKey: { select: { name: true } },
        user: { select: { name: true, email: true } },
      },
    });

    // Return success response
    return NextResponse.json(
      {
        message: "Request log added successfully",
        data: newLog,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error in logging API:", error);
    return NextResponse.json(
      {
        message: "Internal server error",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// Note: We're not disconnecting Prisma here as it's shared across requests
