"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Star, MessageSquareText, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import type { Location, ReviewWithResponse } from "@/types/database";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

const SENTIMENT_COLORS: Record<string, string> = {
  positive: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  neutral: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  negative: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

const SOURCE_COLORS: Record<string, string> = {
  google: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  yelp: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  facebook: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
  other: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
};

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${
            i < rating
              ? "fill-yellow-400 text-yellow-400"
              : "text-muted-foreground"
          }`}
        />
      ))}
    </div>
  );
}

type SortOption = "newest" | "oldest" | "highest" | "lowest";
type SentimentFilter = "all" | "positive" | "neutral" | "negative";

export default function ReviewsListPage() {
  const [reviews, setReviews] = useState<ReviewWithResponse[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [locationFilter, setLocationFilter] = useState("all");
  const [sentimentFilter, setSentimentFilter] = useState<SentimentFilter>("all");
  const [sortBy, setSortBy] = useState<SortOption>("newest");

  useEffect(() => {
    async function loadData() {
      try {
        const [reviewsRes, locationsRes] = await Promise.all([
          fetch("/api/reviews"),
          fetch("/api/locations"),
        ]);

        if (!reviewsRes.ok) throw new Error("Failed to load reviews");
        if (!locationsRes.ok) throw new Error("Failed to load locations");

        const reviewsJson = await reviewsRes.json();
        const locationsJson = await locationsRes.json();

        setReviews(reviewsJson.reviews || []);
        setLocations(locationsJson.locations || []);
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Failed to load data",
        );
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Build a location name lookup map
  const locationMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const loc of locations) {
      map[loc.id] = loc.name;
    }
    return map;
  }, [locations]);

  // Apply filters and sorting
  const filteredReviews = useMemo(() => {
    let result = [...reviews];

    // Location filter
    if (locationFilter !== "all") {
      result = result.filter((r) => r.location_id === locationFilter);
    }

    // Sentiment filter
    if (sentimentFilter !== "all") {
      result = result.filter((r) => r.sentiment === sentimentFilter);
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return (
            new Date(b.review_date || b.created_at).getTime() -
            new Date(a.review_date || a.created_at).getTime()
          );
        case "oldest":
          return (
            new Date(a.review_date || a.created_at).getTime() -
            new Date(b.review_date || b.created_at).getTime()
          );
        case "highest":
          return b.rating - a.rating;
        case "lowest":
          return a.rating - b.rating;
        default:
          return 0;
      }
    });

    return result;
  }, [reviews, locationFilter, sentimentFilter, sortBy]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-48" />
        <div className="flex gap-4">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-10 w-40" />
        </div>
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-32 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Reviews</h1>
        <p className="mt-1 text-muted-foreground">
          {filteredReviews.length === reviews.length
            ? `${reviews.length} total reviews`
            : `Showing ${filteredReviews.length} of ${reviews.length} reviews`}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <Select value={locationFilter} onValueChange={setLocationFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All Locations" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Locations</SelectItem>
            {locations.map((loc) => (
              <SelectItem key={loc.id} value={loc.id}>
                {loc.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={sentimentFilter}
          onValueChange={(v) => setSentimentFilter(v as SentimentFilter)}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All Sentiments" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sentiments</SelectItem>
            <SelectItem value="positive">Positive</SelectItem>
            <SelectItem value="neutral">Neutral</SelectItem>
            <SelectItem value="negative">Negative</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={sortBy}
          onValueChange={(v) => setSortBy(v as SortOption)}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="oldest">Oldest First</SelectItem>
            <SelectItem value="highest">Highest Rating</SelectItem>
            <SelectItem value="lowest">Lowest Rating</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Reviews list */}
      {filteredReviews.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <MessageSquareText className="mb-4 h-10 w-10 text-muted-foreground" />
            <h3 className="text-lg font-semibold">No reviews yet</h3>
            <p className="mt-1 max-w-sm text-muted-foreground">
              Add reviews from your location pages or import them via CSV.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredReviews.map((review) => {
            const hasResponse =
              review.responses && review.responses.length > 0;
            return (
              <Link
                key={review.id}
                href={`/dashboard/reviews/${review.id}`}
                className="block"
              >
                <Card className="transition-colors hover:bg-accent/50">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-base">
                          {review.reviewer_name || "Anonymous"}
                        </CardTitle>
                        <StarRating rating={review.rating} />
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {review.sentiment && (
                          <Badge
                            variant="outline"
                            className={SENTIMENT_COLORS[review.sentiment] || ""}
                          >
                            {review.sentiment}
                          </Badge>
                        )}
                        <Badge
                          variant="outline"
                          className={SOURCE_COLORS[review.source] || ""}
                        >
                          {review.source}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                      {review.review_text}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span>
                        {new Date(
                          review.review_date || review.created_at,
                        ).toLocaleDateString()}
                      </span>
                      {locationMap[review.location_id] && (
                        <span className="text-xs">
                          {locationMap[review.location_id]}
                        </span>
                      )}
                      {hasResponse ? (
                        <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Response ready
                        </span>
                      ) : (
                        <span className="text-muted-foreground">
                          No response
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
