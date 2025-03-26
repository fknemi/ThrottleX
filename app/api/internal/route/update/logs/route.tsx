import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    // Authenticate the user (optional depending on your requirements)
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    // Parse request body
    const body = await req.json();

    // Validate required fields
    const {
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
    } = body;

    // Basic validation
    if (!routeId || !serviceId || !method || !path || !statusCode) {
      return NextResponse.json(
        {
          message:
            "Missing required fields: routeId, serviceId, method, path, statusCode",
        },
        { status: 400 },
      );
    }

    // Check if route exists
    const routeExists = await prisma.route.findUnique({
      where: { id: routeId },
      select: { id: true },
    });

    if (!routeExists) {
      return NextResponse.json({ message: "Route not found" }, { status: 404 });
    }

    // Check if service exists
    const serviceExists = await prisma.backendService.findUnique({
      where: { id: serviceId },
      select: { id: true },
    });

    if (!serviceExists) {
      return NextResponse.json(
        { message: "Service not found" },
        { status: 404 },
      );
    }

    // If userId is provided, check if user exists
    if (userId) {
      const userExists = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true },
      });

      if (!userExists) {
        return NextResponse.json(
          { message: "User not found" },
          { status: 404 },
        );
      }
    }

    // If apiKeyId is provided, check if API key exists
    if (apiKeyId) {
      const apiKeyExists = await prisma.apiKey.findUnique({
        where: { id: apiKeyId },
        select: { id: true },
      });

      if (!apiKeyExists) {
        return NextResponse.json(
          { message: "API key not found" },
          { status: 404 },
        );
      }
    }

    // Create the new request log
    const newLog = await prisma.requestLog.create({
      data: {
        routeId,
        serviceId,
        apiKeyId: apiKeyId || undefined,
        userId: userId || undefined,
        ipAddress: ipAddress || undefined,
        userAgent: userAgent || undefined,
        method,
        path,
        statusCode,
        requestHeaders: requestHeaders || {},
        responseHeaders: responseHeaders || {},
        requestBody: requestBody || undefined,
        responseBody: responseBody || undefined,
        responseTime: responseTime || 0,
        isError: isError || false,
        errorMessage: errorMessage || undefined,
        timestamp: new Date(),
      },
      include: {
        route: {
          select: {
            path: true,
            method: true,
          },
        },
        service: {
          select: {
            name: true,
          },
        },
        apiKey: {
          select: {
            name: true,
          },
        },
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    // Return success response
    return NextResponse.json(
      {
        message: "Request log added successfully",
        data: newLog,
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error("Error adding request log:", error);

    return NextResponse.json(
      {
        message: "Internal server error",
        error: error.message,
      },
      { status: 500 },
    );
  } finally {
    await prisma.$disconnect();
  }
}
