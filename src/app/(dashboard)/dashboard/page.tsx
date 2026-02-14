import { createClient } from "@/lib/supabase/server";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { pricingPlans } from "@/lib/stripe/plans";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch profile for plan info
  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_plan, subscription_status")
    .eq("id", user!.id)
    .single();

  // Fetch total reviews count
  const { count: reviewsCount } = await supabase
    .from("reviews")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user!.id);

  // Fetch average rating
  const { data: ratingData } = await supabase
    .from("reviews")
    .select("rating")
    .eq("user_id", user!.id);

  const avgRating =
    ratingData && ratingData.length > 0
      ? ratingData.reduce((sum, r) => sum + r.rating, 0) / ratingData.length
      : 0;

  const plan = pricingPlans.find((p) => p.id === profile?.subscription_plan) || pricingPlans[0];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="mt-1 text-muted-foreground">
          Welcome back, {user?.user_metadata?.full_name || user?.email || "there"}
        </p>
      </div>
      <StatsCards
        totalReviews={reviewsCount ?? 0}
        averageRating={avgRating}
        planName={plan.name}
        status={profile?.subscription_status ?? "free"}
      />
      <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
        Your reviews and reputation dashboard will appear here.
      </div>
    </div>
  );
}
