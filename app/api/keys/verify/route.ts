import { NextResponse } from 'next/server';
import {prisma} from '@/lib/prisma';
import { headers } from 'next/headers';

export async function POST(request: Request) {
    try {
        // Get the API key from the Authorization header
        const authHeader = (await headers()).get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json(
                { valid: false, error: 'Authorization header missing or invalid' },
                { status: 401 }
            );
        }

        const apiKey = authHeader.split(' ')[1];

        // Find the API key in the database
        const keyRecord = await prisma.apiKey.findUnique({
            where: { key: apiKey },
            include: {
                service: {
                    select: {
                        id: true,
                        name: true,
                        baseUrl: true
                    }
                },
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            }
        });

        // Check if key exists
        if (!keyRecord) {
            return NextResponse.json(
                { valid: false, error: 'API key not found' },
                { status: 401 }
            );
        }

        // Check if key is active
        if (!keyRecord.isActive) {
            return NextResponse.json(
                { valid: false, error: 'API key is inactive' },
                { status: 403 }
            );
        }

        // Check expiration if set
        if (keyRecord.expiresAt && new Date() > keyRecord.expiresAt) {
            return NextResponse.json(
                { valid: false, error: 'API key has expired' },
                { status: 403 }
            );
        }

        // Return the verification result
        return NextResponse.json({
            valid: true,
            keyDetails: {
                id: keyRecord.id,
                name: keyRecord.name,
                prefix: keyRecord.prefix,
                scopes: keyRecord.scopes,
                rateLimit: keyRecord.rateLimit,
                createdAt: keyRecord.createdAt,
                expiresAt: keyRecord.expiresAt,
                service: keyRecord.service,
                user: {
                    id: keyRecord.user.id,
                    name: keyRecord.user.name
                }
            }
        });

    } catch (error) {
        console.error('Error verifying API key:', error);
        return NextResponse.json(
            { valid: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function GET() {
    return NextResponse.json(
        { error: 'Method not allowed - Use POST to verify an API key' },
        { status: 405 }
    );
}
