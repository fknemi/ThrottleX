import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import {prisma} from '@/lib/prisma';
import { headers } from 'next/headers';

export async function DELETE(request: Request) {
  try {
    // Authenticate the user
 const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }


    // Parse request body
    const { keyId } = await request.json();

    // Validate required fields
    if (!keyId) {
      return NextResponse.json(
        { error: 'keyId is required' },
        { status: 400 }
      );
    }

    // Check if the API key exists
    const existingKey = await prisma.apiKey.findUnique({
      where: { id: keyId },
      include: {
        service: {
          select: {
            ownerId: true
          }
        }
      }
    });

    if (!existingKey) {
      return NextResponse.json(
        { error: 'API key not found' },
        { status: 404 }
      );
    }

    // Check permissions (only owner or admin can delete)
    if (session.user.role !== 'ADMIN' && existingKey.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this key' },
        { status: 403 }
      );
    }

    // Delete the API key
    await prisma.apiKey.delete({
      where: { id: keyId }
    });

    return NextResponse.json({
      success: true,
      message: 'API key deleted successfully'
    });

  } catch (error: any) {
    console.error('Error deleting API key:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Add other methods if needed
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}

export async function POST() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}
