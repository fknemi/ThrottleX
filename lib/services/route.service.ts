// lib/services/route.service.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function findRoute(path: string, method: string) {
  return prisma.route.findFirst({
    where: {
      path,
      method: method as any,
      isActive: true,
    },
    include: {
      service: true,
    },
  });
}

export async function refreshRouteCache() {
  // Implement periodic cache refresh if needed
}
