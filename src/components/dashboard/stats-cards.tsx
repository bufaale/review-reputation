import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star, MessageSquareText, CheckCircle, Clock } from "lucide-react";

interface StatsCardsProps {
  totalReviews: number;
  averageRating: number;
  responseRate: number;
  pendingResponses: number;
}

export function StatsCards({ totalReviews, averageRating, responseRate, pendingResponses }: StatsCardsProps) {
  const stats = [
    {
      title: "Total Reviews",
      value: totalReviews.toLocaleString(),
      description: "Across all locations",
      icon: MessageSquareText,
    },
    {
      title: "Average Rating",
      value: averageRating > 0 ? averageRating.toFixed(1) : "--",
      description: averageRating > 0 ? `${averageRating >= 4 ? "Great" : averageRating >= 3 ? "Good" : "Needs improvement"}` : "No reviews yet",
      icon: Star,
      extra:
        averageRating > 0 ? (
          <span className="ml-1 inline-flex gap-0.5">
            {Array.from({ length: 5 }, (_, i) => (
              <Star
                key={i}
                className={`h-3 w-3 ${i < Math.round(averageRating) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"}`}
              />
            ))}
          </span>
        ) : null,
    },
    {
      title: "Response Rate",
      value: `${Math.round(responseRate * 100)}%`,
      description: "Reviews with responses",
      icon: CheckCircle,
    },
    {
      title: "Pending Responses",
      value: pendingResponses.toLocaleString(),
      description: pendingResponses > 0 ? "Reviews need responses" : "All caught up!",
      icon: Clock,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold">{stat.value}</span>
              {"extra" in stat && stat.extra}
            </div>
            <p className="text-xs text-muted-foreground">{stat.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
