// lib/services/rateLimit.service.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function checkRateLimit(
  key: string,
  limit: number,
): Promise<boolean> {
  const window = 60 * 1000; // 1 minute
  const type = key.startsWith("user:")
    ? "USER"
    : key.startsWith("api_key:")
      ? "API_KEY"
      : "IP";

  try {
    // Check existing rate limit record using the correct unique constraint
    const existingLimit = await prisma.rateLimit.findFirst({
      where: {
        key,
        type,
        window,
        expiresAt: { gt: new Date() }, // Only consider active limits
      },
    });

    const now = new Date();
    const expiresAt = new Date(now.getTime() + window);

    if (existingLimit) {
      if (existingLimit.count >= limit) {
        return true; // Rate limited
      }

      // Increment count
      await prisma.rateLimit.update({
        where: { id: existingLimit.id },
        data: { count: { increment: 1 } },
      });
    } else {
      // Create new rate limit record
      await prisma.rateLimit.create({
        data: {
          key,
          type,
          count: 1,
          window,
          expiresAt,
        },
      });
    }

    return false;
  } catch (error) {
    console.error("Rate limit error:", error);
    // Fail open - don't block requests if rate limiting fails
    return false;
  }
}
