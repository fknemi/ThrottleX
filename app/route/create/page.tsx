"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { v4 as uuid } from "uuid";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Session } from "@/lib/auth";
import { authClient } from "@/lib/auth-client";
import { HttpMethod } from "@prisma/client";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {useRouter} from "next/navigation"
export default function CreateRoute() {
    const router = useRouter()
  const { data, isPending: isSessionPending } = authClient.useSession();
  const { toast } = useToast();


  const { data: services, isPending: isServicesPending } = useQuery({
    queryKey: ["services"],
    queryFn: async () => {
      const response = await fetch("/api/internal/services/get", {
        headers: {
          Authorization: `Bearer ${data?.session.token}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch services");
      return response.json();
    },
    enabled: !!data?.session?.token,
  });

  const [formData, setFormData] = useState({
    path: "",
    method: "GET" as HttpMethod,
    targetUrl: "",
    serviceId: "",
    description: "",
    isActive: true,
    rateLimit: 100,
    cacheTtl: 60,
    tags: "",
    middlewares: "{}" as string,
  });

  useEffect(() => {
    // Set default serviceId if services exist and no serviceId is selected
    if (services?.length && !formData.serviceId) {
      setFormData((prev) => ({ ...prev, serviceId: services[0].id }));
    }
  }, [services]);

  const createRouteMutation = useMutation({
    mutationFn: async (routeData: typeof formData) => {
      const response = await fetch("/api/internal/route/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${data?.session.token}`,
        },
        body: JSON.stringify({
          ...routeData,
          tags: routeData.tags
            ? routeData.tags
                .split(",")
                .map((tag) => tag.trim())
                .filter((tag) => tag)
            : [],
          middlewares: routeData.middlewares
            ? JSON.parse(routeData.middlewares)
            : undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create route");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Route created successfully",
        variant: "default",
      });
      setFormData({
        path: "",
        method: "GET",
        targetUrl: "",
        serviceId: services?.length ? services[0].id : "",
        description: "",
        isActive: true,
        rateLimit: 100,
        cacheTtl: 60,
        tags: "",
        middlewares: "{}",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createRouteMutation.mutate(formData);
    if(formData.serviceId){
   router.push(`/service/${formData.serviceId}`)

    }else{
        router.push("/services")
    }
   };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  if (isSessionPending || isServicesPending) return <div>Loading...</div>;
  if (!services?.length)
    return <div>No services available. Please create a service first.</div>;

  const session = data as Session;

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Create New Route</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="path">Path</Label>
            <Input
              id="path"
              name="path"
              value={formData.path}
              onChange={handleChange}
              placeholder="/api/users"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="method">HTTP Method</Label>
            <Select
              value={formData.method}
              onValueChange={(value) => handleSelectChange("method", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select method" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(HttpMethod).map((method) => (
                  <SelectItem key={method} value={method}>
                    {method}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="targetUrl">Target URL</Label>
          <Input
            id="targetUrl"
            name="targetUrl"
            value={formData.targetUrl}
            onChange={handleChange}
            placeholder="http://user-service/api/users"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="serviceId">Service</Label>
          <Select
            value={formData.serviceId}
            onValueChange={(value) => handleSelectChange("serviceId", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select service" />
            </SelectTrigger>
            <SelectContent>
              {services?.map((service: { id: string; name: string }) => (
                <SelectItem key={service.id} value={service.id}>
                  {service.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Get all users"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="rateLimit">Rate Limit (reqs/min)</Label>
            <Input
              id="rateLimit"
              name="rateLimit"
              type="number"
              value={formData.rateLimit}
              onChange={handleChange}
              min="1"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cacheTtl">Cache TTL (seconds)</Label>
            <Input
              id="cacheTtl"
              name="cacheTtl"
              type="number"
              value={formData.cacheTtl}
              onChange={handleChange}
              min="0"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="tags">Tags (comma separated)</Label>
          <Input
            id="tags"
            name="tags"
            value={formData.tags}
            onChange={handleChange}
            placeholder="users,public,admin"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="middlewares">Middlewares (JSON)</Label>
          <Textarea
            id="middlewares"
            name="middlewares"
            value={formData.middlewares}
            onChange={handleChange}
            placeholder='{"auth": true, "logging": false}'
            rows={4}
          />
        </div>

        <div className="flex items-center space-x-2">
          <input
            id="isActive"
            name="isActive"
            type="checkbox"
            checked={formData.isActive}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, isActive: e.target.checked }))
            }
            className="h-4 w-4"
          />
          <Label htmlFor="isActive">Active</Label>
        </div>

        <Button
          type="submit"
          onClick={handleSubmit}
          disabled={createRouteMutation.isPending}
        >
          {createRouteMutation.isPending ? "Creating..." : "Create Route"}
        </Button>
      </form>
    </div>
  );
}
