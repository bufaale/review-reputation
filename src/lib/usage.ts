import { createClient } from "@/lib/supabase/server";
import { getUserPlan } from "@/lib/stripe/plans";

interface LimitCheck {
  allowed: boolean;
  used: number;
  limit: number;
  plan: string;
}

async function getPlanForUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, plan: getUserPlan(null) };

  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_plan")
    .eq("id", user.id)
    .single();

  return { supabase, user, plan: getUserPlan(profile?.subscription_plan ?? null) };
}

function startOfMonth(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
}

export async function checkLocationLimit(): Promise<LimitCheck> {
  const { supabase, user, plan } = await getPlanForUser();
  if (!user) return { allowed: false, used: 0, limit: 0, plan: "free" };

  const { count } = await supabase
    .from("locations")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  const used = count ?? 0;
  return { allowed: used < plan.limits.locations, used, limit: plan.limits.locations, plan: plan.id };
}

export async function checkReviewLimit(): Promise<LimitCheck> {
  const { supabase, user, plan } = await getPlanForUser();
  if (!user) return { allowed: false, used: 0, limit: 0, plan: "free" };

  if (plan.limits.reviews_per_month === Infinity) {
    return { allowed: true, used: 0, limit: Infinity, plan: plan.id };
  }

  const { count } = await supabase
    .from("reviews")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", startOfMonth());

  const used = count ?? 0;
  return { allowed: used < plan.limits.reviews_per_month, used, limit: plan.limits.reviews_per_month, plan: plan.id };
}

export async function checkAIResponseLimit(): Promise<LimitCheck> {
  const { supabase, user, plan } = await getPlanForUser();
  if (!user) return { allowed: false, used: 0, limit: 0, plan: "free" };

  if (plan.limits.ai_responses_per_month === Infinity) {
    return { allowed: true, used: 0, limit: Infinity, plan: plan.id };
  }

  // Count responses created this month for reviews owned by this user
  const { count } = await supabase
    .from("responses")
    .select("*, reviews!inner(user_id)", { count: "exact", head: true })
    .eq("reviews.user_id", user.id)
    .gte("created_at", startOfMonth());

  const used = count ?? 0;
  return { allowed: used < plan.limits.ai_responses_per_month, used, limit: plan.limits.ai_responses_per_month, plan: plan.id };
}

export async function checkReviewRequestLimit(): Promise<LimitCheck> {
  const { supabase, user, plan } = await getPlanForUser();
  if (!user) return { allowed: false, used: 0, limit: 0, plan: "free" };

  if (plan.limits.review_requests_per_month === Infinity) {
    return { allowed: true, used: 0, limit: Infinity, plan: plan.id };
  }

  const { count } = await supabase
    .from("review_requests")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", startOfMonth());

  const used = count ?? 0;
  return { allowed: used < plan.limits.review_requests_per_month, used, limit: plan.limits.review_requests_per_month, plan: plan.id };
}
