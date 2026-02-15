import { test, expect } from "@playwright/test";
import {
  createTestUser,
  loginViaUI,
  cleanupTestUser,
  setUserPlan,
  createTestLocation,
  deleteTestLocation,
} from "../helpers/test-utils";

test.describe("Locations", () => {
  let userId: string;
  let email: string;

  test.beforeAll(async () => {
    const user = await createTestUser("loc");
    userId = user.id;
    email = user.email;
    // Set to Pro plan so we have enough location quota
    await setUserPlan(userId, "pro");
  });

  test.afterAll(async () => {
    await cleanupTestUser(userId);
  });

  test("locations list page loads for a new user", async ({ page }) => {
    await loginViaUI(page, email);

    await page.getByRole("link", { name: "Locations" }).click();
    await page.waitForURL("**/dashboard/locations");

    await expect(
      page.locator("main").getByRole("heading", { name: "Locations" }),
    ).toBeVisible();

    // The "Add Location" button should be visible (use .first() — empty state CTA + header button)
    await expect(
      page.getByRole("button", { name: "Add Location" }).first(),
    ).toBeVisible();
  });

  test("add location dialog works and new location appears in list", async ({
    page,
  }) => {
    await loginViaUI(page, email);
    await page.goto("/dashboard/locations");

    // Wait for the page to load
    await expect(
      page.locator("main").getByRole("heading", { name: "Locations" }),
    ).toBeVisible();

    // Click Add Location button (use .first() — empty state CTA + header button)
    await page.getByRole("button", { name: "Add Location" }).first().click();

    // Wait for dialog to appear
    await expect(
      page.getByRole("heading", { name: "Add Location" }),
    ).toBeVisible();

    // Fill out the form
    const locationName = `E2E Pizzeria ${Date.now()}`;
    await page.getByLabel("Business Name").fill(locationName);
    await page.getByLabel("Address").fill("456 Test Ave, Testville, TS");

    // Submit the form
    await page.getByRole("button", { name: "Create Location" }).click();

    // Wait for the dialog to close and the new location to appear
    await expect(page.getByText(locationName)).toBeVisible({
      timeout: 15_000,
    });

    // Verify the address also appears
    await expect(page.getByText("456 Test Ave")).toBeVisible();
  });

  test("location detail page loads when clicking a location", async ({
    page,
  }) => {
    // Create a location via API for deterministic state
    const location = await createTestLocation(userId, `E2E Detail ${Date.now()}`);

    try {
      await loginViaUI(page, email);
      await page.goto(`/dashboard/locations/${location.id}`);

      // Should see the location name as a heading
      await expect(
        page.getByRole("heading", { name: location.name }),
      ).toBeVisible({ timeout: 15_000 });

      // Address should be visible
      await expect(page.getByText("123 Test Street")).toBeVisible();

      // Tabs for Reviews / Add Review / Import CSV
      await expect(page.getByRole("tab", { name: "Reviews" })).toBeVisible();
      await expect(
        page.getByRole("tab", { name: "Add Review" }),
      ).toBeVisible();
    } finally {
      await deleteTestLocation(location.id);
    }
  });

  test("delete location works", async ({ page }) => {
    // Create a location to delete
    const location = await createTestLocation(userId, `E2E Delete ${Date.now()}`);

    await loginViaUI(page, email);
    await page.goto("/dashboard/locations");

    // Wait for the location to appear in the list
    await expect(page.getByText(location.name)).toBeVisible({
      timeout: 15_000,
    });

    // The delete button is hidden until hover; use force click
    // First, find the card containing our location and hover over it
    const locationCard = page
      .locator('[class*="card"]')
      .filter({ hasText: location.name })
      .first();

    await locationCard.hover();

    // Click the trash icon button (it becomes visible on hover)
    const trashButton = locationCard.getByRole("button").filter({
      has: page.locator("svg"),
    });
    // The trash button may be at the top-right; click it
    await trashButton.first().click({ force: true });

    // Confirm deletion
    await page.getByRole("button", { name: "Confirm" }).click();

    // Wait for location to disappear from the list
    await expect(page.getByText(location.name)).toBeHidden({
      timeout: 15_000,
    });
  });
});
