import { PrismaClient } from "@prisma/client";

// Create Prisma client outside of the function to avoid multiple instances
const prisma = new PrismaClient();

export async function getRouteConfiguration(pathname: string, method: string) {
  try {
    console.log(`[DEBUG] Searching for route: ${pathname}, Method: ${method}`);

    const route = await prisma.route.findFirst({
      where: {
        path: pathname,
        method: method.toUpperCase() as any,
        isActive: true,
      },
    });

    console.log("[DEBUG] Found Route:", JSON.stringify(route, null, 2));

    return route;
  } catch (error) {
    console.error("[DEBUG] Database Error:", error);
    throw error;
  }
}
