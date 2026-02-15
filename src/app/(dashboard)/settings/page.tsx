"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getUserPlan } from "@/lib/stripe/plans";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const DEFAULT_PRIMARY_COLOR = "#2563eb";
const DEFAULT_SECONDARY_COLOR = "#1e40af";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingBrand, setSavingBrand] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [userId, setUserId] = useState<string | null>(null);

  // Brand settings
  const [companyName, setCompanyName] = useState("");
  const [companyLogoUrl, setCompanyLogoUrl] = useState("");
  const [primaryColor, setPrimaryColor] = useState(DEFAULT_PRIMARY_COLOR);
  const [secondaryColor, setSecondaryColor] = useState(
    DEFAULT_SECONDARY_COLOR,
  );
  const [subscriptionPlan, setSubscriptionPlan] = useState<string | null>(null);

  const userPlan = getUserPlan(subscriptionPlan);
  const canCustomizeBrand = userPlan.limits.brand_customization;

  useEffect(() => {
    async function loadProfile() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      setUserId(user.id);
      setEmail(user.email || "");

      const { data: profile } = await supabase
        .from("profiles")
        .select(
          "full_name, avatar_url, company_name, company_logo_url, primary_color, secondary_color, subscription_plan",
        )
        .eq("id", user.id)
        .single();

      if (profile) {
        setFullName(profile.full_name || "");
        setAvatarUrl(profile.avatar_url || "");
        setCompanyName(profile.company_name || "");
        setCompanyLogoUrl(profile.company_logo_url || "");
        setPrimaryColor(profile.primary_color || DEFAULT_PRIMARY_COLOR);
        setSecondaryColor(profile.secondary_color || DEFAULT_SECONDARY_COLOR);
        setSubscriptionPlan(profile.subscription_plan || null);
      }

      setLoading(false);
    }

    loadProfile();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();

    if (!userId) return;

    setSaving(true);

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: fullName, avatar_url: avatarUrl })
        .eq("id", userId);

      if (error) throw error;

      toast.success("Profile updated successfully");
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveBrand(e: React.FormEvent) {
    e.preventDefault();

    if (!userId || !canCustomizeBrand) return;

    setSavingBrand(true);

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("profiles")
        .update({
          company_name: companyName,
          company_logo_url: companyLogoUrl,
          primary_color: primaryColor,
          secondary_color: secondaryColor,
        })
        .eq("id", userId);

      if (error) throw error;

      toast.success("Brand settings updated successfully");
    } catch {
      toast.error("Failed to update brand settings");
    } finally {
      setSavingBrand(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-9 w-48" />
          <Skeleton className="mt-2 h-5 w-64" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-24" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-56" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-32" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Profile Settings</h1>
        <p className="mt-1 text-muted-foreground">
          Manage your account information
        </p>
      </div>

      {/* Profile Card */}
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Update your personal information</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your full name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={email}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                Email cannot be changed here
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="avatarUrl">Avatar URL</Label>
              <Input
                id="avatarUrl"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://example.com/avatar.png"
              />
            </div>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Brand Settings Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle>Brand Settings</CardTitle>
            {!canCustomizeBrand && <Badge variant="secondary">Pro</Badge>}
          </div>
          <CardDescription>
            Customize your brand appearance for review requests and public pages
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!canCustomizeBrand && (
            <p className="mb-4 text-sm text-muted-foreground">
              Upgrade to Pro to customize your brand.
            </p>
          )}
          <form onSubmit={handleSaveBrand} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Acme Inc."
                disabled={!canCustomizeBrand}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyLogoUrl">Company Logo URL</Label>
              <Input
                id="companyLogoUrl"
                value={companyLogoUrl}
                onChange={(e) => setCompanyLogoUrl(e.target.value)}
                placeholder="https://example.com/logo.png"
                disabled={!canCustomizeBrand}
              />
              {companyLogoUrl && (
                <img
                  src={companyLogoUrl}
                  alt="Company logo preview"
                  className="mt-1 max-h-12 object-contain"
                />
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="primaryColor">Primary Color</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  id="primaryColor"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  disabled={!canCustomizeBrand}
                  className="h-10 w-10 cursor-pointer rounded border p-0.5 disabled:cursor-not-allowed disabled:opacity-50"
                />
                <Input
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  placeholder="#2563eb"
                  disabled={!canCustomizeBrand}
                  className="flex-1"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="secondaryColor">Secondary Color</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  id="secondaryColor"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  disabled={!canCustomizeBrand}
                  className="h-10 w-10 cursor-pointer rounded border p-0.5 disabled:cursor-not-allowed disabled:opacity-50"
                />
                <Input
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  placeholder="#1e40af"
                  disabled={!canCustomizeBrand}
                  className="flex-1"
                />
              </div>
            </div>
            <Button type="submit" disabled={savingBrand || !canCustomizeBrand}>
              {savingBrand && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {savingBrand ? "Saving..." : "Save Brand Settings"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
