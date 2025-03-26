"use client";

import { useParams, usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { EditServiceDialog } from "@/components/EditServiceDialog";
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from "react";
import { useRouter } from "next/navigation";
interface Route {
  id: string;
  path: string;
  method: string;
  targetUrl: string;
  isActive: boolean;
  createdAt: string;
}

export default function ServiceDetailPage() {
const pathname = usePathname();
  const { id } = useParams();
  const queryClient = useQueryClient();

  // Fetch service details
  const { data: service, isLoading: isLoadingService } = useQuery({
    queryKey: ["service", id],
    queryFn: async () => {
      const { data } = await axios.get(`/api/internal/services/${id}`);
      return data;
    },
  });

  // Fetch routes for this service
  const { data: routes, isLoading: isLoadingRoutes } = useQuery({
    queryKey: ["routes", id],
    queryFn: async () => {
      const { data } = await axios.get("/api/internal/route/get", {
        params: { serviceId: id },
      });
      return data.data;
    },
  });

  // Format dates consistently
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (isLoadingService) {
    return (
      <div className="container mx-auto py-8 space-y-4">
        <Skeleton className="h-8 w-1/3" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!service) {
    return (
      <div className="container mx-auto py-8 text-center">
        <h1 className="text-2xl font-bold">Service not found</h1>
        <Button asChild className="mt-4">
          <Link href="/services">Back to Services</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">{service.name}</h1>
        <div className="flex gap-2">
          <EditServiceDialog service={service} />
          <Button asChild>
            <Link href={`/route/create`}>Add Route</Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Service Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <Badge
                variant={
                  service.status === "HEALTHY" ? "default" : "destructive"
                }
              >
                {service.status}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Base URL</span>
              <span>{service.baseUrl}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Owner</span>
              <span>{service.owner?.name}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Statistics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Routes</span>
              <span>{service._count?.routes}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">API Keys</span>
              <span>{service._count?.apiKeys}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Created</span>
              <span>{new Date(service.createdAt).toLocaleDateString()}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Routes</CardTitle>
          <CardDescription>
            All routes configured for this service
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingRoutes ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Path</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {routes?.map((route: Route) => (
                  <TableRow key={route.id}>
                    <TableCell>{route.path}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{route.method}</Badge>
                    </TableCell>
                    <TableCell className="truncate max-w-[200px]">
                      {route.targetUrl}
                    </TableCell>
                    <TableCell>
                      <Badge variant={route.isActive ? "default" : "secondary"}>
                        {route.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(route.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
