import { test, expect } from "@playwright/test";
import {
  createTestUser,
  loginViaUI,
  cleanupTestUser,
} from "../helpers/test-utils";

// ---------------------------------------------------------------------------
// Public page navigation
// ---------------------------------------------------------------------------

test.describe("Public pages", () => {
  test("landing page renders hero section", async ({ page }) => {
    await page.goto("/");

    // Hero heading (h1)
    await expect(
      page.getByRole("heading", {
        name: /AI-Powered Review Responses in Seconds/i,
      }),
    ).toBeVisible();

    // CTA buttons
    await expect(
      page.getByRole("link", { name: "Start Free" }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "View Pricing" }),
    ).toBeVisible();

    // Subtitle text
    await expect(page.getByText("No credit card required")).toBeVisible();
  });

  test("landing page renders features section", async ({ page }) => {
    await page.goto("/");

    // h2 element
    await expect(
      page.getByText("Everything you need to manage your reputation"),
    ).toBeVisible();

    // Feature card titles (rendered in CardTitle = div)
    await expect(page.getByText("AI Response Generation")).toBeVisible();
    await expect(page.getByText("Sentiment Analysis")).toBeVisible();
    await expect(page.getByText("Reputation Dashboard")).toBeVisible();
  });

  test("landing page renders pricing section", async ({ page }) => {
    await page.goto("/");

    // h2 element
    await expect(
      page.getByText("Simple, transparent pricing"),
    ).toBeVisible();

    // Plan names (inside CardTitle = div, not heading role)
    await expect(page.getByText("Free").first()).toBeVisible();
    await expect(page.getByText("Pro").first()).toBeVisible();
    await expect(page.getByText("Business").first()).toBeVisible();
  });

  test("login page renders correctly", async ({ page }) => {
    await page.goto("/login");

    // CardTitle renders as div, not heading
    await expect(page.getByText("Welcome back")).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Sign in" }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "Sign up" })).toBeVisible();
  });

  test("signup page renders correctly", async ({ page }) => {
    await page.goto("/signup");

    // CardTitle renders as div, not heading
    await expect(page.getByText("Create an account")).toBeVisible();
    await expect(page.getByLabel("Full name")).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Sign up" }),
    ).toBeVisible();
  });

  test("forgot password page renders correctly", async ({ page }) => {
    await page.goto("/forgot-password");

    // CardTitle renders as div, not heading
    await expect(page.getByText("Reset your password")).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Send reset link" }),
    ).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Authenticated navigation
// ---------------------------------------------------------------------------

test.describe("Authenticated navigation", () => {
  let userId: string;
  let email: string;

  test.beforeAll(async () => {
    const user = await createTestUser("nav");
    userId = user.id;
    email = user.email;
  });

  test.afterAll(async () => {
    await cleanupTestUser(userId);
  });

  test("dashboard loads after login", async ({ page }) => {
    await loginViaUI(page, email);

    // Dashboard uses <h1> directly — scope to main to avoid sidebar conflicts
    await expect(
      page.locator("main").getByRole("heading", { name: "Dashboard" }),
    ).toBeVisible();
    await expect(page.getByText("Welcome back")).toBeVisible();
  });

  test("sidebar Locations link navigates to locations page", async ({
    page,
  }) => {
    await loginViaUI(page, email);

    await page.getByRole("link", { name: "Locations" }).click();
    await page.waitForURL("**/dashboard/locations");

    await expect(
      page.locator("main").getByRole("heading", { name: "Locations" }),
    ).toBeVisible();
  });

  test("sidebar Reviews link navigates to reviews page", async ({ page }) => {
    await loginViaUI(page, email);

    await page.getByRole("link", { name: "Reviews" }).click();
    await page.waitForURL("**/dashboard/reviews");

    await expect(
      page.getByRole("heading", { name: "Reviews", level: 1 }),
    ).toBeVisible();
  });

  test("sidebar Review Requests link navigates to requests page", async ({
    page,
  }) => {
    await loginViaUI(page, email);

    await page.getByRole("link", { name: "Review Requests" }).click();
    await page.waitForURL("**/dashboard/requests");

    await expect(
      page.locator("main").getByRole("heading", { name: "Review Requests" }),
    ).toBeVisible();
  });

  test("sidebar Profile link navigates to settings page", async ({
    page,
  }) => {
    await loginViaUI(page, email);

    await page.getByRole("link", { name: "Profile" }).click();
    await page.waitForURL("**/settings");

    await expect(
      page.locator("main").getByRole("heading", { name: "Profile Settings" }),
    ).toBeVisible();
  });

  test("sidebar Billing link navigates to billing page", async ({ page }) => {
    await loginViaUI(page, email);

    await page.getByRole("link", { name: "Billing" }).click();
    await page.waitForURL("**/settings/billing");

    await expect(
      page.locator("main").getByRole("heading", { name: "Billing" }),
    ).toBeVisible();
  });
});
