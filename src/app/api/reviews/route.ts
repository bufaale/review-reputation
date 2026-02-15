import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkReviewLimit } from "@/lib/usage";
import { analyzeSentiment } from "@/lib/ai/analyze-sentiment";
import { z } from "zod";

export const maxDuration = 30;

const createSchema = z.object({
  location_id: z.string().uuid(),
  source: z.enum(["google", "yelp", "facebook", "other"]).default("google"),
  reviewer_name: z.string().optional(),
  rating: z.number().min(1).max(5),
  review_text: z.string().min(5),
  review_date: z.string().optional(),
});

export async function GET(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const locationId = searchParams.get("location_id");

  let query = supabase
    .from("reviews")
    .select("*, responses(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (locationId) query = query.eq("location_id", locationId);

  const { data, error } = await query;
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ reviews: data });
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const limit = await checkReviewLimit();
  if (!limit.allowed) {
    return NextResponse.json(
      {
        error: `Monthly review limit reached (${limit.used}/${limit.limit}). Upgrade your plan.`,
      },
      { status: 429 },
    );
  }

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  // AI sentiment analysis
  const sentiment = await analyzeSentiment(
    parsed.data.review_text,
    parsed.data.rating,
  );

  const { data, error } = await supabase
    .from("reviews")
    .insert({
      user_id: user.id,
      ...parsed.data,
      sentiment: sentiment.sentiment,
      sentiment_score: sentiment.score,
      tags: sentiment.tags,
    })
    .select()
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ review: data });
}
