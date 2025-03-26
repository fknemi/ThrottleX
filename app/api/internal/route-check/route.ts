
import { NextResponse } from "next/server";
import { PrismaClient, HttpMethod } from "@prisma/client";

const prisma = new PrismaClient();

// Map string methods to the enum
const methodMap: Record<string, HttpMethod> = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  DELETE: 'DELETE',
  PATCH: 'PATCH',
  HEAD: 'HEAD',
  OPTIONS: 'OPTIONS'
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const path = searchParams.get('path');
  const method = searchParams.get('method');

  if (!path || !method) {
    return NextResponse.json(
      { error: 'Missing path or method parameters' },
      { status: 400 }
    );
  }

  try {
    const upperMethod = method.toUpperCase();
    const prismaMethod = methodMap[upperMethod];
    
    if (!prismaMethod) {
      return NextResponse.json(
        { error: 'Invalid HTTP method' },
        { status: 400 }
      );
    }

    const route = await prisma.route.findFirst({
      where: {
        path,
        method: prismaMethod,
        isActive: true
      }
    });

    return NextResponse.json({
      exists: !!route,
      targetUrl: route?.targetUrl || null
    });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}
