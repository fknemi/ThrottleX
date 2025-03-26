import { z } from "zod";

const httpMethods = [
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
  "HEAD",
  "OPTIONS",
] as const;

export const routeFormSchema = z.object({
  path: z
    .string()
    .min(1, "Path is required")
    .regex(/^\//, "Path must start with /"),
  method: z.enum(httpMethods),
  targetUrl: z.string().url("Invalid URL").min(1, "Target URL is required"),
  serviceId: z.string().min(1, "Service ID is required"),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
  rateLimit: z.number().int().positive().optional(),
  cacheTtl: z.number().int().positive().optional(),
  tags: z.array(z.string()).optional(),
});

export type RouteFormValues = z.infer<typeof routeFormSchema>;
