"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  baseUrl: z.string().url("Must be a valid URL"),
  healthCheckUrl: z.string().url("Must be a valid URL").optional(),
  rateLimit: z.number().min(1).optional(),
  tags: z.string().optional(),
});

export function EditServiceDialog({ service }: { service: any }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: service.name,
      description: service.description || "",
      baseUrl: service.baseUrl,
      healthCheckUrl: service.healthCheckUrl || "",
      rateLimit: service.rateLimit || undefined,
      tags: service.tags?.join(", ") || "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      const response = await axios.patch("/api/internal/service/update", {
        id: service.id,
        ...values,
        tags: values.tags
          ? values.tags.split(",").map((tag) => tag.trim())
          : [],
      });
      return response.data;
    },
    onMutate: async (newData) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries(["service", service.id]);

      // Snapshot the previous value
      const previousService = queryClient.getQueryData(["service", service.id]);

      // Optimistically update to the new value
      queryClient.setQueryData(["service", service.id], (old: any) => ({
        ...old,
        ...newData,
        tags: newData.tags
          ? newData.tags.split(",").map((tag: string) => tag.trim())
          : [],
      }));
      setOpen(false);
      return { previousService };
    },
    onSuccess: () => {
      // Invalidate and refetch
      Promise.all([
        queryClient.invalidateQueries(["service", service.id]),
        queryClient.invalidateQueries(["services"]),
      ]).then(() => {
        toast({
          title: "Service updated successfully",
          variant: "default",
        });
        setOpen(false);
        form.reset();
      });
    },
    onError: (error: any, _, context) => {
      // Rollback on error
      if (context?.previousService) {
        queryClient.setQueryData(
          ["service", service.id],
          context.previousService,
        );
      }
      toast({
        title: "Error updating service",
        description: error.response?.data?.message || "An error occurred",
        variant: "destructive",
      });
    },
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          form.reset();
        }
        setOpen(isOpen);
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline">Edit Service</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Service</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Service Name</FormLabel>
                  <FormControl>
                    <Input placeholder="My API Service" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="What does this service do?"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="baseUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Base URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://api.example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="healthCheckUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Health Check URL</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://api.example.com/health"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="rateLimit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rate Limit (requests/min)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="1000"
                      {...field}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value ? parseInt(e.target.value) : undefined,
                        )
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags (comma separated)</FormLabel>
                  <FormControl>
                    <Input placeholder="api, payment, v1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  form.reset();
                  setOpen(false);
                }}
                disabled={mutation.isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isLoading}>
                {mutation.isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
