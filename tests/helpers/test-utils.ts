import type { Page } from "@playwright/test";

// ---------------------------------------------------------------------------
// Environment
// ---------------------------------------------------------------------------
const SUPABASE_URL = process.env.SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const DEFAULT_PASSWORD = "TestE2E_Pass123!";

// Standard headers for Supabase REST calls with service role
function headers(extra?: Record<string, string>) {
  return {
    Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    apikey: SERVICE_ROLE_KEY,
    "Content-Type": "application/json",
    ...extra,
  };
}

// ---------------------------------------------------------------------------
// User helpers
// ---------------------------------------------------------------------------

/**
 * Create a test user via Supabase Auth Admin API.
 * Returns `{ id, email }`.
 */
export async function createTestUser(prefix: string) {
  const email = `e2e-${prefix}-${Date.now()}@test.example.com`;

  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      email,
      password: DEFAULT_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: `E2E ${prefix}` },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`createTestUser failed (${res.status}): ${body}`);
  }

  const data = await res.json();

  // Ensure a profiles row exists (trigger may already handle this, but be safe)
  await fetch(`${SUPABASE_URL}/rest/v1/profiles`, {
    method: "POST",
    headers: headers({ Prefer: "return=representation,resolution=merge-duplicates" }),
    body: JSON.stringify({
      id: data.id,
      email,
      full_name: `E2E ${prefix}`,
    }),
  });

  return { id: data.id as string, email };
}

/**
 * Delete a test user via Supabase Auth Admin API.
 */
export async function deleteTestUser(userId: string) {
  // Delete profile row first (cascade may handle children)
  await fetch(
    `${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`,
    { method: "DELETE", headers: headers() },
  );

  // Delete auth user
  const res = await fetch(
    `${SUPABASE_URL}/auth/v1/admin/users/${userId}`,
    { method: "DELETE", headers: headers() },
  );

  if (!res.ok && res.status !== 404) {
    const body = await res.text();
    throw new Error(`deleteTestUser failed (${res.status}): ${body}`);
  }
}

// ---------------------------------------------------------------------------
// Login via UI
// ---------------------------------------------------------------------------

/**
 * Log in through the login page UI.
 * Waits for the dashboard heading to appear.
 */
export async function loginViaUI(
  page: Page,
  email: string,
  password: string = DEFAULT_PASSWORD,
) {
  await page.goto("/login");

  // Wait for the form to be ready
  await page.getByLabel("Email").waitFor({ state: "visible" });

  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();

  // Wait for navigation to the dashboard
  await page.waitForURL("**/dashboard", { timeout: 30_000 });
  await page.getByRole("heading", { name: "Dashboard" }).waitFor({
    state: "visible",
    timeout: 15_000,
  });
}

// ---------------------------------------------------------------------------
// Plan helpers
// ---------------------------------------------------------------------------

/**
 * Patch the profiles table to set subscription_plan and subscription_status.
 * Use `plan = "free"` to reset, or `"pro"` / `"business"` to upgrade.
 */
export async function setUserPlan(
  userId: string,
  plan: "free" | "pro" | "business",
) {
  const body =
    plan === "free"
      ? { subscription_plan: "free", subscription_status: "free" }
      : { subscription_plan: plan, subscription_status: "active" };

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`,
    {
      method: "PATCH",
      headers: headers(),
      body: JSON.stringify(body),
    },
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`setUserPlan failed (${res.status}): ${text}`);
  }
}

// ---------------------------------------------------------------------------
// Location helpers
// ---------------------------------------------------------------------------

/**
 * Create a test location via Supabase REST API.
 * Returns the full location row.
 */
export async function createTestLocation(userId: string, name: string) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/locations`, {
    method: "POST",
    headers: headers({ Prefer: "return=representation" }),
    body: JSON.stringify({
      user_id: userId,
      name,
      address: "123 Test Street",
      industry: "restaurant",
      tone: "professional",
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`createTestLocation failed (${res.status}): ${text}`);
  }

  const rows = await res.json();
  return rows[0] as {
    id: string;
    user_id: string;
    name: string;
    address: string;
    [key: string]: unknown;
  };
}

/**
 * Delete a test location via Supabase REST API.
 */
export async function deleteTestLocation(locationId: string) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/locations?id=eq.${locationId}`,
    { method: "DELETE", headers: headers() },
  );

  if (!res.ok && res.status !== 404) {
    const text = await res.text();
    throw new Error(`deleteTestLocation failed (${res.status}): ${text}`);
  }
}

// ---------------------------------------------------------------------------
// Review helpers
// ---------------------------------------------------------------------------

/**
 * Create a test review via Supabase REST API.
 * Returns the full review row.
 */
export async function createTestReview(
  userId: string,
  locationId: string,
  data: {
    reviewer_name?: string;
    rating?: number;
    review_text?: string;
    source?: string;
    sentiment?: string;
    sentiment_score?: number;
  } = {},
) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/reviews`, {
    method: "POST",
    headers: headers({ Prefer: "return=representation" }),
    body: JSON.stringify({
      user_id: userId,
      location_id: locationId,
      reviewer_name: data.reviewer_name ?? "E2E Test Reviewer",
      rating: data.rating ?? 4,
      review_text:
        data.review_text ?? "Great service and friendly staff! Highly recommend.",
      source: data.source ?? "google",
      sentiment: data.sentiment ?? "positive",
      sentiment_score: data.sentiment_score ?? 0.85,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`createTestReview failed (${res.status}): ${text}`);
  }

  const rows = await res.json();
  return rows[0] as {
    id: string;
    user_id: string;
    location_id: string;
    reviewer_name: string;
    review_text: string;
    rating: number;
    [key: string]: unknown;
  };
}

/**
 * Delete a test review via Supabase REST API.
 */
export async function deleteTestReview(reviewId: string) {
  // Delete child responses first
  await fetch(
    `${SUPABASE_URL}/rest/v1/responses?review_id=eq.${reviewId}`,
    { method: "DELETE", headers: headers() },
  );

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/reviews?id=eq.${reviewId}`,
    { method: "DELETE", headers: headers() },
  );

  if (!res.ok && res.status !== 404) {
    const text = await res.text();
    throw new Error(`deleteTestReview failed (${res.status}): ${text}`);
  }
}

// ---------------------------------------------------------------------------
// Customer helpers
// ---------------------------------------------------------------------------

/**
 * Create a test customer via Supabase REST API.
 * Returns the full customer row.
 */
export async function createTestCustomer(
  userId: string,
  locationId: string,
  data: { name?: string; email?: string } = {},
) {
  const timestamp = Date.now();
  const res = await fetch(`${SUPABASE_URL}/rest/v1/customers`, {
    method: "POST",
    headers: headers({ Prefer: "return=representation" }),
    body: JSON.stringify({
      user_id: userId,
      location_id: locationId,
      name: data.name ?? `E2E Customer ${timestamp}`,
      email: data.email ?? `e2e-customer-${timestamp}@test.example.com`,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`createTestCustomer failed (${res.status}): ${text}`);
  }

  const rows = await res.json();
  return rows[0] as {
    id: string;
    user_id: string;
    location_id: string;
    name: string;
    email: string;
    [key: string]: unknown;
  };
}

/**
 * Delete a test customer via Supabase REST API.
 */
export async function deleteTestCustomer(customerId: string) {
  // Delete child review_requests first
  await fetch(
    `${SUPABASE_URL}/rest/v1/review_requests?customer_id=eq.${customerId}`,
    { method: "DELETE", headers: headers() },
  );

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/customers?id=eq.${customerId}`,
    { method: "DELETE", headers: headers() },
  );

  if (!res.ok && res.status !== 404) {
    const text = await res.text();
    throw new Error(`deleteTestCustomer failed (${res.status}): ${text}`);
  }
}

// ---------------------------------------------------------------------------
// Cleanup helper
// ---------------------------------------------------------------------------

/**
 * Delete all data associated with a user (locations, reviews, customers, requests, profile, auth).
 * Useful in afterAll hooks.
 */
export async function cleanupTestUser(userId: string) {
  // Delete review requests
  await fetch(
    `${SUPABASE_URL}/rest/v1/review_requests?user_id=eq.${userId}`,
    { method: "DELETE", headers: headers() },
  );

  // Delete customers
  await fetch(
    `${SUPABASE_URL}/rest/v1/customers?user_id=eq.${userId}`,
    { method: "DELETE", headers: headers() },
  );

  // Delete responses for user's reviews
  const reviewsRes = await fetch(
    `${SUPABASE_URL}/rest/v1/reviews?user_id=eq.${userId}&select=id`,
    { method: "GET", headers: headers() },
  );
  if (reviewsRes.ok) {
    const reviews = await reviewsRes.json();
    for (const review of reviews) {
      await fetch(
        `${SUPABASE_URL}/rest/v1/responses?review_id=eq.${review.id}`,
        { method: "DELETE", headers: headers() },
      );
    }
  }

  // Delete reviews
  await fetch(
    `${SUPABASE_URL}/rest/v1/reviews?user_id=eq.${userId}`,
    { method: "DELETE", headers: headers() },
  );

  // Delete locations
  await fetch(
    `${SUPABASE_URL}/rest/v1/locations?user_id=eq.${userId}`,
    { method: "DELETE", headers: headers() },
  );

  // Delete the user
  await deleteTestUser(userId);
}
