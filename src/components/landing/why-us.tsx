import { DollarSign, Sparkles, BarChart3, Calendar } from "lucide-react";

const reasons = [
  {
    icon: DollarSign,
    title: "15x Cheaper Than Birdeye",
    description:
      "Birdeye charges $299/mo minimum. Podium starts at $249/mo. NiceJob at $75/mo. ReviewStack gives you AI responses, sentiment analysis, and multi-location support starting at $19/mo.",
  },
  {
    icon: Sparkles,
    title: "AI Responses on Every Tier",
    description:
      "Most competitors charge $200+/mo to unlock AI response generation. We include it at every price point — even the free plan gets 5 AI responses/month.",
  },
  {
    icon: BarChart3,
    title: "Sentiment Analysis Dashboard",
    description:
      "Track sentiment trends across all your reviews. Identify what customers love and what needs fixing. Most competitors charge enterprise prices for this insight.",
  },
  {
    icon: Calendar,
    title: "No Contracts, No Lock-In",
    description:
      "Birdeye requires annual contracts with 90-day cancellation notice. Podium auto-renews annually. ReviewStack is month-to-month — cancel anytime.",
  },
];

export function WhyUs() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold">
            Why ReviewStack over alternatives?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            AI review responses at $19/mo, not $299/mo.
          </p>
        </div>
        <div className="mt-16 grid gap-8 md:grid-cols-2">
          {reasons.map((reason) => (
            <div key={reason.title} className="flex gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <reason.icon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">{reason.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {reason.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
