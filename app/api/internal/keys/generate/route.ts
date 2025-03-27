import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import {prisma} from '@/lib/prisma';
import { randomBytes } from 'crypto';
import { headers } from 'next/headers';

// Helper function to generate a secure API key
function generateApiKey(prefix: string): string {
    const randomPart = randomBytes(16).toString('hex');
    return `${prefix}_${randomPart}`;
}

export async function POST(request: Request) {
    try {
        // Authenticate the user
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }


        // Parse the request body
        const body = await request.json();
        const { name, description, scopes, serviceId, rateLimit, expiresAt } = body;

        // Validate required fields
        if (!name) {
            return NextResponse.json(
                { error: 'Name is required for the API key' },
                { status: 400 }
            );
        }

        // Validate scopes if provided
        if (scopes && (!Array.isArray(scopes) || scopes.some(s => typeof s !== 'string'))) {
            return NextResponse.json(
                { error: 'Scopes must be an array of strings' },
                { status: 400 }
            );
        }

        // Validate service exists if provided
        let service = null;
        if (serviceId) {
            service = await prisma.backendService.findUnique({
                where: { id: serviceId },
            });
            if (!service) {
                return NextResponse.json(
                    { error: 'Specified service does not exist' },
                    { status: 404 }
                );
            }
        }

        // Generate a unique prefix (first 6 chars of user ID + timestamp)
        const prefix = `ak_${session.user.id.slice(0, 6)}_${Date.now().toString(36).slice(-4)}`;

        // Create the API key in database
        const apiKey = await prisma.apiKey.create({
            data: {
                key: generateApiKey(prefix),
                userId: session.user.id,
                name,
                description: description || null,
                prefix,
                scopes: scopes || [],
                rateLimit: rateLimit || 1000,
                expiresAt: expiresAt ? new Date(expiresAt) : null,
                serviceId: serviceId || null,
                isActive: true,
            },
            select: {
                id: true,
                key: true,
                name: true,
                description: true,
                prefix: true,
                scopes: true,
                rateLimit: true,
                expiresAt: true,
                createdAt: true,
                service: serviceId ? { select: { id: true, name: true } } : false,
            },
        });

        // Return the API key (only returned once - user should save it securely)
        return NextResponse.json({
            success: true,
            data: apiKey,
            warning: 'Store this API key securely as it will not be shown again.',
        });

    } catch (error) {
        console.error('Error generating API key:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function GET() {
    return NextResponse.json(
        { error: 'Method not allowed - Use POST to generate an API key' },
        { status: 405 }
    );
}
