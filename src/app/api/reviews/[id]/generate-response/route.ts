import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkAIResponseLimit } from "@/lib/usage";
import { generateReviewResponse } from "@/lib/ai/generate-response";

export const maxDuration = 30;

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const limit = await checkAIResponseLimit();
  if (!limit.allowed) {
    return NextResponse.json(
      {
        error: `AI response limit reached (${limit.used}/${limit.limit}). Upgrade your plan.`,
      },
      { status: 429 },
    );
  }

  // Fetch review with location info
  const { data: review } = await supabase
    .from("reviews")
    .select("*, locations(*)")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!review)
    return NextResponse.json({ error: "Review not found" }, { status: 404 });

  const location = review.locations as unknown as {
    name: string;
    industry: string | null;
    tone: string;
  };

  const content = await generateReviewResponse({
    reviewText: review.review_text,
    rating: review.rating,
    businessName: location.name,
    industry: location.industry,
    tone: location.tone as "professional" | "friendly" | "casual",
    reviewerName: review.reviewer_name,
  });

  const { data: response, error } = await supabase
    .from("responses")
    .insert({ review_id: id, content, tone: location.tone })
    .select()
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ response });
}
