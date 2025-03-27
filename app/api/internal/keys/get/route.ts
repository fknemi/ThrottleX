import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import {prisma} from '@/lib/prisma';
import { headers } from 'next/headers';

export async function GET(request: Request) {
    try {
        // Authenticate the user
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        // Get query parameters for pagination/filtering
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const isActive = searchParams.get('isActive');
        const serviceId = searchParams.get('serviceId');

        // Build the where clause
        const where: any = {
            userId: session.user.id
        };

        if (isActive !== null) {
            where.isActive = isActive === 'true';
        }

        if (serviceId) {
            where.serviceId = serviceId;
        }

        // Get the API keys with pagination
        const [apiKeys, totalCount] = await Promise.all([
            prisma.apiKey.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                select: {
                    id: true,
                    name: true,
                    description: true,
                    prefix: true,
                    scopes: true,
                    rateLimit: true,
                    expiresAt: true,
                    createdAt: true,
                    isActive: true,
                    service: {
                        select: {
                            id: true,
                            name: true
                        }
                    }
                },
                orderBy: {
                    createdAt: 'desc'
                }
            }),
            prisma.apiKey.count({ where })
        ]);

        return NextResponse.json({
            success: true,
            data: apiKeys,
            pagination: {
                total: totalCount,
                page,
                limit,
                totalPages: Math.ceil(totalCount / limit),
                hasNext: page * limit < totalCount,
                hasPrevious: page > 1
            }
        });

    } catch (error) {
        console.error('Error fetching API keys:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// Keep your existing POST handler
