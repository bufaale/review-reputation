"use client";

import { getScoreLabel } from "@/lib/reputation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ReputationScoreProps {
  score: number;
}

export function ReputationScore({ score }: ReputationScoreProps) {
  const { label, color } = getScoreLabel(score);

  // Calculate the stroke-dashoffset for the circular progress
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const offset = circumference - progress;

  // Color for the ring based on score
  const ringColor =
    score >= 80
      ? "stroke-green-500"
      : score >= 60
        ? "stroke-blue-500"
        : score >= 40
          ? "stroke-yellow-500"
          : "stroke-red-500";

  return (
    <Card className="flex flex-col items-center justify-center">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Reputation Score</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-2">
        <div className="relative h-44 w-44">
          <svg className="h-44 w-44 -rotate-90" viewBox="0 0 160 160">
            {/* Background circle */}
            <circle
              cx="80"
              cy="80"
              r={radius}
              fill="none"
              strokeWidth="10"
              className="stroke-muted"
            />
            {/* Progress circle */}
            <circle
              cx="80"
              cy="80"
              r={radius}
              fill="none"
              strokeWidth="10"
              strokeLinecap="round"
              className={ringColor}
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              style={{ transition: "stroke-dashoffset 0.5s ease-in-out" }}
            />
          </svg>
          {/* Score number in center */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-bold">{score}</span>
            <span className="text-xs text-muted-foreground">/ 100</span>
          </div>
        </div>
        <span className={`text-sm font-semibold ${color}`}>{label}</span>
      </CardContent>
    </Card>
  );
}
