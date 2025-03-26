// components/ServiceCard.tsx
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BackendServiceWithRelations } from "@/types/service";

interface ServiceCardProps {
  service: BackendServiceWithRelations;
  onSelect?: (serviceId: string) => void;
}

export function ServiceCard({ service, onSelect }: ServiceCardProps) {
  return (
    <Card className="rounded-xl hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{service.name}</CardTitle>
            <CardDescription className="mt-1 line-clamp-2">
              {service.description || "No description provided"}
            </CardDescription>
          </div>
          <Badge
            variant={service.status === "HEALTHY" ? "default" : "destructive"}
          >
            {service.status}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <span className="font-medium">Base URL:</span>
          <span className="text-muted-foreground truncate">
            {service.baseUrl}
          </span>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <span className="font-medium">Routes:</span>
          <Badge variant="outline">{service.routeCount || 0}</Badge>
        </div>

        {service.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {service.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>

      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onSelect?.(service.id)}
        >
          View Details
        </Button>
        <div className="text-xs text-muted-foreground">
          Updated: {new Date(service.updatedAt).toLocaleDateString()}
        </div>
      </CardFooter>
    </Card>
  );
}
