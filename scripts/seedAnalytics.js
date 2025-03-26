const { PrismaClient } = require('@prisma/client');
const { faker } = require('@faker-js/faker');
const { subDays, format } = require('date-fns');

const prisma = new PrismaClient();

/**
 * Seeds analytics data for a specific route
 * @param {Object} options
 * @param {string} options.routeId Route identifier
 * @param {number} [options.daysToGenerate=30]
 * @param {number} [options.requestsPerDay]
 */
async function seedRouteAnalytics(options) {
  const { routeId, daysToGenerate = 30, requestsPerDay } = options;

  // Validate and fetch route with its service
  const routeData = await prisma.route.findUnique({
    where: { id: routeId },
    include: { 
      service: true,
      creator: true 
    }
  });

  if (!routeData) {
    throw new Error(`Route with ID ${routeId} not found`);
  }

  const serviceId = routeData.serviceId;

  // Ensure API keys exist for the service
  let apiKeys = await prisma.apiKey.findMany({
    where: { serviceId },
    take: 5
  });

  // Create API keys if none exist
  if (apiKeys.length === 0) {
    try {
      const newApiKeys = await Promise.all(
        Array.from({ length: 5 }, (_, i) => 
          prisma.apiKey.create({
            data: {
              key: faker.string.uuid(),
              name: `Test Key ${i+1}`,
              prefix: `test_${i+1}`,
              scopes: ['read', 'write'],
              userId: routeData.createdBy,
              serviceId,
              isActive: true
            }
          })
        )
      );
      apiKeys = newApiKeys;
    } catch (error) {
      console.error('Error creating API keys:', error);
    }
  }

  const now = new Date();
  const startDate = subDays(now, daysToGenerate);

  // Generate random requests per day if not specified
  const requestsPerDayToGenerate = requestsPerDay ?? 
    faker.number.int({ min: 100, max: 1000 });

  console.log(`Generating analytics for route ${routeId}...`);
  console.log(`Generating ~${requestsPerDayToGenerate} requests per day for ${daysToGenerate} days`);

  // Process each day
  for (let day = 0; day < daysToGenerate; day++) {
    const currentDate = subDays(now, daysToGenerate - day);
    const dayStart = subDays(currentDate, 1);
    const dayEnd = currentDate;
    
    // Randomize daily request count with some variance
    const requestsToday = faker.number.int({
      min: Math.floor(requestsPerDayToGenerate * 0.8),
      max: Math.ceil(requestsPerDayToGenerate * 1.2),
    });

    const requestLogs = [];
    for (let i = 0; i < requestsToday; i++) {
      const isError = faker.datatype.boolean({ probability: 0.1 });
      const statusCode = isError
        ? faker.helpers.arrayElement([400, 401, 403, 404, 500, 503])
        : faker.helpers.arrayElement([200, 201, 204]);

      // Optionally assign an API key
      let apiKeyId = null;
      if (apiKeys.length > 0 && faker.datatype.boolean({ probability: 0.7 })) {
        apiKeyId = faker.helpers.arrayElement(apiKeys).id;
      }

      requestLogs.push({
        routeId,
        serviceId,
        method: routeData.method,
        path: routeData.path,
        statusCode,
        requestHeaders: {},
        responseHeaders: {},
        responseTime: faker.number.float({
          min: 50,
          max: isError ? 5000 : 500,
          precision: 0.01,
        }),
        timestamp: faker.date.between({
          from: dayStart,
          to: dayEnd
        }),
        isError,
        errorMessage: isError ? faker.lorem.sentence() : null,
        ipAddress: faker.internet.ip(),
        userAgent: faker.helpers.arrayElement([
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
          'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)',
          'Mozilla/5.0 (Linux; Android 11; SM-G991B)',
        ]),
        apiKeyId,
        requestBody: null,
        responseBody: null
      });
    }

    // Batch insert request logs
    const BATCH_SIZE = 100;
    for (let i = 0; i < requestLogs.length; i += BATCH_SIZE) {
      const batch = requestLogs.slice(i, i + BATCH_SIZE);
      try {
        await prisma.requestLog.createMany({
          data: batch,
          skipDuplicates: true
        });
      } catch (batchError) {
        console.error(`Error inserting batch ${i}-${i+BATCH_SIZE}:`, batchError);
        
        // Fallback to individual inserts
        for (const log of batch) {
          try {
            await prisma.requestLog.create({ data: log });
          } catch (individualError) {
            console.error('Failed to insert individual log:', individualError);
          }
        }
      }
    }

    // Generate daily analytics summary
    const dailyLogs = await prisma.requestLog.findMany({
      where: {
        routeId,
        serviceId,
        timestamp: {
          gte: dayStart,
          lt: dayEnd,
        },
      },
    });

    if (dailyLogs.length > 0) {
      const requestCount = dailyLogs.length;
      const successCount = dailyLogs.filter(log => log.statusCode >= 200 && log.statusCode < 300).length;
      const errorCount = dailyLogs.filter(log => log.statusCode >= 400).length;
      const responseTimes = dailyLogs.map(log => log.responseTime);
      
      const avgResponseTime = responseTimes.length > 0 
        ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length 
        : 0;
      
      const maxResponseTime = responseTimes.length > 0 ? Math.max(...responseTimes) : 0;
      const minResponseTime = responseTimes.length > 0 ? Math.min(...responseTimes) : 0;

      const statusCodes = {};
      dailyLogs.forEach(log => {
        statusCodes[log.statusCode] = (statusCodes[log.statusCode] || 0) + 1;
      });

      // Helper function to generate top lists
      const generateTopList = (logs, key, limit = 5) => {
        const counts = {};
        logs.forEach(log => {
          const value = log[key];
          if (value) {
            counts[value] = (counts[value] || 0) + 1;
          }
        });
        return Object.entries(counts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, limit)
          .reduce((obj, [key, val]) => ({ ...obj, [key]: val }), {});
      };

      const summaryData = {
        routeId,
        serviceId,
        period: 'DAY', 
        startTime: dayStart,
        endTime: dayEnd,
        requestCount,
        successCount,
        errorCount,
        avgResponseTime,
        maxResponseTime,
        minResponseTime,
        statusCodes,
        userAgents: generateTopList(dailyLogs, 'userAgent'),
        ipAddresses: generateTopList(dailyLogs, 'ipAddress'),
        apiKeys: generateTopList(dailyLogs, 'apiKeyId')
      };

      try {
        await prisma.analyticsSummary.create({
          data: summaryData
        });
      } catch (summaryError) {
        console.error('Error creating daily summary:', summaryError);
        console.error('Summary data:', JSON.stringify(summaryData, null, 2));
      }
    }

    // Progress reporting
    if (day % 7 === 0 || day === daysToGenerate - 1) {
      console.log(`Processed day ${day + 1}/${daysToGenerate}`);
    }
  }

  console.log(`Successfully generated analytics for route ${routeId}`);
}

// Main execution function
async function main() {
  try {
    // Fetch a route to seed (you might want to pass this as an argument)
    const route = await prisma.route.findFirst({
      select: { id: true }
    });

    if (!route) {
      throw new Error('No routes found to seed analytics');
    }

    await seedRouteAnalytics({
      routeId: route.id,
      daysToGenerate: 30,
      requestsPerDay: 500,
    });
  } catch (error) {
    console.error('Error in seed script:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script if executed directly
if (require.main === module) {
  main();
}

module.exports = { seedRouteAnalytics };
