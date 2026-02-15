import { createClient } from "@/lib/supabase/server";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { ReputationScore } from "@/components/dashboard/reputation-score";
import { SentimentChart } from "@/components/dashboard/sentiment-chart";
import { RecentReviews } from "@/components/dashboard/recent-reviews";
import { calculateReputationScore } from "@/lib/reputation";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch all reviews with responses joined
  const { data: reviews } = await supabase
    .from("reviews")
    .select("*, responses(*)")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  const allReviews = reviews ?? [];
  const totalReviews = allReviews.length;

  // Average rating
  const avgRating =
    totalReviews > 0
      ? allReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
      : 0;

  // Sentiment counts
  const sentimentCounts = { positive: 0, neutral: 0, negative: 0 };
  for (const r of allReviews) {
    if (r.sentiment === "positive") sentimentCounts.positive++;
    else if (r.sentiment === "negative") sentimentCounts.negative++;
    else sentimentCounts.neutral++;
  }

  const positivePercent = totalReviews > 0 ? sentimentCounts.positive / totalReviews : 0;

  // Response rate: reviews with at least 1 response marked is_used
  const reviewsWithUsedResponse = allReviews.filter(
    (r) =>
      Array.isArray(r.responses) &&
      r.responses.some((resp: { is_used: boolean }) => resp.is_used),
  ).length;
  const responseRate = totalReviews > 0 ? reviewsWithUsedResponse / totalReviews : 0;

  // Pending responses: reviews with 0 responses
  const pendingResponses = allReviews.filter(
    (r) => !Array.isArray(r.responses) || r.responses.length === 0,
  ).length;

  // Recent trend: compare avg sentiment_score of last 30 days vs previous 30 days
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  const recentReviews = allReviews.filter(
    (r) => new Date(r.created_at) >= thirtyDaysAgo,
  );
  const olderReviews = allReviews.filter(
    (r) =>
      new Date(r.created_at) >= sixtyDaysAgo &&
      new Date(r.created_at) < thirtyDaysAgo,
  );

  const avgSentimentRecent =
    recentReviews.length > 0
      ? recentReviews.reduce((sum, r) => sum + (r.sentiment_score ?? 0), 0) /
        recentReviews.length
      : 0;
  const avgSentimentOlder =
    olderReviews.length > 0
      ? olderReviews.reduce((sum, r) => sum + (r.sentiment_score ?? 0), 0) /
        olderReviews.length
      : 0;

  let recentTrend = 0;
  if (olderReviews.length > 0 && recentReviews.length > 0) {
    const diff = avgSentimentRecent - avgSentimentOlder;
    recentTrend = Math.max(-1, Math.min(1, diff));
  }

  // Calculate reputation score
  const reputationScore = calculateReputationScore({
    avgRating,
    totalReviews,
    responseRate,
    positivePercent,
    recentTrend,
  });

  // Recent 5 reviews for the list
  const recentFive = allReviews.slice(0, 5).map((r) => ({
    id: r.id as string,
    reviewer_name: r.reviewer_name as string | null,
    rating: r.rating as number,
    review_text: r.review_text as string,
    sentiment: r.sentiment as string | null,
    created_at: r.created_at as string,
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="mt-1 text-muted-foreground">
          Welcome back, {user?.user_metadata?.full_name || user?.email || "there"}
        </p>
      </div>

      <StatsCards
        totalReviews={totalReviews}
        averageRating={avgRating}
        responseRate={responseRate}
        pendingResponses={pendingResponses}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <ReputationScore score={reputationScore} />
        <SentimentChart
          positive={sentimentCounts.positive}
          neutral={sentimentCounts.neutral}
          negative={sentimentCounts.negative}
        />
      </div>

      <RecentReviews reviews={recentFive} />
    </div>
  );
}
