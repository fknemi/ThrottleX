"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Session } from "@/lib/auth";
import { authClient } from "@/lib/auth-client";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";

export default function CreateService() {
  const { data, isPending: isSessionPending } = authClient.useSession();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    baseUrl: "",
    healthCheckUrl: "",
    tags: "",
    rateLimit: 1000, // Default rate limit
    metadata: "{}" as string,
  });

  const createServiceMutation = useMutation({
    mutationFn: async (serviceData: typeof formData) => {
      const response = await fetch("/api/internal/services/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${data?.session.token}`,
        },
        body: JSON.stringify({
          ...serviceData,
          tags: serviceData.tags
            ? serviceData.tags
                .split(",")
                .map((tag) => tag.trim())
                .filter((tag) => tag)
            : [],
          metadata: serviceData.metadata
            ? JSON.parse(serviceData.metadata)
            : undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create service");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Service created successfully",
        variant: "default",
      });
      // Reset form after successful creation
      setFormData({
        name: "",
        description: "",
        baseUrl: "",
        healthCheckUrl: "",
        tags: "",
        rateLimit: 1000,
        metadata: "{}",
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
    createServiceMutation.mutate(formData);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  if (isSessionPending) return <div>Loading...</div>;

  const session = data as Session;

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Create New Backend Service</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Service Name</Label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="User Service"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Service for managing users"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="baseUrl">Base URL</Label>
          <Input
            id="baseUrl"
            name="baseUrl"
            value={formData.baseUrl}
            onChange={handleChange}
            placeholder="https://api.example.com/v1"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="healthCheckUrl">Health Check URL (optional)</Label>
          <Input
            id="healthCheckUrl"
            name="healthCheckUrl"
            value={formData.healthCheckUrl}
            onChange={handleChange}
            placeholder="https://api.example.com/health"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="rateLimit">Default Rate Limit (reqs/min)</Label>
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
          <Label htmlFor="tags">Tags (comma separated)</Label>
          <Input
            id="tags"
            name="tags"
            value={formData.tags}
            onChange={handleChange}
            placeholder="users,authentication,core"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="metadata">Metadata (JSON)</Label>
          <Textarea
            id="metadata"
            name="metadata"
            value={formData.metadata}
            onChange={handleChange}
            placeholder='{"environment": "production", "team": "backend"}'
            rows={4}
          />
        </div>

        <Button type="submit" disabled={createServiceMutation.isPending}>
          {createServiceMutation.isPending ? "Creating..." : "Create Service"}
        </Button>
      </form>
    </div>
  );
}
