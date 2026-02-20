import {
  MessageSquareText,
  BarChart3,
  TrendingUp,
  MapPin,
  Mail,
  FileSpreadsheet,
  Sparkles,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const features = [
  {
    icon: Sparkles,
    title: "Multi-Tone AI Responses",
    description:
      "Generate 3 response options in professional, friendly, and casual tones — pick the perfect one for every review.",
    highlighted: true,
  },
  {
    icon: BarChart3,
    title: "Sentiment Analysis",
    description:
      "Automatically detect sentiment and trending topics across all your reviews.",
  },
  {
    icon: TrendingUp,
    title: "Reputation Dashboard",
    description:
      "Track your reputation score, sentiment trends, and response rate over time.",
  },
  {
    icon: MapPin,
    title: "Multi-Location",
    description:
      "Manage reviews across all your business locations from one dashboard.",
  },
  {
    icon: Mail,
    title: "Review Requests",
    description:
      "Send email campaigns to happy customers asking them to leave reviews.",
  },
  {
    icon: FileSpreadsheet,
    title: "CSV Import",
    description:
      "Bulk import reviews from Google, Yelp, or any platform via CSV upload.",
  },
];

export function Features() {
  return (
    <section id="features" className="bg-muted/40 py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold">
            Everything you need to manage your reputation
          </h2>
          <p className="text-muted-foreground mt-4 mx-auto max-w-2xl">
            AI-powered tools to respond to reviews, track sentiment, and grow
            your online reputation.
          </p>
        </div>
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <Card
              key={feature.title}
              className={
                feature.highlighted
                  ? "relative overflow-hidden border-violet-500/50 bg-linear-to-br from-violet-500/10 to-purple-500/10 shadow-lg transition-shadow hover:shadow-xl"
                  : "transition-shadow hover:shadow-md"
              }
            >
              <CardHeader>
                <div
                  className={
                    feature.highlighted
                      ? "mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/20"
                      : "bg-primary/10 mb-2 flex h-10 w-10 items-center justify-center rounded-lg"
                  }
                >
                  <feature.icon
                    className={
                      feature.highlighted
                        ? "h-5 w-5 text-violet-600 dark:text-violet-400"
                        : "text-primary h-5 w-5"
                    }
                  />
                </div>
                <div className="flex items-center gap-2">
                  <CardTitle>{feature.title}</CardTitle>
                  {feature.highlighted && (
                    <Badge className="bg-violet-600 text-white text-[10px] px-1.5 py-0">
                      NEW
                    </Badge>
                  )}
                </div>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
              <CardContent />
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
