import { Card, CardContent, CardHeader } from "@/components/ui/card";

const testimonials = [
  {
    quote:
      "ReviewPulse cut our response time from 30 minutes per review to 30 seconds. The AI perfectly matches our friendly Italian restaurant vibe.",
    name: "Maria G.",
    role: "Owner of Bella Cucina",
    initials: "MG",
  },
  {
    quote:
      "Managing reviews across our 3 locations was a nightmare. Now I see everything in one dashboard and respond in seconds.",
    name: "Dr. James Park",
    role: "Park Family Dental",
    initials: "JP",
  },
  {
    quote:
      "The review request emails are a game-changer. Our Google reviews went from 45 to 120 in just two months.",
    name: "Sophia Chen",
    role: "Luxe Hair Studio",
    initials: "SC",
  },
];

export function Testimonials() {
  return (
    <section className="bg-muted/40 py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold">Loved by local businesses</h2>
          <p className="text-muted-foreground mt-4 mx-auto max-w-2xl">
            See what business owners are saying about ReviewPulse.
          </p>
        </div>
        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {testimonials.map((testimonial) => (
            <Card
              key={testimonial.name}
              className="transition-shadow hover:shadow-md"
            >
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold">
                    {testimonial.initials}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{testimonial.name}</p>
                    <p className="text-muted-foreground text-xs">
                      {testimonial.role}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <blockquote className="text-muted-foreground text-sm leading-relaxed">
                  &ldquo;{testimonial.quote}&rdquo;
                </blockquote>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
