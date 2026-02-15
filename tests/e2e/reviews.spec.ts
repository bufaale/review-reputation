import { test, expect } from "@playwright/test";
import {
  createTestUser,
  loginViaUI,
  cleanupTestUser,
  setUserPlan,
  createTestLocation,
  createTestReview,
} from "../helpers/test-utils";

test.describe("Reviews", () => {
  let userId: string;
  let email: string;
  let locationId: string;
  let locationName: string;

  test.beforeAll(async () => {
    const user = await createTestUser("rev");
    userId = user.id;
    email = user.email;
    await setUserPlan(userId, "pro");

    // Create a location for reviews
    locationName = `E2E Review Loc ${Date.now()}`;
    const location = await createTestLocation(userId, locationName);
    locationId = location.id;
  });

  test.afterAll(async () => {
    await cleanupTestUser(userId);
  });

  test("reviews list page loads", async ({ page }) => {
    await loginViaUI(page, email);

    await page.getByRole("link", { name: "Reviews" }).click();
    await page.waitForURL("**/dashboard/reviews");

    await expect(
      page.getByRole("heading", { name: "Reviews", level: 1 }),
    ).toBeVisible();
  });

  test("add review on location detail page", async ({ page }) => {
    await loginViaUI(page, email);
    await page.goto(`/dashboard/locations/${locationId}`);

    // Wait for the page to load
    await expect(
      page.getByRole("heading", { name: locationName }),
    ).toBeVisible({ timeout: 15_000 });

    // Switch to "Add Review" tab
    await page.getByRole("tab", { name: "Add Review" }).click();

    // Fill out the review form
    const reviewerName = `E2E Reviewer ${Date.now()}`;
    await page.getByLabel("Reviewer Name").fill(reviewerName);

    // Fill review text
    await page
      .getByLabel("Review Text")
      .fill(
        "Excellent experience! The food was amazing and the service was top notch.",
      );

    // Submit the review
    await page.getByRole("button", { name: "Add Review" }).click();

    // Should switch back to the Reviews tab and show the new review
    await expect(page.getByText(reviewerName)).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText("Excellent experience!")).toBeVisible();
  });

  test("review detail page loads with review content", async ({ page }) => {
    // Create a review via API for deterministic state
    const review = await createTestReview(userId, locationId, {
      reviewer_name: `E2E Detail Review ${Date.now()}`,
      rating: 5,
      review_text: "Absolutely fantastic! Best place in town.",
    });

    await loginViaUI(page, email);
    await page.goto(`/dashboard/reviews/${review.id}`);

    // Should show the reviewer name
    await expect(
      page.getByText(review.reviewer_name),
    ).toBeVisible({ timeout: 15_000 });

    // Should show the review text
    await expect(
      page.getByText("Absolutely fantastic! Best place in town."),
    ).toBeVisible();

    // Should show the "Back to Reviews" link
    await expect(page.getByText("Back to Reviews")).toBeVisible();

    // Should have the location name as a link
    await expect(page.getByText(locationName)).toBeVisible();
  });

  test("AI generate response button exists on review detail page", async ({
    page,
  }) => {
    // Create a review that has no responses
    const review = await createTestReview(userId, locationId, {
      reviewer_name: `E2E AI Test ${Date.now()}`,
      rating: 3,
      review_text: "Decent food but the wait was too long. Could improve.",
    });

    await loginViaUI(page, email);
    await page.goto(`/dashboard/reviews/${review.id}`);

    // Wait for the review detail to load
    await expect(
      page.getByText(review.reviewer_name),
    ).toBeVisible({ timeout: 15_000 });

    // Should see the "AI Response" heading (exact match to avoid matching "Generate AI Response" button)
    await expect(page.getByText("AI Response", { exact: true })).toBeVisible();

    // Should see the "Generate AI Response" button (no response generated yet)
    await expect(
      page.getByRole("button", { name: /Generate AI Response/i }),
    ).toBeVisible();
  });

  test("reviews list shows reviews with filters", async ({ page }) => {
    // Create a couple of reviews to ensure the list is not empty
    await createTestReview(userId, locationId, {
      reviewer_name: "Filter Test Positive",
      rating: 5,
      review_text: "Great!",
      sentiment: "positive",
    });

    await createTestReview(userId, locationId, {
      reviewer_name: "Filter Test Negative",
      rating: 1,
      review_text: "Bad experience.",
      sentiment: "negative",
    });

    await loginViaUI(page, email);
    await page.goto("/dashboard/reviews");

    // Wait for the page to load with reviews — scope to main to avoid sidebar conflict
    await expect(
      page.getByRole("heading", { name: "Reviews", level: 1 }),
    ).toBeVisible();

    // Should show some total count text
    await expect(page.getByText(/total reviews/i)).toBeVisible({
      timeout: 15_000,
    });

    // Verify filter dropdowns exist
    await expect(page.getByText("All Locations")).toBeVisible();
    await expect(page.getByText("All Sentiments")).toBeVisible();
    await expect(page.getByText("Newest First")).toBeVisible();
  });
});
