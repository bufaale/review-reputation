"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ExternalLink,
  Pencil,
  Star,
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import type { Location, ReviewWithResponse } from "@/types/database";
import { CsvImport } from "@/components/reviews/csv-import";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const INDUSTRIES = [
  "restaurant",
  "dental",
  "salon",
  "retail",
  "hotel",
  "medical",
  "automotive",
  "other",
] as const;

const TONE_COLORS: Record<string, string> = {
  professional: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  friendly: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  casual: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
};

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

export default function LocationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const supabase = createClient();

  const [location, setLocation] = useState<Location | null>(null);
  const [reviews, setReviews] = useState<ReviewWithResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("reviews");

  // Edit form state
  const [editName, setEditName] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editGoogleMapsUrl, setEditGoogleMapsUrl] = useState("");
  const [editIndustry, setEditIndustry] = useState("");
  const [editTone, setEditTone] = useState<
    "professional" | "friendly" | "casual"
  >("professional");

  // Add review form state
  const [reviewSource, setReviewSource] = useState<string>("google");
  const [reviewerName, setReviewerName] = useState("");
  const [reviewRating, setReviewRating] = useState("5");
  const [reviewText, setReviewText] = useState("");
  const [reviewDate, setReviewDate] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  const fetchLocation = useCallback(async () => {
    const { data, error } = await supabase
      .from("locations")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      toast.error("Failed to load location");
      return;
    }
    setLocation(data);
    // Populate edit form
    setEditName(data.name);
    setEditAddress(data.address || "");
    setEditGoogleMapsUrl(data.google_maps_url || "");
    setEditIndustry(data.industry || "");
    setEditTone(data.tone);
  }, [id, supabase]);

  const fetchReviews = useCallback(async () => {
    const { data, error } = await supabase
      .from("reviews")
      .select("*, responses(*)")
      .eq("location_id", id)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load reviews");
      return;
    }
    setReviews((data as unknown as ReviewWithResponse[]) || []);
  }, [id, supabase]);

  useEffect(() => {
    async function loadData() {
      await Promise.all([fetchLocation(), fetchReviews()]);
      setLoading(false);
    }
    loadData();
  }, [fetchLocation, fetchReviews]);

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    setEditSubmitting(true);

    try {
      const payload: Record<string, string> = { name: editName, tone: editTone };
      if (editAddress) payload.address = editAddress;
      if (editGoogleMapsUrl) payload.google_maps_url = editGoogleMapsUrl;
      if (editIndustry) payload.industry = editIndustry;

      const res = await fetch(`/api/locations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to update location");

      setLocation(json.location);
      toast.success("Location updated successfully");
      setEditOpen(false);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update location",
      );
    } finally {
      setEditSubmitting(false);
    }
  }

  async function handleAddReview(e: React.FormEvent) {
    e.preventDefault();
    setReviewSubmitting(true);

    try {
      const payload: Record<string, unknown> = {
        location_id: id,
        source: reviewSource,
        rating: parseInt(reviewRating, 10),
        review_text: reviewText,
      };
      if (reviewerName) payload.reviewer_name = reviewerName;
      if (reviewDate) payload.review_date = reviewDate;

      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to add review");

      toast.success("Review added successfully");
      // Reset form
      setReviewerName("");
      setReviewRating("5");
      setReviewText("");
      setReviewDate("");
      setReviewSource("google");
      // Refresh reviews and switch to reviews tab
      await fetchReviews();
      setActiveTab("reviews");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to add review",
      );
    } finally {
      setReviewSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="h-32 animate-pulse rounded-lg bg-muted" />
      </div>
    );
  }

  if (!location) {
    return (
      <div className="space-y-4">
        <Link
          href="/dashboard/locations"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Locations
        </Link>
        <p className="text-muted-foreground">Location not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/dashboard/locations"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Locations
      </Link>

      {/* Location header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">{location.name}</h1>
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            {location.address && <span>{location.address}</span>}
            {location.google_maps_url && (
              <a
                href={location.google_maps_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-primary hover:underline"
              >
                Google Maps
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {location.industry && (
              <Badge variant="secondary" className="capitalize">
                {location.industry}
              </Badge>
            )}
            <Badge
              variant="outline"
              className={TONE_COLORS[location.tone] || ""}
            >
              {location.tone}
            </Badge>
            <Badge variant="secondary">
              {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
            </Badge>
          </div>
        </div>

        {/* Edit button + dialog */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Edit Location</DialogTitle>
              <DialogDescription>
                Update the details for this business location.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEdit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Business Name *</Label>
                <Input
                  id="edit-name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-address">Address</Label>
                <Input
                  id="edit-address"
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-google-maps-url">Google Maps URL</Label>
                <Input
                  id="edit-google-maps-url"
                  type="url"
                  value={editGoogleMapsUrl}
                  onChange={(e) => setEditGoogleMapsUrl(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-industry">Industry</Label>
                <Select value={editIndustry} onValueChange={setEditIndustry}>
                  <SelectTrigger id="edit-industry">
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent>
                    {INDUSTRIES.map((ind) => (
                      <SelectItem key={ind} value={ind}>
                        {ind.charAt(0).toUpperCase() + ind.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Response Tone</Label>
                <div className="flex gap-3">
                  {(["professional", "friendly", "casual"] as const).map(
                    (t) => (
                      <label
                        key={t}
                        className="flex cursor-pointer items-center gap-2"
                      >
                        <input
                          type="radio"
                          name="edit-tone"
                          value={t}
                          checked={editTone === t}
                          onChange={() => setEditTone(t)}
                          className="accent-primary"
                        />
                        <span className="text-sm capitalize">{t}</span>
                      </label>
                    ),
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={editSubmitting || !editName.trim()}
                >
                  {editSubmitting ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabs: Reviews + Add Review */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
          <TabsTrigger value="add-review">Add Review</TabsTrigger>
          <TabsTrigger value="import-csv">Import CSV</TabsTrigger>
        </TabsList>

        <TabsContent value="reviews" className="mt-4 space-y-4">
          {reviews.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Star className="mb-4 h-10 w-10 text-muted-foreground" />
                <h3 className="text-lg font-semibold">No reviews yet</h3>
                <p className="mt-1 max-w-sm text-muted-foreground">
                  Add your first review or import reviews to get started.
                </p>
                <Button
                  className="mt-4"
                  variant="outline"
                  onClick={() => setActiveTab("add-review")}
                >
                  Add a Review
                </Button>
              </CardContent>
            </Card>
          ) : (
            reviews.map((review) => (
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
                      <div className="flex items-center gap-2">
                        {review.sentiment && (
                          <Badge
                            variant="outline"
                            className={
                              SENTIMENT_COLORS[review.sentiment] || ""
                            }
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
                    <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                      <span>
                        {new Date(
                          review.review_date || review.created_at,
                        ).toLocaleDateString()}
                      </span>
                      {review.responses && review.responses.length > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {review.responses.length}{" "}
                          {review.responses.length === 1
                            ? "response"
                            : "responses"}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))
          )}
        </TabsContent>

        <TabsContent value="add-review" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Add a Review</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddReview} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="review-source">Source</Label>
                    <Select
                      value={reviewSource}
                      onValueChange={setReviewSource}
                    >
                      <SelectTrigger id="review-source">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="google">Google</SelectItem>
                        <SelectItem value="yelp">Yelp</SelectItem>
                        <SelectItem value="facebook">Facebook</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reviewer-name">Reviewer Name</Label>
                    <Input
                      id="reviewer-name"
                      value={reviewerName}
                      onChange={(e) => setReviewerName(e.target.value)}
                      placeholder="John Doe"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="review-rating">Rating (1-5)</Label>
                    <Select
                      value={reviewRating}
                      onValueChange={setReviewRating}
                    >
                      <SelectTrigger id="review-rating">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[5, 4, 3, 2, 1].map((r) => (
                          <SelectItem key={r} value={r.toString()}>
                            {"★".repeat(r)}
                            {"☆".repeat(5 - r)} ({r})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="review-date">Review Date</Label>
                    <Input
                      id="review-date"
                      type="date"
                      value={reviewDate}
                      onChange={(e) => setReviewDate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="review-text">Review Text *</Label>
                  <Textarea
                    id="review-text"
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    placeholder="Enter the customer's review text..."
                    rows={4}
                    required
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setActiveTab("reviews")}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={reviewSubmitting || !reviewText.trim()}
                  >
                    {reviewSubmitting ? "Adding..." : "Add Review"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="import-csv" className="mt-4">
          <CsvImport
            locationId={id}
            onImportComplete={async () => {
              await fetchReviews();
              setActiveTab("reviews");
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
