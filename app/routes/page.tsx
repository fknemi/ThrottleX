"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { PlusCircle, Search, Filter, Loader2, Trash, Pencil } from "lucide-react";
import axios from "axios";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

interface Route {
  id: string;
  path: string;
  method: string;
  targetUrl: string;
  isActive: boolean;
  service?: {
    name: string;
    id: string;
  };
  tags?: string[];
}

interface Pagination {
  hasNext: boolean;
}

interface ApiResponse {
  data: Route[];
  pagination: Pagination;
}

export default function RoutesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({});
  const [page, setPage] = useState(1);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [routeToDelete, setRouteToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState<Route | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const { data, isLoading, isError } = useQuery<ApiResponse>({
    queryKey: ["routes", { search, ...filters, page, limit: 10 }],
    queryFn: async () => {
      const { data } = await axios.get("/api/internal/route/get", {
        params: {
          search,
          ...filters,
          page,
          limit: 10,
        },
      });
      return data;
    },
  });

  const handleRowClick = (routeId: string) => {
    router.push(`/routes/${routeId}`);
  };

  const handleDeleteRoute = async () => {
    if (!routeToDelete) return;

    setIsDeleting(true);
    try {
      await axios.delete("/api/internal/route/delete", {
        data: { routeId: routeToDelete },
      });

      toast({
        title: "Route deleted",
        description: "The route has been successfully deleted.",
      });

      queryClient.invalidateQueries(["routes"]);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete the route. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setRouteToDelete(null);
    }
  };

  const openDeleteDialog = (routeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRouteToDelete(routeId);
    setDeleteDialogOpen(true);
  };

  const openEditDialog = (route: Route, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingRoute(route);
    setEditDialogOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!editingRoute) return;

  setIsSaving(true);
  try {
    await axios.put("/api/internal/route/update", {  // Changed endpoint to match backend
      routeId: editingRoute.id,  // Explicitly include routeId
      path: editingRoute.path,
      method: editingRoute.method,
      targetUrl: editingRoute.targetUrl,
      isActive: editingRoute.isActive,
      tags: editingRoute.tags,
    });

    toast({
      title: "Route updated",
      description: "The route has been successfully updated.",
    });

    queryClient.invalidateQueries(["routes"]);
    setEditDialogOpen(false);
  } catch (error: any) {
    console.error("Update error:", error.response?.data);
    toast({
      title: "Error",
      description: error.response?.data?.message || "Failed to update the route",
      variant: "destructive",
    });
  } finally {
    setIsSaving(false);
  }
};
  const handleInputChange = (field: keyof Route, value: any) => {
    if (!editingRoute) return;
    setEditingRoute({
      ...editingRoute,
      [field]: value,
    });
  };

  const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editingRoute) return;
    const tags = e.target.value.split(",").map(tag => tag.trim());
    setEditingRoute({
      ...editingRoute,
      tags,
    });
  };

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-2xl font-bold">Routes</CardTitle>
          <div className="flex items-center space-x-2">
            <Button size="sm" onClick={() => router.push("/route/create")}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Route
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search routes..."
                  className="pl-8 w-[300px]"
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
                    checked={filters.isActive === "true"}
                    onCheckedChange={(checked) =>
                      setFilters({
                        ...filters,
                        isActive: checked ? "true" : "",
                      })
                    }
                  >
                    Active Only
                  </DropdownMenuCheckboxItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Path</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Target URL</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7}>
                    <div className="flex items-center space-x-4">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-[250px]" />
                        <Skeleton className="h-4 w-[200px]" />
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : isError ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-red-500">
                    Error loading routes
                  </TableCell>
                </TableRow>
              ) : data?.data?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">
                    No routes found
                  </TableCell>
                </TableRow>
              ) : (
                data?.data?.map((route) => (
                  <TableRow
                    key={route.id}
                    onClick={() => handleRowClick(route.id)}
                    className="cursor-pointer hover:bg-gray-50"
                  >
                    <TableCell>{route.path}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{route.method}</Badge>
                    </TableCell>
                    <TableCell className="truncate max-w-[200px]">
                      {route.targetUrl}
                    </TableCell>
                    <TableCell>{route.service?.name}</TableCell>
                    <TableCell>
                      <Badge variant={route.isActive ? "default" : "secondary"}>
                        {route.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {route.tags?.map((tag) => (
                          <Badge key={tag} variant="outline">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => openEditDialog(route, e)}
                          className="text-blue-500 hover:text-blue-700"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => openDeleteDialog(route.id, e)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          <div className="flex items-center justify-end space-x-2 py-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((old) => Math.max(old - 1, 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((old) => old + 1)}
              disabled={!data?.pagination?.hasNext}
            >
              Next
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the route
              and remove all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteRoute}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Route</DialogTitle>
          </DialogHeader>
          {editingRoute && (
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="path">Path</Label>
                  <Input
                    id="path"
                    value={editingRoute.path}
                    onChange={(e) => handleInputChange("path", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="method">Method</Label>
                  <Select
                    value={editingRoute.method}
                    onValueChange={(value) => handleInputChange("method", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GET">GET</SelectItem>
                      <SelectItem value="POST">POST</SelectItem>
                      <SelectItem value="PUT">PUT</SelectItem>
                      <SelectItem value="PATCH">PATCH</SelectItem>
                      <SelectItem value="DELETE">DELETE</SelectItem>
                      <SelectItem value="HEAD">HEAD</SelectItem>
                      <SelectItem value="OPTIONS">OPTIONS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="targetUrl">Target URL</Label>
                <Input
                  id="targetUrl"
                  value={editingRoute.targetUrl}
                  onChange={(e) => handleInputChange("targetUrl", e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="tags">Tags (comma separated)</Label>
                <Input
                  id="tags"
                  value={editingRoute.tags?.join(", ") || ""}
                  onChange={handleTagsChange}
                  placeholder="tag1, tag2, tag3"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={editingRoute.isActive}
                  onCheckedChange={(checked) => handleInputChange("isActive", checked)}
                />
                <Label htmlFor="isActive">Active</Label>
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditDialogOpen(false)}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? (
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
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
