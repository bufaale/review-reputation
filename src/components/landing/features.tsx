import {
  MessageSquareText,
  BarChart3,
  TrendingUp,
  MapPin,
  Mail,
  FileSpreadsheet,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

const features = [
  {
    icon: MessageSquareText,
    title: "AI Response Generation",
    description:
      "Generate professional responses to any review in seconds. AI matches your brand's tone.",
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
              className="transition-shadow hover:shadow-md"
            >
              <CardHeader>
                <div className="bg-primary/10 mb-2 flex h-10 w-10 items-center justify-center rounded-lg">
                  <feature.icon className="text-primary h-5 w-5" />
                </div>
                <CardTitle>{feature.title}</CardTitle>
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
