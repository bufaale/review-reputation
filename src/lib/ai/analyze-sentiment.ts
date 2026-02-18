import { generateObject } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";
import { sanitizeUserInput } from "@/lib/security/ai-safety";

const sentimentSchema = z.object({
  sentiment: z.enum(["positive", "neutral", "negative"]),
  score: z.number().min(0).max(1).describe("Confidence score from 0 to 1"),
  tags: z
    .array(z.string())
    .describe(
      "2-5 topic tags extracted from the review, e.g. 'service', 'wait time', 'food quality'",
    ),
});

export type SentimentResult = z.infer<typeof sentimentSchema>;

export async function analyzeSentiment(
  reviewText: string,
  rating: number,
): Promise<SentimentResult> {
  const { object } = await generateObject({
    model: anthropic("claude-haiku-4-5-20251001"),
    schema: sentimentSchema,
    system:
      "You are a sentiment analysis expert. Analyze the review and extract sentiment, confidence, and topic tags. Use the rating as additional context but base sentiment primarily on the text content.",
    prompt: `Rating: ${rating}/5

<review_data>
${sanitizeUserInput(reviewText)}
</review_data>

Analyze the review above based on the rating and text content.`,
    maxOutputTokens: 500,
  });

  return object;
}

export async function analyzeSentimentBatch(
  reviews: { text: string; rating: number }[],
): Promise<SentimentResult[]> {
  const results = await Promise.all(
    reviews.map((r) => analyzeSentiment(r.text, r.rating)),
  );
  return results;
}
