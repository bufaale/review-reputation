import { generateObject } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";
import { sanitizeUserInput } from "@/lib/security/ai-safety";

const responseSchema = z.object({
  content: z
    .string()
    .describe(
      "A professional, on-brand response to the review. 2-4 sentences.",
    ),
});

export async function generateReviewResponse(params: {
  reviewText: string;
  rating: number;
  businessName: string;
  industry: string | null;
  tone: "professional" | "friendly" | "casual";
  reviewerName: string | null;
}): Promise<string> {
  const { reviewText, rating, businessName, industry, tone, reviewerName } =
    params;

  const systemPrompt = `You are an expert at writing business review responses for local businesses.
Write a response that is ${tone}, empathetic, and on-brand.
For negative reviews (1-2 stars): acknowledge the issue, apologize sincerely, offer to resolve.
For neutral reviews (3 stars): thank them, acknowledge feedback, mention improvements.
For positive reviews (4-5 stars): express genuine gratitude, be warm, invite them back.
Keep responses 2-4 sentences. Never be defensive or dismissive.`;

  const userPrompt = `Write a review response for ${sanitizeUserInput(businessName)}${industry ? ` (${sanitizeUserInput(industry)})` : ""}.

<review_data>
Review by: ${sanitizeUserInput(reviewerName || "a customer")}
Rating: ${rating}/5 stars
Review: "${sanitizeUserInput(reviewText)}"
</review_data>

Tone: ${tone}`;

  const { object } = await generateObject({
    model: anthropic("claude-haiku-4-5-20251001"),
    schema: responseSchema,
    system: systemPrompt,
    prompt: userPrompt,
    maxOutputTokens: 500,
  });

  return object.content;
}
