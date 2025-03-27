// components/RouteAnalyticsSummary.tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useSearchParams } from 'next/navigation'
interface AnalyticsSummary {
  requestCount: number;
  successCount: number;
  errorCount: number;
  avgResponseTime: number;
  maxResponseTime: number;
  minResponseTime: number;
  statusCodes: Record<string, number>;
  userAgents: Record<string, number>;
  ipAddresses: Record<string, number>;
  apiKeys: Record<string, number>;
  startTime: string;
  endTime: string;
}

export default function RouteAnalyticsSummary() {
      const searchParams = useSearchParams()
        const routeId = searchParams.get('routeId')
  const { data, isLoading, error } = useQuery<AnalyticsSummary>({
    queryKey: ["analytics", routeId],
    queryFn: async () => {
      const { data } = await axios.get(
        `/api/internal/analytics/summary?routeId=${routeId}`
      );
      return data.data;
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Monthly Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Monthly Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">Error loading analytics data</p>
        </CardContent>
      </Card>
    );
  }

  const successRate = (data.successCount / data.requestCount) * 100;
  const errorRate = (data.errorCount / data.requestCount) * 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Analytics</CardTitle>
        <p className="text-sm text-muted-foreground">
          {new Date(data.startTime).toLocaleDateString()} -{" "}
          {new Date(data.endTime).toLocaleDateString()}
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <h3 className="font-medium">Requests</h3>
            <p className="text-2xl font-bold">{data.requestCount}</p>
          </div>
          <div className="space-y-2">
            <h3 className="font-medium">Success Rate</h3>
            <p className="text-2xl font-bold">{successRate.toFixed(1)}%</p>
          </div>
          <div className="space-y-2">
            <h3 className="font-medium">Error Rate</h3>
            <p className="text-2xl font-bold">{errorRate.toFixed(1)}%</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <h3 className="font-medium">Avg Response Time</h3>
            <p className="text-2xl font-bold">{data.avgResponseTime.toFixed(2)}ms</p>
          </div>
          <div className="space-y-2">
            <h3 className="font-medium">Max Response Time</h3>
            <p className="text-2xl font-bold">{data.maxResponseTime.toFixed(2)}ms</p>
          </div>
          <div className="space-y-2">
            <h3 className="font-medium">Min Response Time</h3>
            <p className="text-2xl font-bold">{data.minResponseTime.toFixed(2)}ms</p>
          </div>
        </div>

        <div>
          <h3 className="font-medium mb-2">Status Codes</h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(data.statusCodes).map(([code, count]) => (
              <Badge
                key={code}
                variant={code.startsWith("2") ? "default" : "destructive"}
              >
                {code}: {count}
              </Badge>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-medium mb-2">Top User Agents</h3>
            <ul className="space-y-1">
              {Object.entries(data.userAgents).map(([ua, count]) => (
                <li key={ua} className="text-sm">
                  {ua}: {count}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-medium mb-2">Top IP Addresses</h3>
            <ul className="space-y-1">
              {Object.entries(data.ipAddresses).map(([ip, count]) => (
                <li key={ip} className="text-sm">
                  {ip}: {count}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
