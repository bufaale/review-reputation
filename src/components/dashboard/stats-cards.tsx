import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star, MessageSquare, CreditCard, Zap } from "lucide-react";

interface StatsCardsProps {
  totalReviews: number;
  averageRating: number;
  planName: string;
  status: string;
}

export function StatsCards({ totalReviews, averageRating, planName, status }: StatsCardsProps) {
  const stats = [
    {
      title: "Total Reviews",
      value: totalReviews.toLocaleString(),
      description: "Across all locations",
      icon: MessageSquare,
    },
    {
      title: "Average Rating",
      value: averageRating > 0 ? averageRating.toFixed(1) : "--",
      description: averageRating > 0 ? `Based on ${totalReviews} reviews` : "No reviews yet",
      icon: Star,
    },
    {
      title: "Current Plan",
      value: planName,
      description: status === "active" ? "Subscription active" : "Free tier",
      icon: CreditCard,
    },
    {
      title: "Status",
      value: status === "active" ? "Active" : "Free",
      description: status === "active" ? "Subscription active" : "No active subscription",
      icon: Zap,
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
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground">{stat.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
