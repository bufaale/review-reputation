import Link from "next/link";
import { Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface RecentReview {
  id: string;
  reviewer_name: string | null;
  rating: number;
  review_text: string;
  sentiment: string | null;
  created_at: string;
}

interface RecentReviewsProps {
  reviews: RecentReview[];
}

function timeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

function SentimentDot({ sentiment }: { sentiment: string | null }) {
  const color =
    sentiment === "positive"
      ? "bg-green-500"
      : sentiment === "negative"
        ? "bg-red-500"
        : "bg-yellow-500";

  return <span className={`inline-block h-2 w-2 rounded-full ${color}`} title={sentiment ?? "unknown"} />;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="inline-flex gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={`h-3 w-3 ${i < rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"}`}
        />
      ))}
    </span>
  );
}

export function RecentReviews({ reviews }: RecentReviewsProps) {
  if (reviews.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Recent Reviews</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No reviews yet. Add reviews from your locations.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Recent Reviews</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {reviews.map((review) => (
          <Link
            key={review.id}
            href={`/dashboard/reviews/${review.id}`}
            className="flex items-start gap-3 rounded-md p-2 transition-colors hover:bg-muted/50"
          >
            <div className="mt-1">
              <SentimentDot sentiment={review.sentiment} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">
                  {review.reviewer_name || "Anonymous"}
                </span>
                <StarRating rating={review.rating} />
                <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                  {timeAgo(review.created_at)}
                </span>
              </div>
              <p className="mt-0.5 truncate text-sm text-muted-foreground">
                {review.review_text}
              </p>
            </div>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
