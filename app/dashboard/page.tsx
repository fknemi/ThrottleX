"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertCircle,
  Clock,
  BarChart2,
  ShieldCheck,
  Server,
  TrendingUp,
  Zap,
  Activity,
  Gauge,
  AlertTriangle
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";

const statusColors = {
  '2xx': 'bg-green-100 text-green-800',
  '3xx': 'bg-blue-100 text-blue-800',
  '4xx': 'bg-yellow-100 text-yellow-800',
  '5xx': 'bg-red-100 text-red-800',
  default: 'bg-gray-100 text-gray-800'
};

const getStatusColor = (code) => {
  if (code.startsWith('2')) return statusColors['2xx'];
  if (code.startsWith('3')) return statusColors['3xx'];
  if (code.startsWith('4')) return statusColors['4xx'];
  if (code.startsWith('5')) return statusColors['5xx'];
  return statusColors.default;
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border rounded-lg shadow-lg p-4">
        <p className="font-bold">{label}</p>
        <p className="text-sm">
          <span className="text-muted-foreground">Value:</span> {payload[0].value}
        </p>
        {payload[0].payload.totalRequests && (
          <p className="text-sm text-muted-foreground mt-1">
            {((payload[0].value / payload[0].payload.totalRequests) * 100).toFixed(1)}% of total
          </p>
        )}
      </div>
    );
  }
  return null;
};

const AnimatedBar = (props) => {
  const { x, y, width, height, fill, payload } = props;
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.rect
      x={x}
      y={isHovered ? y - 5 : y}
      width={width}
      height={isHovered ? height + 5 : height}
      fill={fill}
      initial={{ y }}
      animate={{ y: isHovered ? y - 5 : y }}
      transition={{ type: "spring", stiffness: 300, damping: 15 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    />
  );
};

function RouteAnalyticsCard({ routeData }) {
  const requestData = [
    { name: 'Total', value: routeData.requestCount, totalRequests: routeData.requestCount, fill: 'hsl(var(--primary))' },
    { name: 'Success', value: routeData.successCount, totalRequests: routeData.requestCount, fill: 'hsl(var(--success))' },
    { name: 'Errors', value: routeData.errorCount, totalRequests: routeData.requestCount, fill: 'hsl(var(--destructive))' }
  ];

  const responseTimeData = [
    { name: 'Avg', value: routeData.avgResponseTime, fill: 'hsl(var(--primary))' },
    { name: 'Max', value: routeData.maxResponseTime, fill: 'hsl(var(--warning))' },
    { name: 'Min', value: routeData.minResponseTime, fill: 'hsl(var(--success))' }
  ];

  const successRate = (routeData.successCount / routeData.requestCount * 100).toFixed(1);
  const errorRate = (routeData.errorCount / routeData.requestCount * 100).toFixed(1);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Summary Cards */}
      <Card className="col-span-1">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center">
            <Activity className="h-4 w-4 mr-2 text-blue-500" />
            Total Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{routeData.requestCount}</div>
          <p className="text-xs text-muted-foreground">
            +12.3% from yesterday
          </p>
        </CardContent>
      </Card>

      <Card className="col-span-1">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center">
            <Zap className="h-4 w-4 mr-2 text-green-500" />
            Success Rate
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{successRate}%</div>
          <p className="text-xs text-muted-foreground">
            {routeData.successCount} successful requests
          </p>
        </CardContent>
      </Card>

      <Card className="col-span-1">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center">
            <AlertTriangle className="h-4 w-4 mr-2 text-yellow-500" />
            Error Rate
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{errorRate}%</div>
          <p className="text-xs text-muted-foreground">
            {routeData.errorCount} failed requests
          </p>
        </CardContent>
      </Card>

      <Card className="col-span-1">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center">
            <Gauge className="h-4 w-4 mr-2 text-purple-500" />
            Avg Response
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{routeData.avgResponseTime.toFixed(2)}ms</div>
          <p className="text-xs text-muted-foreground">
            {routeData.minResponseTime}ms min, {routeData.maxResponseTime}ms max
          </p>
        </CardContent>
      </Card>

      {/* Request Overview */}
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart2 className="mr-2 text-indigo-500" /> Request Overview
          </CardTitle>
          <CardDescription>Total requests breakdown for this route</CardDescription>
        </CardHeader>
        <CardContent className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={requestData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="name"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="value"
                radius={[8, 8, 0, 0]}
              >
                {requestData.map((entry, index) => (
                  <AnimatedBar
                    key={`cell-${index}`}
                    fill={entry.fill}
                    payload={entry}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="mr-2 text-amber-500" /> Response Time
          </CardTitle>
          <CardDescription>Response time metrics in milliseconds</CardDescription>
        </CardHeader>
        <CardContent className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={responseTimeData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="name"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="value"
                radius={[8, 8, 0, 0]}
              >
                {responseTimeData.map((entry, index) => (
                  <AnimatedBar
                    key={`cell-${index}`}
                    fill={entry.fill}
                    payload={entry}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Status Code Distribution */}
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center">
            <ShieldCheck className="mr-2 text-emerald-500" /> Status Codes
          </CardTitle>
          <CardDescription>HTTP status code distribution</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(routeData.statusCodes || {}).map(([code, count]) => (
              <div key={code} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                <Badge className={`${getStatusColor(code)} px-3 py-1 rounded-full`}>
                  {code}
                </Badge>
                <div className="font-medium">{count}</div>
                <div className="text-sm text-muted-foreground">
                  {((count / routeData.requestCount) * 100).toFixed(1)}%
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top IP Addresses */}
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Server className="mr-2 text-cyan-500" /> Top IP Addresses
          </CardTitle>
          <CardDescription>Most frequent request sources</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Object.entries(routeData.ipAddresses || {}).map(([ip, count]) => (
              <div key={ip} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                <div className="font-mono text-sm">{ip}</div>
                <div className="flex items-center gap-2">
                  <div className="text-sm text-muted-foreground">
                    {((count / routeData.requestCount) * 100).toFixed(1)}%
                  </div>
                  <Badge variant="secondary" className="px-2 py-0.5">
                    {count} requests
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AnalyticsDashboard() {
  const [analyticsData, setAnalyticsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRoute, setSelectedRoute] = useState(null);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        setLoading(true);
        const response = await fetch('/api/internal/analytics/summary');
        if (!response.ok) {
          throw new Error('Failed to fetch analytics');
        }
        const data = await response.json();
        setAnalyticsData(data.data);
        
        if (data.data.length > 0) {
          setSelectedRoute(data.data[0]);
        }

        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    }

    fetchAnalytics();
  }, []);

  if (loading) return (
    <div className="p-6 space-y-4">
      <div className="flex justify-between items-center">
        <Skeleton className="h-10 w-[200px]" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-[200px] w-full" />
          ))}
        </div>
      </div>
    </div>
  );

  if (error) return (
    <div className="p-6">
      <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          <h3 className="font-medium">Error loading analytics</h3>
        </div>
        <p className="mt-2 text-sm">{error}</p>
        <Button
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={() => window.location.reload()}
        >
          Try Again
        </Button>
      </div>
    </div>
  );

  if (analyticsData.length === 0) return (
    <div className="p-6">
      <div className="rounded-lg border bg-muted/50 p-8 text-center">
        <BarChart2 className="mx-auto h-10 w-10 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-medium">No analytics data available</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          There is no data to display.
        </p>
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold">API Analytics Dashboard</h1>
      </div>
      
      <Tabs
        value={selectedRoute?.routeId}
        onValueChange={(routeId) =>
          setSelectedRoute(analyticsData.find(route => route.routeId === routeId))
        }
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {analyticsData.map(route => (
            <TabsTrigger
              key={route.routeId}
              value={route.routeId}
              className="py-2"
            >
              {route.routeId}
            </TabsTrigger>
          ))}
        </TabsList>
        
        {selectedRoute && (
          <TabsContent value={selectedRoute.routeId} className="mt-6">
            <RouteAnalyticsCard routeData={selectedRoute} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
