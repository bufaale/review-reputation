interface ReputationInput {
  avgRating: number;
  totalReviews: number;
  responseRate: number;
  positivePercent: number;
  recentTrend: number;
}

export function calculateReputationScore(input: ReputationInput): number {
  const { avgRating, totalReviews, responseRate, positivePercent, recentTrend } = input;

  const ratingScore = (avgRating / 5) * 100;
  const volumeBonus = Math.min(Math.log10(totalReviews + 1) * 5, 10);
  const responseBonus = responseRate * 10;
  const sentimentBonus = positivePercent * 10;
  const trendBonus = recentTrend * 5;

  const score = Math.round(
    Math.min(100, Math.max(0, ratingScore * 0.7 + volumeBonus + responseBonus + sentimentBonus + trendBonus)),
  );

  return score;
}

export function getScoreLabel(score: number): { label: string; color: string } {
  if (score >= 80) return { label: "Excellent", color: "text-green-600" };
  if (score >= 60) return { label: "Good", color: "text-blue-600" };
  if (score >= 40) return { label: "Fair", color: "text-yellow-600" };
  return { label: "Needs Work", color: "text-red-600" };
}
