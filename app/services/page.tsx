"use client";
// app/services/page.tsx

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, PlusCircle, Filter } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { ServiceCard } from "@/components/ServiceCard";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ServicesPage() {
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({});
  const [page, setPage] = useState(1);
  const limit = 9; // 3x3 grid

  const { data, isLoading, isError } = useQuery({
    queryKey: ["services", { search, ...filters, page, limit }],
    queryFn: async () => {
      const { data } = await axios.get("/api/internal/services/get", {
        params: {
          search,
          ...filters,
          page,
          limit,
        },
      });
      return data;
    },
  });

  const handleServiceSelect = (serviceId: string) => {
    // Navigate to service details
    console.log("Selected service:", serviceId);
    router.push(`/service/${serviceId}`);
  };

  if (isError) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center text-red-500">
          Error loading services. Please try again later.
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-3xl font-bold">Backend Services</h1>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search services..."
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Filter className="mr-2 h-4 w-4" />
                Filter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuCheckboxItem
                checked={filters.status === "HEALTHY"}
                onCheckedChange={(checked) =>
                  setFilters({
                    ...filters,
                    status: checked ? "HEALTHY" : "",
                  })
                }
              >
                Healthy Only
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button>
            <Link
              href="/services/add"
              className="flex flex-row items-center justify-center"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              New Service
            </Link>
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      ) : (
        <>
          {data?.data?.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No services found</p>
              <Button variant="ghost" className="mt-2">
                Create your first service
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.map((service) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  onSelect={handleServiceSelect}
                />
              ))}
            </div>
          )}
        </>
      )}

      <div className="flex justify-center gap-2">
        <Button
          variant="outline"
          disabled={page === 1}
          onClick={() => setPage((p) => Math.max(p - 1, 1))}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          disabled={!data?.pagination?.hasNext}
          onClick={() => setPage((p) => p + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
