# ReviewPulse Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build ReviewPulse — an AI-powered review response and reputation manager for local businesses, where users paste reviews, AI generates professional responses (copy to clipboard), and a dashboard tracks sentiment/reputation over time.

**Architecture:** Clone app-09-saas-boilerplate, adapt for review management. Next.js 16 App Router with Supabase (auth + DB + RLS), Stripe subscriptions, Vercel AI SDK + Claude Haiku for response generation and sentiment analysis, Resend for review request emails, Recharts for dashboard charts.

**Tech Stack:** Next.js 16, Tailwind CSS 4, shadcn/ui, Supabase, Stripe, Vercel AI SDK, Claude Haiku 4.5, Resend, Recharts, Zod

---

### Task 1: Clone Boilerplate and Rebrand

**Context:** We start from app-09-saas-boilerplate which has auth, Stripe billing, landing page, dashboard skeleton, and all UI components pre-built. We clone it into app-07 and rebrand everything for ReviewPulse.

**Files:**
- Modify: `package.json` (name)
- Modify: `src/config/site.ts` (branding)
- Modify: `src/components/landing/hero.tsx` (copy)
- Modify: `src/components/landing/features.tsx` (copy)
- Modify: `src/components/landing/faq.tsx` (copy)
- Modify: `src/components/landing/testimonials.tsx` (copy)
- Modify: `src/components/dashboard/app-sidebar.tsx` (nav items)
- Remove: `src/app/(dashboard)/admin/page.tsx`
- Remove: `src/app/(dashboard)/ai-chat/page.tsx`
- Remove: `src/components/ai/chat.tsx`
- Remove: `src/app/api/ai/structured/route.ts`
- Remove: `src/app/api/chat/route.ts`
- Remove: `src/app/(dashboard)/settings/api-keys/page.tsx`

**Step 1: Clone the boilerplate**

```bash
cd c:/Projects/apps-portfolio
# Copy boilerplate to app-07, excluding .git and node_modules
tar -cf - --exclude='.git' --exclude='node_modules' --exclude='.next' -C app-09-saas-boilerplate . | tar -xf - -C app-07-review-reputation
```

**Step 2: Update package.json**

Change `"name"` from `"app-09-saas-boilerplate"` to `"app-07-review-reputation"`.

**Step 3: Update site config**

Replace `src/config/site.ts`:
```typescript
export const siteConfig = {
  name: "ReviewPulse",
  description:
    "AI-powered review response and reputation manager for local businesses.",
  url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  ogImage: "/og.png",
  links: {
    github: "https://github.com/bufaale/review-reputation",
    twitter: "https://twitter.com/yourusername",
  },
} as const;
```

**Step 4: Remove boilerplate-specific pages and APIs**

Delete these files that are specific to the boilerplate demo:
- `src/app/(dashboard)/admin/page.tsx`
- `src/app/(dashboard)/ai-chat/page.tsx`
- `src/components/ai/chat.tsx`
- `src/app/api/ai/structured/route.ts`
- `src/app/api/chat/route.ts`
- `src/app/(dashboard)/settings/api-keys/page.tsx`

**Step 5: Update sidebar navigation**

Replace `src/components/dashboard/app-sidebar.tsx` navigation arrays:
```typescript
import {
  LayoutDashboard,
  MapPin,
  MessageSquareText,
  Mail,
  Settings,
  CreditCard,
} from "lucide-react";

const mainNav = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Locations", href: "/dashboard/locations", icon: MapPin },
  { title: "Reviews", href: "/dashboard/reviews", icon: MessageSquareText },
  { title: "Review Requests", href: "/dashboard/requests", icon: Mail },
];

const settingsNav = [
  { title: "Profile", href: "/settings", icon: Settings },
  { title: "Billing", href: "/settings/billing", icon: CreditCard },
];
```

Remove the `adminNav` array and its rendering in the JSX. Also remove the `Key` and `Shield` icon imports.

**Step 6: Update landing page content**

Update `src/components/landing/hero.tsx`:
- Title: "AI-Powered Review Responses in Seconds"
- Subtitle: "Stop spending hours crafting review responses. ReviewPulse uses AI to generate professional, on-brand replies to every customer review. Track your reputation and grow your reviews."
- CTA: "Start Free" → `/signup`

Update `src/components/landing/features.tsx` with 6 features:
1. "AI Response Generation" — "Generate professional responses to any review in seconds. AI matches your brand's tone."
2. "Sentiment Analysis" — "Automatically detect sentiment and trending topics across all your reviews."
3. "Reputation Dashboard" — "Track your reputation score, sentiment trends, and response rate over time."
4. "Multi-Location" — "Manage reviews across all your business locations from one dashboard."
5. "Review Requests" — "Send email campaigns to happy customers asking them to leave reviews."
6. "CSV Import" — "Bulk import reviews from Google, Yelp, or any platform via CSV upload."

Update `src/components/landing/faq.tsx` with relevant Q&As:
1. "How do I add my reviews?" → "Paste reviews manually or import via CSV. We support reviews from Google, Yelp, Facebook, and any other platform."
2. "Does AI respond directly on Google/Yelp?" → "Not yet — ReviewPulse generates the response and you copy it to clipboard with one click. Direct integration is coming soon."
3. "What AI model do you use?" → "Claude Haiku 4.5 by Anthropic — fast, accurate, and trained to write professional business responses."
4. "Can I customize the response tone?" → "Yes! Set a preferred tone per location: professional, friendly, or casual. The AI adapts to match."
5. "How does the reputation score work?" → "It's a weighted score combining your average rating, sentiment trend, response rate, and review volume."

Update `src/components/landing/testimonials.tsx` with 3 testimonials from fictional local business owners (restaurant, dental office, salon).

**Step 7: Update middleware matcher**

In `src/middleware.ts`, update the matcher to include Stripe API routes:
```typescript
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/settings/:path*",
    "/login",
    "/signup",
    "/auth/:path*",
    "/api/stripe/:path*",
  ],
};
```

**Step 8: Install additional dependencies**

```bash
cd c:/Projects/apps-portfolio/app-07-review-reputation
npm install recharts papaparse
npm install -D @types/papaparse
```

**Step 9: Run build to verify**

```bash
npm run build
```

Expected: Build succeeds with no errors.

**Step 10: Commit**

```bash
git add -A
git commit -m "feat: clone boilerplate and rebrand as ReviewPulse"
```

---

### Task 2: Database Schema and Types

**Context:** Create Supabase migration for all app tables and TypeScript type definitions. The profiles table is inherited from the boilerplate but needs extra columns for brand customization.

**Files:**
- Create: `supabase/migrations/001_schema.sql`
- Modify: `src/types/database.ts`

**Step 1: Create migration file**

Create `supabase/migrations/001_schema.sql`:
```sql
-- Extend profiles with brand fields
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS company_name text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS company_logo_url text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS primary_color text DEFAULT '#2563eb';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS secondary_color text DEFAULT '#1e40af';

-- Locations
CREATE TABLE locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  address text,
  google_maps_url text,
  industry text,
  tone text DEFAULT 'professional' CHECK (tone IN ('professional', 'friendly', 'casual')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own locations" ON locations
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Reviews
CREATE TABLE reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  location_id uuid REFERENCES locations(id) ON DELETE CASCADE NOT NULL,
  source text DEFAULT 'google' CHECK (source IN ('google', 'yelp', 'facebook', 'other')),
  reviewer_name text,
  rating integer CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  review_text text NOT NULL,
  review_date date,
  sentiment text CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  sentiment_score real,
  tags jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own reviews" ON reviews
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Responses
CREATE TABLE responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid REFERENCES reviews(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  tone text,
  is_used boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own responses" ON responses
  FOR ALL USING (
    EXISTS (SELECT 1 FROM reviews WHERE reviews.id = responses.review_id AND reviews.user_id = auth.uid())
  );

-- Customers (for review requests)
CREATE TABLE customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  location_id uuid REFERENCES locations(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  last_request_sent timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own customers" ON customers
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Review Requests
CREATE TABLE review_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  location_id uuid REFERENCES locations(id) ON DELETE CASCADE NOT NULL,
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE NOT NULL,
  channel text DEFAULT 'email' CHECK (channel IN ('email', 'sms')),
  status text DEFAULT 'sent' CHECK (status IN ('sent', 'opened', 'completed')),
  review_link text,
  sent_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE review_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own review_requests" ON review_requests
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Indexes for common queries
CREATE INDEX idx_reviews_location ON reviews(location_id);
CREATE INDEX idx_reviews_user_month ON reviews(user_id, created_at);
CREATE INDEX idx_responses_review ON responses(review_id);
CREATE INDEX idx_customers_location ON customers(location_id);
CREATE INDEX idx_review_requests_user ON review_requests(user_id, created_at);
```

**Step 2: Update TypeScript types**

Replace `src/types/database.ts` with full type definitions:
```typescript
export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  stripe_customer_id: string | null;
  subscription_status: "active" | "trialing" | "past_due" | "canceled" | "free";
  subscription_plan: string | null;
  company_name: string | null;
  company_logo_url: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  role: "user" | "admin";
  created_at: string;
  updated_at: string;
}

export interface Location {
  id: string;
  user_id: string;
  name: string;
  address: string | null;
  google_maps_url: string | null;
  industry: string | null;
  tone: "professional" | "friendly" | "casual";
  created_at: string;
}

export interface Review {
  id: string;
  user_id: string;
  location_id: string;
  source: "google" | "yelp" | "facebook" | "other";
  reviewer_name: string | null;
  rating: number;
  review_text: string;
  review_date: string | null;
  sentiment: "positive" | "neutral" | "negative" | null;
  sentiment_score: number | null;
  tags: string[];
  created_at: string;
}

export interface ReviewWithResponse extends Review {
  responses: Response[];
  location?: Location;
}

export interface Response {
  id: string;
  review_id: string;
  content: string;
  tone: string | null;
  is_used: boolean;
  created_at: string;
}

export interface Customer {
  id: string;
  user_id: string;
  location_id: string;
  name: string;
  email: string;
  phone: string | null;
  last_request_sent: string | null;
  created_at: string;
}

export interface ReviewRequest {
  id: string;
  user_id: string;
  location_id: string;
  customer_id: string;
  channel: "email" | "sms";
  status: "sent" | "opened" | "completed";
  review_link: string | null;
  sent_at: string;
  created_at: string;
}

export interface ReviewRequestWithCustomer extends ReviewRequest {
  customer: Customer;
}
```

**Step 3: Commit**

```bash
git add supabase/migrations/001_schema.sql src/types/database.ts
git commit -m "feat: add database schema and TypeScript types"
```

---

### Task 3: Pricing Plans and Usage Limits

**Context:** Configure the 3-tier pricing (Free / Pro $39 / Business $129) with usage limits for locations, reviews, AI responses, and review requests. Create a usage checking utility.

**Files:**
- Modify: `src/lib/stripe/plans.ts`
- Create: `src/lib/usage.ts`

**Step 1: Update pricing plans**

Replace `src/lib/stripe/plans.ts`:
```typescript
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
    price: { monthly: 39, yearly: 390 },
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
    price: { monthly: 129, yearly: 1290 },
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
```

**Step 2: Create usage limits utility**

Create `src/lib/usage.ts`:
```typescript
import { createClient } from "@/lib/supabase/server";
import { getUserPlan } from "@/lib/stripe/plans";

interface LimitCheck {
  allowed: boolean;
  used: number;
  limit: number;
  plan: string;
}

async function getPlanForUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, plan: getUserPlan(null) };

  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_plan")
    .eq("id", user.id)
    .single();

  return { supabase, user, plan: getUserPlan(profile?.subscription_plan ?? null) };
}

function startOfMonth(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
}

export async function checkLocationLimit(): Promise<LimitCheck> {
  const { supabase, user, plan } = await getPlanForUser();
  if (!user) return { allowed: false, used: 0, limit: 0, plan: "free" };

  if (plan.limits.locations === Infinity) {
    return { allowed: true, used: 0, limit: Infinity, plan: plan.id };
  }

  const { count } = await supabase
    .from("locations")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  const used = count ?? 0;
  return { allowed: used < plan.limits.locations, used, limit: plan.limits.locations, plan: plan.id };
}

export async function checkReviewLimit(): Promise<LimitCheck> {
  const { supabase, user, plan } = await getPlanForUser();
  if (!user) return { allowed: false, used: 0, limit: 0, plan: "free" };

  if (plan.limits.reviews_per_month === Infinity) {
    return { allowed: true, used: 0, limit: Infinity, plan: plan.id };
  }

  const { count } = await supabase
    .from("reviews")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", startOfMonth());

  const used = count ?? 0;
  return { allowed: used < plan.limits.reviews_per_month, used, limit: plan.limits.reviews_per_month, plan: plan.id };
}

export async function checkAIResponseLimit(): Promise<LimitCheck> {
  const { supabase, user, plan } = await getPlanForUser();
  if (!user) return { allowed: false, used: 0, limit: 0, plan: "free" };

  if (plan.limits.ai_responses_per_month === Infinity) {
    return { allowed: true, used: 0, limit: Infinity, plan: plan.id };
  }

  const { count } = await supabase
    .from("responses")
    .select("*, reviews!inner(user_id)", { count: "exact", head: true })
    .eq("reviews.user_id", user.id)
    .gte("created_at", startOfMonth());

  const used = count ?? 0;
  return { allowed: used < plan.limits.ai_responses_per_month, used, limit: plan.limits.ai_responses_per_month, plan: plan.id };
}

export async function checkReviewRequestLimit(): Promise<LimitCheck> {
  const { supabase, user, plan } = await getPlanForUser();
  if (!user) return { allowed: false, used: 0, limit: 0, plan: "free" };

  if (plan.limits.review_requests_per_month === Infinity) {
    return { allowed: true, used: 0, limit: Infinity, plan: plan.id };
  }

  const { count } = await supabase
    .from("review_requests")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", startOfMonth());

  const used = count ?? 0;
  return { allowed: used < plan.limits.review_requests_per_month, used, limit: plan.limits.review_requests_per_month, plan: plan.id };
}
```

**Step 3: Build and verify**

```bash
npm run build
```

**Step 4: Commit**

```bash
git add src/lib/stripe/plans.ts src/lib/usage.ts
git commit -m "feat: add pricing plans and usage limit checks"
```

---

### Task 4: AI Response Generation and Sentiment Analysis

**Context:** Create the AI module that generates review responses and performs sentiment analysis. Uses Vercel AI SDK with Claude Haiku 4.5 via `generateObject` for structured output.

**Files:**
- Create: `src/lib/ai/generate-response.ts`
- Create: `src/lib/ai/analyze-sentiment.ts`

**Step 1: Create response generation**

Create `src/lib/ai/generate-response.ts`:
```typescript
import { generateObject } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";

const responseSchema = z.object({
  content: z.string().describe("A professional, on-brand response to the review. 2-4 sentences."),
});

export async function generateReviewResponse(params: {
  reviewText: string;
  rating: number;
  businessName: string;
  industry: string | null;
  tone: "professional" | "friendly" | "casual";
  reviewerName: string | null;
}): Promise<string> {
  const { reviewText, rating, businessName, industry, tone, reviewerName } = params;

  const systemPrompt = `You are an expert at writing business review responses for local businesses.
Write a response that is ${tone}, empathetic, and on-brand.
For negative reviews (1-2 stars): acknowledge the issue, apologize sincerely, offer to resolve.
For neutral reviews (3 stars): thank them, acknowledge feedback, mention improvements.
For positive reviews (4-5 stars): express genuine gratitude, be warm, invite them back.
Keep responses 2-4 sentences. Never be defensive or dismissive.`;

  const userPrompt = `Write a review response for ${businessName}${industry ? ` (${industry})` : ""}.

Review by: ${reviewerName || "a customer"}
Rating: ${rating}/5 stars
Review: "${reviewText}"

Tone: ${tone}`;

  const { object } = await generateObject({
    model: anthropic("claude-haiku-4-5-20251001"),
    schema: responseSchema,
    system: systemPrompt,
    prompt: userPrompt,
  });

  return object.content;
}
```

**Step 2: Create sentiment analysis**

Create `src/lib/ai/analyze-sentiment.ts`:
```typescript
import { generateObject } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";

const sentimentSchema = z.object({
  sentiment: z.enum(["positive", "neutral", "negative"]),
  score: z.number().min(0).max(1).describe("Confidence score from 0 to 1"),
  tags: z.array(z.string()).describe("2-5 topic tags extracted from the review, e.g. 'service', 'wait time', 'food quality'"),
});

export type SentimentResult = z.infer<typeof sentimentSchema>;

export async function analyzeSentiment(reviewText: string, rating: number): Promise<SentimentResult> {
  const { object } = await generateObject({
    model: anthropic("claude-haiku-4-5-20251001"),
    schema: sentimentSchema,
    system: "You are a sentiment analysis expert. Analyze the review and extract sentiment, confidence, and topic tags. Use the rating as additional context but base sentiment primarily on the text content.",
    prompt: `Rating: ${rating}/5\nReview: "${reviewText}"`,
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
```

**Step 3: Build and verify**

```bash
npm run build
```

**Step 4: Commit**

```bash
git add src/lib/ai/
git commit -m "feat: add AI response generation and sentiment analysis"
```

---

### Task 5: Locations API and Page

**Context:** CRUD for business locations. Users add their business locations with name, address, Google Maps URL, industry, and preferred response tone.

**Files:**
- Create: `src/app/api/locations/route.ts` (GET + POST)
- Create: `src/app/api/locations/[id]/route.ts` (PATCH + DELETE)
- Create: `src/app/(dashboard)/dashboard/locations/page.tsx`
- Create: `src/app/(dashboard)/dashboard/locations/[id]/page.tsx`

**Step 1: Create locations API — list and create**

Create `src/app/api/locations/route.ts`:
```typescript
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkLocationLimit } from "@/lib/usage";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1).max(200),
  address: z.string().optional(),
  google_maps_url: z.string().url().optional().or(z.literal("")),
  industry: z.string().optional(),
  tone: z.enum(["professional", "friendly", "casual"]).default("professional"),
});

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("locations")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ locations: data });
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const limit = await checkLocationLimit();
  if (!limit.allowed) {
    return NextResponse.json(
      { error: `Location limit reached (${limit.used}/${limit.limit}). Upgrade your plan.` },
      { status: 429 },
    );
  }

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { data, error } = await supabase
    .from("locations")
    .insert({ user_id: user.id, ...parsed.data })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ location: data });
}
```

**Step 2: Create locations API — update and delete**

Create `src/app/api/locations/[id]/route.ts`:
```typescript
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  address: z.string().optional(),
  google_maps_url: z.string().url().optional().or(z.literal("")),
  industry: z.string().optional(),
  tone: z.enum(["professional", "friendly", "casual"]).optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { data, error } = await supabase
    .from("locations")
    .update(parsed.data)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ location: data });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { error } = await supabase
    .from("locations")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
```

**Step 3: Create locations list page**

Create `src/app/(dashboard)/dashboard/locations/page.tsx` — a server component that lists all locations as cards with: name, address, industry, tone badge, review count, and actions (edit, view reviews, delete). Include an "Add Location" dialog with a form (name, address, google maps URL, industry select, tone radio group).

**Step 4: Create location detail page**

Create `src/app/(dashboard)/dashboard/locations/[id]/page.tsx` — shows location details at top (editable), then tabs: "Reviews" (list with sentiment badges), "Add Review" (form), "CSV Import" (file upload — Pro+ only). This is the main hub for managing reviews for a location.

**Step 5: Build and verify**

```bash
npm run build
```

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: add locations CRUD API and pages"
```

---

### Task 6: Reviews API and Manual Input

**Context:** API to add individual reviews with automatic sentiment analysis. When a review is added, AI analyzes sentiment and tags before storing.

**Files:**
- Create: `src/app/api/reviews/route.ts` (GET + POST)
- Create: `src/app/api/reviews/import/route.ts` (CSV import)
- Create: `src/app/api/reviews/[id]/route.ts` (DELETE)
- Create: `src/app/api/reviews/[id]/generate-response/route.ts`

**Step 1: Create reviews API — list and create with auto-sentiment**

Create `src/app/api/reviews/route.ts`:
```typescript
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkReviewLimit } from "@/lib/usage";
import { analyzeSentiment } from "@/lib/ai/analyze-sentiment";
import { z } from "zod";

export const maxDuration = 30;

const createSchema = z.object({
  location_id: z.string().uuid(),
  source: z.enum(["google", "yelp", "facebook", "other"]).default("google"),
  reviewer_name: z.string().optional(),
  rating: z.number().min(1).max(5),
  review_text: z.string().min(5),
  review_date: z.string().optional(),
});

export async function GET(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const locationId = searchParams.get("location_id");

  let query = supabase
    .from("reviews")
    .select("*, responses(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (locationId) query = query.eq("location_id", locationId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ reviews: data });
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const limit = await checkReviewLimit();
  if (!limit.allowed) {
    return NextResponse.json(
      { error: `Monthly review limit reached (${limit.used}/${limit.limit}). Upgrade your plan.` },
      { status: 429 },
    );
  }

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  // AI sentiment analysis
  const sentiment = await analyzeSentiment(parsed.data.review_text, parsed.data.rating);

  const { data, error } = await supabase
    .from("reviews")
    .insert({
      user_id: user.id,
      ...parsed.data,
      sentiment: sentiment.sentiment,
      sentiment_score: sentiment.score,
      tags: sentiment.tags,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ review: data });
}
```

**Step 2: Create CSV import endpoint**

Create `src/app/api/reviews/import/route.ts` — accepts a JSON body with `location_id` and `reviews` array (each with source, reviewer_name, rating, review_text, review_date). Checks review limit for total count. Runs batch sentiment analysis. Inserts all reviews. Returns count of imported reviews. Set `maxDuration = 60`.

Expected CSV format: `source,reviewer_name,rating,review_text,review_date`

**Step 3: Create review delete endpoint**

Create `src/app/api/reviews/[id]/route.ts` with DELETE handler — deletes review owned by user (cascade deletes responses).

**Step 4: Create AI response generation endpoint**

Create `src/app/api/reviews/[id]/generate-response/route.ts`:
```typescript
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkAIResponseLimit } from "@/lib/usage";
import { generateReviewResponse } from "@/lib/ai/generate-response";

export const maxDuration = 30;

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const limit = await checkAIResponseLimit();
  if (!limit.allowed) {
    return NextResponse.json(
      { error: `AI response limit reached (${limit.used}/${limit.limit}). Upgrade your plan.` },
      { status: 429 },
    );
  }

  // Fetch review with location info
  const { data: review } = await supabase
    .from("reviews")
    .select("*, locations(*)")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!review) return NextResponse.json({ error: "Review not found" }, { status: 404 });

  const location = review.locations as { name: string; industry: string | null; tone: string };

  const content = await generateReviewResponse({
    reviewText: review.review_text,
    rating: review.rating,
    businessName: location.name,
    industry: location.industry,
    tone: location.tone as "professional" | "friendly" | "casual",
    reviewerName: review.reviewer_name,
  });

  const { data: response, error } = await supabase
    .from("responses")
    .insert({ review_id: id, content, tone: location.tone })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ response });
}
```

**Step 5: Build and verify**

```bash
npm run build
```

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: add reviews API with sentiment analysis and AI response generation"
```

---

### Task 7: Reviews UI — List, Detail, and CSV Import

**Context:** Build the reviews list page (all reviews across locations), single review detail page with response generation and copy-to-clipboard, and CSV import UI on the location detail page.

**Files:**
- Create: `src/app/(dashboard)/dashboard/reviews/page.tsx` (all reviews list)
- Create: `src/app/(dashboard)/dashboard/reviews/[id]/page.tsx` (review detail + response)
- Modify: `src/app/(dashboard)/dashboard/locations/[id]/page.tsx` (add CSV import tab)

**Step 1: Create reviews list page**

Create `src/app/(dashboard)/dashboard/reviews/page.tsx` — server component fetching all reviews with responses joined. Shows: filter by location dropdown, filter by sentiment, sort by date/rating. Each review card shows: reviewer name, rating stars, snippet of text, sentiment badge (colored), source badge, location name, response status (generated/not). Clicking a review navigates to detail page.

**Step 2: Create review detail page**

Create `src/app/(dashboard)/dashboard/reviews/[id]/page.tsx` — a client component that shows:
- Review card: full text, rating, reviewer name, source, date, sentiment badge, topic tags
- Response section: if response exists, show it with "Copy to Clipboard" button and "Mark as Posted" toggle. If no response, show "Generate Response" button.
- "Generate Response" calls `POST /api/reviews/{id}/generate-response`, shows loading state, then displays response with copy button.
- "Regenerate" button to get a new version.
- Copy to clipboard uses `navigator.clipboard.writeText()` with toast confirmation.

**Step 3: Add CSV import to location detail page**

In the location detail page, add a "CSV Import" tab (visible only for Pro+ plans). It includes:
- File input accepting `.csv` files
- Client-side CSV parsing with `papaparse`
- Preview table showing first 5 rows
- "Import" button that POSTs to `/api/reviews/import`
- Progress/result feedback

Expected CSV columns: `source,reviewer_name,rating,review_text,review_date`

**Step 4: Build and verify**

```bash
npm run build
```

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: add reviews list, detail page, and CSV import UI"
```

---

### Task 8: Dashboard with Reputation Score and Charts

**Context:** The main dashboard shows a reputation overview: reputation score, total reviews, average rating, response rate, sentiment breakdown chart, and recent reviews. Uses Recharts for visualization.

**Files:**
- Modify: `src/app/(dashboard)/dashboard/page.tsx`
- Create: `src/lib/reputation.ts` (score calculation)
- Create: `src/components/dashboard/reputation-score.tsx`
- Create: `src/components/dashboard/sentiment-chart.tsx`
- Create: `src/components/dashboard/recent-reviews.tsx`
- Modify: `src/components/dashboard/stats-cards.tsx`

**Step 1: Create reputation score calculator**

Create `src/lib/reputation.ts`:
```typescript
interface ReputationInput {
  avgRating: number;        // 1-5
  totalReviews: number;
  responseRate: number;     // 0-1
  positivePercent: number;  // 0-1
  recentTrend: number;     // -1 to 1 (declining to improving)
}

export function calculateReputationScore(input: ReputationInput): number {
  const { avgRating, totalReviews, responseRate, positivePercent, recentTrend } = input;

  // Normalize rating to 0-100
  const ratingScore = (avgRating / 5) * 100;
  // Volume bonus: log scale, max 10 points
  const volumeBonus = Math.min(Math.log10(totalReviews + 1) * 5, 10);
  // Response rate bonus: 0-10 points
  const responseBonus = responseRate * 10;
  // Sentiment bonus: 0-10 points
  const sentimentBonus = positivePercent * 10;
  // Trend bonus: -5 to +5 points
  const trendBonus = recentTrend * 5;

  const score = Math.round(
    Math.min(100, Math.max(0, ratingScore * 0.7 + volumeBonus + responseBonus + sentimentBonus + trendBonus))
  );

  return score;
}

export function getScoreLabel(score: number): { label: string; color: string } {
  if (score >= 80) return { label: "Excellent", color: "text-green-600" };
  if (score >= 60) return { label: "Good", color: "text-blue-600" };
  if (score >= 40) return { label: "Fair", color: "text-yellow-600" };
  return { label: "Needs Work", color: "text-red-600" };
}
```

**Step 2: Create dashboard components**

Create `src/components/dashboard/reputation-score.tsx` — a large circular/radial score display showing the reputation number (0-100), label (Excellent/Good/Fair/Needs Work), and color-coded ring.

Create `src/components/dashboard/sentiment-chart.tsx` — a Recharts PieChart showing positive/neutral/negative distribution. Use green/yellow/red colors. Show count and percentage labels.

Create `src/components/dashboard/recent-reviews.tsx` — compact list of 5 most recent reviews with: reviewer name, rating stars, sentiment dot, text snippet (truncated), time ago. Links to review detail page.

**Step 3: Update stats cards**

Modify `src/components/dashboard/stats-cards.tsx` to show 4 cards:
1. Total Reviews (with month-over-month change)
2. Average Rating (with star display)
3. Response Rate (percentage of reviews with posted responses)
4. Pending Responses (reviews without any response)

**Step 4: Update dashboard page**

Replace `src/app/(dashboard)/dashboard/page.tsx` — server component that:
1. Fetches all reviews for user (with responses joined)
2. Calculates reputation score using `calculateReputationScore`
3. Computes stats: total reviews, avg rating, response rate, sentiment distribution
4. Renders: Stats cards row, Reputation score + Sentiment chart side by side, Recent reviews list

For Free plan users: show basic stats only (no charts). For Pro+: show full dashboard with charts.

**Step 5: Build and verify**

```bash
npm run build
```

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: add reputation dashboard with score, charts, and stats"
```

---

### Task 9: Review Requests — Customers and Email Campaigns

**Context:** Users add customers per location, then send email review requests via Resend. The email contains a personalized message with a direct link to leave a Google review.

**Files:**
- Create: `src/app/api/customers/route.ts` (GET + POST)
- Create: `src/app/api/customers/[id]/route.ts` (DELETE)
- Create: `src/app/api/review-requests/send/route.ts`
- Create: `src/app/(dashboard)/dashboard/requests/page.tsx`
- Modify: `src/lib/email/resend.ts` (add review request email)

**Step 1: Create customers API**

Create `src/app/api/customers/route.ts` — GET lists customers for user (optionally filtered by `location_id` query param), POST creates a customer with Zod validation (name, email, location_id, optional phone).

Create `src/app/api/customers/[id]/route.ts` — DELETE removes customer owned by user.

**Step 2: Add review request email to Resend module**

Add to `src/lib/email/resend.ts`:
```typescript
export async function sendReviewRequestEmail(params: {
  to: string;
  customerName: string;
  businessName: string;
  reviewLink: string;
  logoUrl?: string;
  primaryColor?: string;
}) {
  const { to, customerName, businessName, reviewLink, primaryColor } = params;
  const color = primaryColor || "#2563eb";

  return resend.emails.send({
    from: FROM,
    to,
    subject: `${businessName} would love your feedback!`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: ${escapeHtml(color)};">Hi ${escapeHtml(customerName)}!</h2>
        <p>Thank you for choosing <strong>${escapeHtml(businessName)}</strong>. We hope you had a great experience!</p>
        <p>Would you mind taking a moment to share your feedback? Your review helps us improve and helps others discover us.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${escapeHtml(reviewLink)}" style="background-color: ${escapeHtml(color)}; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">
            Leave a Review
          </a>
        </div>
        <p style="color: #666; font-size: 14px;">Thank you for your time!<br>${escapeHtml(businessName)}</p>
      </div>
    `,
  });
}
```

**Step 3: Create review request send endpoint**

Create `src/app/api/review-requests/send/route.ts`:
- Accepts `{ location_id, customer_ids: string[] }`
- Checks review request limit
- Fetches location (for google_maps_url, name) and user profile (for brand colors)
- For each customer: sends email via Resend, creates review_request record, updates customer.last_request_sent
- Returns count of sent requests

**Step 4: Create review requests page**

Create `src/app/(dashboard)/dashboard/requests/page.tsx` — client component with:
- Location selector (dropdown)
- Customer list for selected location with checkboxes
- "Add Customer" dialog (name, email, optional phone)
- "Send Review Request" button (sends to all selected customers)
- History section: table of past review_requests with status badges (sent/opened/completed)
- "Mark as Completed" button for manually marking when customer leaves a review

**Step 5: Build and verify**

```bash
npm run build
```

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: add review request system with customers and email campaigns"
```

---

### Task 10: Settings — Profile and Brand Customization

**Context:** Extend the settings page to include brand customization (company name, logo URL, primary/secondary colors) alongside the existing profile fields. Brand settings are used in review request emails.

**Files:**
- Modify: `src/app/(dashboard)/settings/page.tsx`

**Step 1: Update settings page**

Extend `src/app/(dashboard)/settings/page.tsx` to add a second card "Brand Settings" below the existing Profile card:
- Company Name input
- Company Logo URL input (with preview if URL is set)
- Primary Color input (type="color" + hex display)
- Secondary Color input (type="color" + hex display)
- Save button that updates the profile with brand fields
- Show a "Pro plan required" badge/lock on brand fields for free users (disable inputs)

Fetch all brand fields along with existing profile fields in the useEffect. Save handler updates all fields in one call.

**Step 2: Build and verify**

```bash
npm run build
```

**Step 3: Commit**

```bash
git add src/app/\\(dashboard\\)/settings/page.tsx
git commit -m "feat: add brand customization to settings page"
```

---

### Task 11: Supabase Setup and Deploy

**Context:** Create Supabase project, apply migration, set up auth, configure environment variables, create GitHub repo, and deploy to Vercel.

**Files:**
- Create: `.env.local` (local dev)
- Modify: `.gitignore` (ensure .env.local is ignored)

**Step 1: Create Supabase project**

Use MCP tools to create a Supabase project named "review-reputation" in the user's organization. Wait for it to initialize.

**Step 2: Apply database migration**

Apply the migration from `supabase/migrations/001_schema.sql` to the Supabase project.

**Step 3: Configure Supabase Auth**

- Enable email/password auth (should be default)
- Enable Google OAuth (if user wants it)
- Set redirect URLs: `http://localhost:3000/auth/confirm`, `https://<vercel-domain>/auth/confirm`
- Disable email confirmation for easier testing

**Step 4: Set up environment variables**

Create `.env.local` with all required variables:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
ANTHROPIC_API_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID=
NEXT_PUBLIC_STRIPE_PRO_YEARLY_PRICE_ID=
NEXT_PUBLIC_STRIPE_BUSINESS_MONTHLY_PRICE_ID=
NEXT_PUBLIC_STRIPE_BUSINESS_YEARLY_PRICE_ID=
RESEND_API_KEY=
EMAIL_FROM=
```

Read actual key values from `.shared/.env.keys`.

**Step 5: Create GitHub repository**

```bash
gh repo create bufaale/review-reputation --public --source=. --remote=origin --push
```

**Step 6: Deploy to Vercel**

Use Vercel MCP tools or CLI to deploy. Set all environment variables in Vercel.

**Step 7: Create Stripe products**

Create two Stripe products with prices:
- Pro: $39/mo, $390/yr
- Business: $129/mo, $1290/yr

Set up webhook endpoint pointing to `https://<vercel-domain>/api/stripe/webhook`.

Update env vars with Stripe price IDs.

**Step 8: Commit deploy configuration**

```bash
git add -A
git commit -m "chore: configure deployment and environment"
```

---

### Task 12: Playwright E2E Tests

**Context:** Per CLAUDE.md rules, every app must have Playwright E2E tests covering: landing page, auth flow, dashboard, core features, billing.

**Files:**
- Create: `playwright.config.ts`
- Create: `tests/landing.spec.ts`
- Create: `tests/auth.spec.ts`
- Create: `tests/dashboard.spec.ts`
- Create: `tests/locations.spec.ts`
- Create: `tests/reviews.spec.ts`
- Create: `tests/requests.spec.ts`
- Create: `tests/billing.spec.ts`

**Step 1: Install Playwright**

```bash
npm install -D @playwright/test
npx playwright install chromium
```

**Step 2: Create Playwright config**

Create `playwright.config.ts`:
```typescript
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  retries: 1,
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
  },
});
```

**Step 3: Create test files**

`tests/landing.spec.ts` — verify landing page loads, hero text visible, features section, pricing section with 3 tiers, FAQ section, CTA buttons link to signup.

`tests/auth.spec.ts` — signup page loads, login page loads, form fields present, "Back to home" link works.

`tests/dashboard.spec.ts` — requires auth: dashboard loads with stats cards, reputation score visible, recent reviews section.

`tests/locations.spec.ts` — requires auth: locations page loads, add location dialog works, location detail page loads.

`tests/reviews.spec.ts` — requires auth: reviews page loads, filter controls present. (Skip actual AI generation in tests to avoid API costs.)

`tests/requests.spec.ts` — requires auth: requests page loads, customer list visible, add customer dialog works.

`tests/billing.spec.ts` — requires auth: billing page loads, shows current plan, upgrade buttons present.

**Step 4: Run tests**

```bash
npx playwright test
```

**Step 5: Commit**

```bash
git add playwright.config.ts tests/
git commit -m "test: add Playwright E2E tests"
```

---

### Task 13: Final Build Verification and Push

**Step 1: Full build**

```bash
npm run build
```

**Step 2: Run all tests**

```bash
npx playwright test
```

**Step 3: Push to GitHub**

```bash
git push origin master
```

**Step 4: Verify Vercel deployment**

Check that the deployed site loads correctly, landing page renders, auth works.
