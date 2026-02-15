import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkReviewLimit } from "@/lib/usage";
import { getUserPlan } from "@/lib/stripe/plans";
import { analyzeSentimentBatch } from "@/lib/ai/analyze-sentiment";
import { z } from "zod";

export const maxDuration = 60;

const importSchema = z.object({
  location_id: z.string().uuid(),
  reviews: z
    .array(
      z.object({
        source: z
          .enum(["google", "yelp", "facebook", "other"])
          .default("google"),
        reviewer_name: z.string().optional(),
        rating: z.number().min(1).max(5),
        review_text: z.string().min(5),
        review_date: z.string().optional(),
      }),
    )
    .min(1)
    .max(100),
});

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Check CSV import is allowed for this plan
  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_plan")
    .eq("id", user.id)
    .single();

  const plan = getUserPlan(profile?.subscription_plan ?? null);
  if (!plan.limits.csv_import) {
    return NextResponse.json(
      { error: "CSV import requires Pro plan or higher." },
      { status: 403 },
    );
  }

  const limit = await checkReviewLimit();

  const body = await req.json();
  const parsed = importSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const reviewCount = parsed.data.reviews.length;

  // Check if importing would exceed limit
  if (limit.limit !== Infinity && limit.used + reviewCount > limit.limit) {
    return NextResponse.json(
      {
        error: `Import would exceed monthly limit. You have ${limit.limit - limit.used} reviews remaining.`,
      },
      { status: 429 },
    );
  }

  // Batch sentiment analysis
  const sentiments = await analyzeSentimentBatch(
    parsed.data.reviews.map((r) => ({ text: r.review_text, rating: r.rating })),
  );

  // Insert all reviews
  const reviewsToInsert = parsed.data.reviews.map((r, i) => ({
    user_id: user.id,
    location_id: parsed.data.location_id,
    ...r,
    sentiment: sentiments[i].sentiment,
    sentiment_score: sentiments[i].score,
    tags: sentiments[i].tags,
  }));

  const { data, error } = await supabase
    .from("reviews")
    .insert(reviewsToInsert)
    .select();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ imported: data?.length ?? 0 });
}
