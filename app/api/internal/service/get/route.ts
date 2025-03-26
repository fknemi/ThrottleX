// pages/api/internal/service/get.ts
import { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const {
      search,
      page = 1,
      limit = 10,
      ownerId,
      status,
      includeRoutes = false,
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const where = {
      ...(search && {
        OR: [
          { name: { contains: search as string, mode: "insensitive" } },
          { description: { contains: search as string, mode: "insensitive" } },
          { tags: { hasSome: [search as string] } },
        ],
      }),
      ...(ownerId && { ownerId: ownerId as string }),
      ...(status && { status: status as string }),
    };

    const services = await prisma.backendService.findMany({
      where,
      skip,
      take,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        ...(includeRoutes === "true" && {
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

    return res.status(200).json({
      data: services,
      pagination: {
        total: totalCount,
        page: Number(page),
        limit: Number(limit),
        hasNext: skip + take < totalCount,
      },
    });
  } catch (error) {
    console.error("Error fetching services:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
