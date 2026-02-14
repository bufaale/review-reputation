# App #7 - ReviewPulse: AI Review Response + Reputation Manager

## Goal

Local businesses paste their Google/Yelp reviews, AI generates professional responses instantly (copy to clipboard), and a dashboard tracks sentiment trends + reputation score over time. Businesses can also email customers requesting reviews.

## Architecture

Clone from app-09 boilerplate. Standard Next.js 16 + Supabase + Stripe + Resend. No Railway worker needed — all AI calls are fast (single review response ~2-5s with Haiku).

**Core flow:**

```
User adds location → Pastes reviews (or CSV import) → AI generates response per review
→ User copies response to clipboard → Pastes in Google/Yelp
→ Dashboard tracks sentiment + reputation score over time
→ User sends email review requests to customers via Resend
```

## MVP Scope

**Included:**
- Manual review input (paste) + CSV import
- AI response generation (Claude Haiku) with tone matching
- Copy to clipboard for responses
- Sentiment analysis + topic extraction (AI-powered)
- Reputation score dashboard with trends
- Review request emails via Resend
- Multi-location support (tier-based)
- Brand customization (logo + colors)

**Excluded (post-launch upgrades):**
- Google Business Profile API (OAuth verification takes weeks)
- Yelp/Facebook/TripAdvisor API integrations
- One-click reply from dashboard
- SMS review requests (Twilio)
- Webhooks for real-time review notifications
- Team/collaboration features

## Database Schema

### `locations`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid PK | |
| user_id | uuid FK → auth.users | |
| name | text | Business name |
| address | text | Business address |
| google_maps_url | text | Direct link to Google Maps listing |
| industry | text | e.g., restaurant, dental, salon |
| tone | text | preferred response tone: professional/friendly/casual |
| created_at | timestamptz | |

### `reviews`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid PK | |
| user_id | uuid FK → auth.users | |
| location_id | uuid FK → locations | |
| source | text | google/yelp/facebook/other |
| reviewer_name | text | |
| rating | int | 1-5 stars |
| review_text | text | The review content |
| review_date | date | When review was originally posted |
| sentiment | text | positive/neutral/negative |
| sentiment_score | float | 0.0 to 1.0 |
| tags | jsonb | Topic tags extracted by AI |
| created_at | timestamptz | |

### `responses`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid PK | |
| review_id | uuid FK → reviews | |
| content | text | AI-generated response text |
| tone | text | Tone used for generation |
| is_used | boolean | User marked as posted |
| created_at | timestamptz | |

### `customers`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid PK | |
| user_id | uuid FK → auth.users | |
| location_id | uuid FK → locations | |
| name | text | |
| email | text | |
| phone | text | For future SMS support |
| last_request_sent | timestamptz | |
| created_at | timestamptz | |

### `review_requests`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid PK | |
| user_id | uuid FK → auth.users | |
| location_id | uuid FK → locations | |
| customer_id | uuid FK → customers | |
| channel | text | email (future: sms) |
| status | text | sent/opened/completed |
| review_link | text | Direct link to leave review |
| sent_at | timestamptz | |
| created_at | timestamptz | |

### `profiles` (extended from boilerplate)
Standard fields + `subscription_plan`, `company_name`, `company_logo_url`, `primary_color`, `secondary_color`

## Pages

| Route | Description |
|-------|-------------|
| `/` | Landing page (hero, features, pricing, CTA) |
| `/login`, `/signup` | Auth pages |
| `/dashboard` | Overview: reputation score, recent reviews, sentiment chart, quick stats |
| `/dashboard/locations` | Locations list + add/edit |
| `/dashboard/locations/[id]` | Location detail: reviews list, add review form, CSV import |
| `/dashboard/reviews/[id]` | Single review: AI response generation, copy to clipboard |
| `/dashboard/requests` | Review request campaigns: customer list, send emails |
| `/settings` | Profile + brand customization |
| `/settings/billing` | Stripe subscription management |

## AI Features

### Response Generation
User clicks "Generate Response" on a review. AI considers: review text, rating, business name, industry, preferred tone. Generates 1 response. User can "Regenerate" for a different version. All plans use Haiku (responses are short, no need for Sonnet).

### Sentiment Analysis
When a review is added, AI classifies: positive/neutral/negative + confidence score (0-1) + topic tags (e.g., "service", "wait time", "food quality"). Done in the same API call when adding a review, or in batch during CSV import.

### Reputation Score
Calculated formula (not AI): weighted combination of average rating, sentiment trend (improving/declining), response rate (% of reviews with responses marked as posted), and review volume. Updated on dashboard load.

## Pricing / Limits

| Feature | Free | Pro $39/mo | Business $129/mo |
|---------|------|-----------|-----------------|
| Locations | 1 | 3 | 10 |
| Reviews/mo | 10 | 100 | Unlimited |
| AI responses/mo | 5 | 50 | Unlimited |
| Review requests/mo | 5 | 50 | 200 |
| AI model | Haiku | Haiku | Haiku |
| CSV import | No | Yes | Yes |
| Sentiment dashboard | Basic | Full | Full |
| Brand customization | No | Yes | Yes |

## Review Request Flow

1. User adds customers (name + email) per location
2. User selects customers → "Send Review Request"
3. API sends email via Resend: business name, personalized message, direct link to Google Maps review page
4. Track: sent, opened (Resend webhook), completed (user marks manually)

## API Routes

- `POST /api/reviews` — Add single review + auto AI sentiment analysis
- `POST /api/reviews/import` — CSV import with batch sentiment analysis
- `POST /api/reviews/[id]/generate-response` — Generate AI response for a review
- `POST /api/review-requests/send` — Send email review requests via Resend
- `CRUD /api/locations` — Location management
- `CRUD /api/customers` — Customer management
- `GET /api/dashboard/stats` — Reputation score + dashboard stats
- Standard Stripe routes: `/api/stripe/checkout`, `/api/stripe/portal`, `/api/stripe/webhook`
- Auth: `/api/auth/signout`, `/auth/callback`

## Tech Stack

- Next.js 16 (App Router)
- Tailwind CSS 4 + shadcn/ui
- Supabase (PostgreSQL + Auth + RLS)
- Vercel AI SDK + Claude Haiku 4.5
- Stripe (subscriptions)
- Resend (review request emails)
- Recharts (sentiment/reputation charts)
- Vercel (deploy)
