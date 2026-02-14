import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function Hero() {
  return (
    <section className="relative overflow-hidden py-24 sm:py-32">
      <div className="mx-auto max-w-4xl px-6 text-center">
        <Badge variant="secondary" className="mb-4">
          Manage your online reputation with AI
        </Badge>
        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
          AI-Powered Review Responses in{" "}
          <span className="text-primary">Seconds</span>
        </h1>
        <p className="mt-6 text-lg leading-8 text-muted-foreground">
          Stop spending hours crafting review responses. ReviewPulse uses AI to
          generate professional, on-brand replies to every customer review. Track
          your reputation and grow your reviews.
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <Button size="lg" asChild>
            <Link href="/signup">Start Free</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="#pricing">View Pricing</Link>
          </Button>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          No credit card required. Free tier available.
        </p>
      </div>
    </section>
  );
}
