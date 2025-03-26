import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Route } from "@prisma/client";
export const useRoutes = (params?: {
  serviceId?: string;
  page?: number;
  limit?: number;
  search?: string;
}) => {
  return useQuery({
    queryKey: ["routes", params],
    queryFn: async () => {
      const { data } = await api.get("/internal/route/get", { params });
      return data;
    },
  });
};
export const useCreateRoute = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (newRoute: Omit<Route, "id" | "createdAt" | "updatedAt">) =>
      api.post("", newRoute),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["routes"] });
    },
  });
};

export const useDeleteRoute = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.delete(`/routes/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["routes"] });
    },
  });
};
