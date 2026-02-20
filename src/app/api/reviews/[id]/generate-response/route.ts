import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkAIResponseLimit } from "@/lib/usage";
import {
  generateReviewResponse,
  generateMultiToneResponses,
} from "@/lib/ai/generate-response";

export const maxDuration = 30;

export async function POST(
  req: Request,
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

  // Check if multi-tone mode requested
  let multiTone = false;
  let customContext: string | undefined;
  try {
    const body = await req.json();
    multiTone = body?.multi_tone === true;
    customContext = body?.context;
  } catch {
    // No body — default single-tone mode
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

  if (multiTone) {
    // Generate 3 responses in different tones
    const toneResponses = await generateMultiToneResponses({
      reviewText: review.review_text,
      rating: review.rating,
      businessName: location.name,
      industry: location.industry,
      reviewerName: review.reviewer_name,
      customContext,
    });

    // Insert all responses into DB
    const inserts = toneResponses.map((r) => ({
      review_id: id,
      content: r.content,
      tone: r.tone,
    }));

    const { data: responses, error } = await supabase
      .from("responses")
      .insert(inserts)
      .select();

    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });

    // Combine DB responses with keyApproach from AI
    const enrichedResponses = (responses || []).map((dbResponse, i) => ({
      ...dbResponse,
      keyApproach: toneResponses[i]?.keyApproach || "",
    }));

    return NextResponse.json({ responses: enrichedResponses, multiTone: true });
  }

  // Single tone (legacy behavior)
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
