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

const multiResponseSchema = z.object({
  responses: z
    .array(
      z.object({
        tone: z
          .enum(["professional", "friendly", "casual"])
          .describe("The tone used for this response"),
        content: z
          .string()
          .describe(
            "A response to the review in the specified tone. 2-4 sentences.",
          ),
        keyApproach: z
          .string()
          .max(100)
          .describe(
            "Brief description of the approach used (e.g., 'Formal apology with resolution offer')",
          ),
      }),
    )
    .length(3)
    .describe("Three response options, one per tone"),
});

export interface MultiToneResponse {
  tone: "professional" | "friendly" | "casual";
  content: string;
  keyApproach: string;
}

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

export async function generateMultiToneResponses(params: {
  reviewText: string;
  rating: number;
  businessName: string;
  industry: string | null;
  reviewerName: string | null;
  customContext?: string;
}): Promise<MultiToneResponse[]> {
  const { reviewText, rating, businessName, industry, reviewerName, customContext } =
    params;

  const systemPrompt = `You are an expert at writing business review responses for local businesses.
Generate THREE different response options in different tones: professional, friendly, and casual.
Each response should be unique and tailored to the tone while addressing the same review.
For negative reviews (1-2 stars): acknowledge the issue, apologize sincerely, offer to resolve.
For neutral reviews (3 stars): thank them, acknowledge feedback, mention improvements.
For positive reviews (4-5 stars): express genuine gratitude, be warm, invite them back.
Keep each response 2-4 sentences. Never be defensive or dismissive.
Professional tone: formal, corporate, polished language.
Friendly tone: warm, personal, conversational but respectful.
Casual tone: relaxed, approachable, like talking to a neighbor.`;

  const userPrompt = `Write three review responses in different tones for ${sanitizeUserInput(businessName)}${industry ? ` (${sanitizeUserInput(industry)})` : ""}.

<review_data>
Review by: ${sanitizeUserInput(reviewerName || "a customer")}
Rating: ${rating}/5 stars
Review: "${sanitizeUserInput(reviewText)}"
</review_data>${customContext ? `\n\n<business_context>\n${sanitizeUserInput(customContext)}\n</business_context>` : ""}

Generate one response per tone: professional, friendly, casual.`;

  try {
    const { object } = await generateObject({
      model: anthropic("claude-haiku-4-5-20251001"),
      schema: multiResponseSchema,
      system: systemPrompt,
      prompt: userPrompt,
      maxOutputTokens: 1500,
    });

    return object.responses as MultiToneResponse[];
  } catch (error) {
    console.error("Multi-tone generation failed:", error);
    // Fallback: generate single response with default tone
    const content = await generateReviewResponse({
      reviewText,
      rating,
      businessName,
      industry,
      tone: "professional",
      reviewerName,
    });
    return [
      { tone: "professional", content, keyApproach: "Standard professional response" },
    ];
  }
}
