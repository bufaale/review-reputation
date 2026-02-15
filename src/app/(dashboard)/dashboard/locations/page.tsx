"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { MapPin, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Location } from "@/types/database";

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
import { Badge } from "@/components/ui/badge";

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

export default function LocationsPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [googleMapsUrl, setGoogleMapsUrl] = useState("");
  const [industry, setIndustry] = useState("");
  const [tone, setTone] = useState<"professional" | "friendly" | "casual">(
    "professional",
  );

  const fetchLocations = useCallback(async () => {
    try {
      const res = await fetch("/api/locations");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to fetch locations");
      setLocations(json.locations);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load locations");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  function resetForm() {
    setName("");
    setAddress("");
    setGoogleMapsUrl("");
    setIndustry("");
    setTone("professional");
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload: Record<string, string> = { name, tone };
      if (address) payload.address = address;
      if (googleMapsUrl) payload.google_maps_url = googleMapsUrl;
      if (industry) payload.industry = industry;

      const res = await fetch("/api/locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to create location");

      setLocations((prev) => [json.location, ...prev]);
      toast.success("Location created successfully");
      setDialogOpen(false);
      resetForm();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create location");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/locations/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to delete location");

      setLocations((prev) => prev.filter((loc) => loc.id !== id));
      toast.success("Location deleted successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete location");
    } finally {
      setDeleteConfirm(null);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Locations</h1>
            <p className="mt-1 text-muted-foreground">
              Manage your business locations
            </p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 w-32 rounded bg-muted" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-4 w-48 rounded bg-muted" />
                  <div className="h-4 w-24 rounded bg-muted" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Locations</h1>
          <p className="mt-1 text-muted-foreground">
            Manage your business locations
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Location
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add Location</DialogTitle>
              <DialogDescription>
                Add a new business location to manage reviews.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Business Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="My Business"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="123 Main St, City, State"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="google_maps_url">Google Maps URL</Label>
                <Input
                  id="google_maps_url"
                  type="url"
                  value={googleMapsUrl}
                  onChange={(e) => setGoogleMapsUrl(e.target.value)}
                  placeholder="https://maps.google.com/..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="industry">Industry</Label>
                <Select value={industry} onValueChange={setIndustry}>
                  <SelectTrigger id="industry">
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
                          name="tone"
                          value={t}
                          checked={tone === t}
                          onChange={() => setTone(t)}
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
                  onClick={() => setDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting || !name.trim()}>
                  {submitting ? "Creating..." : "Create Location"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {locations.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <MapPin className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="text-lg font-semibold">No locations yet</h3>
            <p className="mt-1 max-w-sm text-muted-foreground">
              Add your first business location to start managing reviews.
            </p>
            <Button className="mt-4" onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Location
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {locations.map((location) => (
            <Card key={location.id} className="group relative">
              <Link href={`/dashboard/locations/${location.id}`}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{location.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {location.address && (
                    <p className="text-sm text-muted-foreground">
                      {location.address}
                    </p>
                  )}
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
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Reviews: &mdash;
                  </p>
                </CardContent>
              </Link>

              {/* Delete button */}
              {deleteConfirm === location.id ? (
                <div className="absolute right-2 top-2 flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={(e) => {
                      e.preventDefault();
                      handleDelete(location.id);
                    }}
                  >
                    Confirm
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.preventDefault();
                      setDeleteConfirm(null);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100"
                  onClick={(e) => {
                    e.preventDefault();
                    setDeleteConfirm(location.id);
                  }}
                >
                  <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                </Button>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
