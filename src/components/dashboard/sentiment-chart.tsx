"use client";

import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SentimentChartProps {
  positive: number;
  neutral: number;
  negative: number;
}

const COLORS = {
  Positive: "#22c55e",
  Neutral: "#eab308",
  Negative: "#ef4444",
};

export function SentimentChart({ positive, neutral, negative }: SentimentChartProps) {
  const total = positive + neutral + negative;

  if (total === 0) {
    return (
      <Card className="flex flex-col items-center justify-center">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Sentiment Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="flex h-44 items-center justify-center">
          <p className="text-sm text-muted-foreground">No reviews yet</p>
        </CardContent>
      </Card>
    );
  }

  const data = [
    { name: "Positive", value: positive },
    { name: "Neutral", value: neutral },
    { name: "Negative", value: negative },
  ].filter((d) => d.value > 0);

  const renderLabel = (props: { name?: string; value?: number }) => {
    const { name, value } = props;
    if (!name || value === undefined) return "";
    const pct = ((value / total) * 100).toFixed(0);
    return `${name}: ${value} (${pct}%)`;
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Sentiment Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
              label={renderLabel}
            >
              {data.map((entry) => (
                <Cell
                  key={entry.name}
                  fill={COLORS[entry.name as keyof typeof COLORS]}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, name) => {
                const numVal = Number(value);
                return [`${numVal} (${((numVal / total) * 100).toFixed(1)}%)`, String(name)];
              }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
