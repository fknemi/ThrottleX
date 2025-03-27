// app/api/internal/service/get/route.ts
import { NextRequest, NextResponse } from "next/server";
import {prisma} from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET(req: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });



        if (!session) {
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(req.url);
        const search = searchParams.get("search");
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const ownerId = searchParams.get("ownerId");
        const status = searchParams.get("status");
        const includeRoutes = searchParams.get("includeRoutes") === "true";

        const skip = (page - 1) * limit;

        const where = {
            ...(search && {
                OR: [
                    { name: { contains: search, mode: "insensitive" } },
                    { description: { contains: search, mode: "insensitive" } },
                    { tags: { hasSome: [search] } },
                ],
            }),
            ...(ownerId && { ownerId }),
            ...(status && { status }),
        };

        const services = await prisma.backendService.findMany({
            where,
            skip,
            take: limit,
            include: {
                owner: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                ...(includeRoutes && {
                    routes: true,
                }),
                _count: {
                    select: {
                        routes: true,
                        apiKeys: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        const totalCount = await prisma.backendService.count({ where });

        return NextResponse.json({
            data: services,
            pagination: {
                total: totalCount,
                page,
                limit,
                hasNext: skip + limit < totalCount,
            },
        });
    } catch (error) {
        console.error("Error fetching services:", error);
        return NextResponse.json(
            {
                message: "Internal server error",
                error: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}
