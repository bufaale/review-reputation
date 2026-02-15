"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Star,
  Copy,
  Loader2,
  Sparkles,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import type { ReviewWithResponse, ReviewResponse, Location } from "@/types/database";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

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

function StarRating({
  rating,
  size = "md",
}: {
  rating: number;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClass = size === "lg" ? "h-6 w-6" : size === "md" ? "h-5 w-5" : "h-4 w-4";
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={`${sizeClass} ${
            i < rating
              ? "fill-yellow-400 text-yellow-400"
              : "text-muted-foreground"
          }`}
        />
      ))}
    </div>
  );
}

export default function ReviewDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = createClient();

  const [review, setReview] = useState<ReviewWithResponse | null>(null);
  const [location, setLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const fetchReview = useCallback(async () => {
    try {
      const res = await fetch(`/api/reviews/${id}`);
      if (!res.ok) throw new Error("Review not found");

      const json = await res.json();
      const data = json.review;

      // Supabase returns joined location as an object (single FK)
      const loc = data.locations as unknown as Location | null;
      setLocation(loc || null);

      // Sort responses by created_at descending so most recent is first
      if (data.responses) {
        data.responses.sort(
          (a: ReviewResponse, b: ReviewResponse) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        );
      }

      setReview(data as ReviewWithResponse);
    } catch {
      toast.error("Failed to load review");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchReview();
  }, [fetchReview]);

  async function handleGenerateResponse() {
    setGenerating(true);
    try {
      const res = await fetch(`/api/reviews/${id}/generate-response`, {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to generate response");

      toast.success("AI response generated!");
      // Refresh review to get the new response
      await fetchReview();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to generate response",
      );
    } finally {
      setGenerating(false);
    }
  }

  async function handleCopyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Response copied to clipboard!");
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  }

  async function handleTogglePosted(
    responseId: string,
    currentValue: boolean,
  ) {
    const { error } = await supabase
      .from("responses")
      .update({ is_used: !currentValue })
      .eq("id", responseId);

    if (error) {
      toast.error("Failed to update status");
      return;
    }

    // Update local state
    setReview((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        responses: prev.responses.map((r) =>
          r.id === responseId ? { ...r, is_used: !currentValue } : r,
        ),
      };
    });

    toast.success(!currentValue ? "Marked as posted" : "Unmarked as posted");
  }

  async function handleDeleteReview() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/reviews/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Failed to delete review");
      }
      toast.success("Review deleted");
      router.push("/dashboard/reviews");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete review",
      );
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full rounded-lg" />
        <Skeleton className="h-32 w-full rounded-lg" />
      </div>
    );
  }

  if (!review) {
    return (
      <div className="space-y-4">
        <Link
          href="/dashboard/reviews"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Reviews
        </Link>
        <p className="text-muted-foreground">Review not found.</p>
      </div>
    );
  }

  const latestResponse =
    review.responses && review.responses.length > 0
      ? review.responses[0]
      : null;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Back link */}
      <Link
        href="/dashboard/reviews"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Reviews
      </Link>

      {/* Review card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              {location && (
                <Link
                  href={`/dashboard/locations/${location.id}`}
                  className="text-sm text-primary hover:underline"
                >
                  {location.name}
                </Link>
              )}
              <CardTitle className="text-xl">
                {review.reviewer_name || "Anonymous"}
              </CardTitle>
              <div className="flex flex-wrap items-center gap-3">
                <StarRating rating={review.rating} size="lg" />
                <Badge
                  variant="outline"
                  className={SOURCE_COLORS[review.source] || ""}
                >
                  {review.source}
                </Badge>
                {review.sentiment && (
                  <Badge
                    variant="outline"
                    className={SENTIMENT_COLORS[review.sentiment] || ""}
                  >
                    {review.sentiment}
                    {review.sentiment_score !== null &&
                      ` (${Math.round(review.sentiment_score * 100)}%)`}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {new Date(
                  review.review_date || review.created_at,
                ).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>

            {/* Delete button */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete Review</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to delete this review? This action
                    cannot be undone. All generated responses will also be
                    deleted.
                  </DialogDescription>
                </DialogHeader>
                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setDeleteDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDeleteReview}
                    disabled={deleting}
                  >
                    {deleting ? "Deleting..." : "Delete Review"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Tags */}
          {review.tags && review.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {review.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap text-sm leading-relaxed">
            {review.review_text}
          </p>
        </CardContent>
      </Card>

      {/* Response section */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">AI Response</h2>

        {latestResponse ? (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardDescription>
                  Generated{" "}
                  {new Date(latestResponse.created_at).toLocaleDateString(
                    "en-US",
                    { year: "numeric", month: "short", day: "numeric" },
                  )}
                  {latestResponse.tone && ` - ${latestResponse.tone} tone`}
                </CardDescription>
                <div className="flex items-center gap-2">
                  <Label htmlFor="posted-toggle" className="text-xs text-muted-foreground">
                    Posted
                  </Label>
                  <Switch
                    id="posted-toggle"
                    checked={latestResponse.is_used}
                    onCheckedChange={() =>
                      handleTogglePosted(
                        latestResponse.id,
                        latestResponse.is_used,
                      )
                    }
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="whitespace-pre-wrap text-sm leading-relaxed">
                {latestResponse.content}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopyToClipboard(latestResponse.content)}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copy to Clipboard
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateResponse}
                  disabled={generating}
                >
                  {generating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Regenerating...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Regenerate
                    </>
                  )}
                </Button>
              </div>
              {review.responses.length > 1 && (
                <p className="text-xs text-muted-foreground">
                  {review.responses.length} responses generated total (showing
                  most recent)
                </p>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-8 text-center">
              <Sparkles className="mb-3 h-8 w-8 text-muted-foreground" />
              <h3 className="font-semibold">No response generated yet</h3>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Generate an AI-powered response to this review that matches your
                business tone.
              </p>
              <Button
                className="mt-4"
                onClick={handleGenerateResponse}
                disabled={generating}
              >
                {generating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate AI Response
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
