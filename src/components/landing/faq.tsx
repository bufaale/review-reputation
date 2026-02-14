import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqItems = [
  {
    question: "How do I add my reviews?",
    answer:
      "Paste reviews manually or import via CSV. We support reviews from Google, Yelp, Facebook, and any other platform.",
  },
  {
    question: "Does AI respond directly on Google/Yelp?",
    answer:
      "Not yet — ReviewPulse generates the response and you copy it to clipboard with one click. Direct integration is coming soon.",
  },
  {
    question: "What AI model do you use?",
    answer:
      "Claude Haiku 4.5 by Anthropic — fast, accurate, and trained to write professional business responses.",
  },
  {
    question: "Can I customize the response tone?",
    answer:
      "Yes! Set a preferred tone per location: professional, friendly, or casual. The AI adapts to match.",
  },
  {
    question: "How does the reputation score work?",
    answer:
      "It's a weighted score combining your average rating, sentiment trend, response rate, and review volume.",
  },
];

export function FAQ() {
  return (
    <section id="faq" className="py-24">
      <div className="mx-auto max-w-3xl px-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold">Frequently asked questions</h2>
          <p className="text-muted-foreground mt-4 mx-auto max-w-2xl">
            Everything you need to know about ReviewPulse.
          </p>
        </div>
        <div className="mt-12">
          <Accordion type="single" collapsible className="w-full">
            {faqItems.map((item, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left text-base">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-base leading-relaxed">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
