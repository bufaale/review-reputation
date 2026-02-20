export interface PricingPlan {
  id: string;
  name: string;
  description: string;
  price: { monthly: number; yearly: number };
  stripePriceId: { monthly: string; yearly: string };
  features: string[];
  limits: {
    locations: number;
    reviews_per_month: number;
    ai_responses_per_month: number;
    review_requests_per_month: number;
    csv_import: boolean;
    full_dashboard: boolean;
    brand_customization: boolean;
  };
  highlighted?: boolean;
  cta: string;
}

export const pricingPlans: PricingPlan[] = [
  {
    id: "free",
    name: "Free",
    description: "Get started with one location",
    price: { monthly: 0, yearly: 0 },
    stripePriceId: { monthly: "", yearly: "" },
    features: [
      "1 location",
      "10 reviews/month",
      "5 AI responses/month",
      "5 review requests/month",
      "Basic sentiment dashboard",
    ],
    limits: {
      locations: 1,
      reviews_per_month: 10,
      ai_responses_per_month: 5,
      review_requests_per_month: 5,
      csv_import: false,
      full_dashboard: false,
      brand_customization: false,
    },
    cta: "Get Started",
  },
  {
    id: "pro",
    name: "Pro",
    description: "For growing businesses",
    price: { monthly: 19, yearly: 190 },
    stripePriceId: {
      monthly: (process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID || "").trim(),
      yearly: (process.env.NEXT_PUBLIC_STRIPE_PRO_YEARLY_PRICE_ID || "").trim(),
    },
    features: [
      "3 locations",
      "100 reviews/month",
      "50 AI responses/month",
      "50 review requests/month",
      "CSV import",
      "Full sentiment dashboard",
      "Brand customization",
    ],
    limits: {
      locations: 3,
      reviews_per_month: 100,
      ai_responses_per_month: 50,
      review_requests_per_month: 50,
      csv_import: true,
      full_dashboard: true,
      brand_customization: true,
    },
    highlighted: true,
    cta: "Upgrade to Pro",
  },
  {
    id: "business",
    name: "Business",
    description: "For multi-location businesses",
    price: { monthly: 49, yearly: 490 },
    stripePriceId: {
      monthly: (process.env.NEXT_PUBLIC_STRIPE_BUSINESS_MONTHLY_PRICE_ID || "").trim(),
      yearly: (process.env.NEXT_PUBLIC_STRIPE_BUSINESS_YEARLY_PRICE_ID || "").trim(),
    },
    features: [
      "10 locations",
      "Unlimited reviews",
      "Unlimited AI responses",
      "200 review requests/month",
      "CSV import",
      "Full sentiment dashboard",
      "Brand customization",
      "Priority support",
    ],
    limits: {
      locations: 10,
      reviews_per_month: Infinity,
      ai_responses_per_month: Infinity,
      review_requests_per_month: 200,
      csv_import: true,
      full_dashboard: true,
      brand_customization: true,
    },
    cta: "Go Business",
  },
];

export function getPlanByPriceId(priceId: string): PricingPlan | undefined {
  return pricingPlans.find(
    (p) =>
      p.stripePriceId.monthly === priceId ||
      p.stripePriceId.yearly === priceId,
  );
}

export function getUserPlan(subscriptionPlan: string | null): PricingPlan {
  return pricingPlans.find((p) => p.id === subscriptionPlan) || pricingPlans[0];
}
