import { test, expect } from "@playwright/test";
import {
  createTestUser,
  loginViaUI,
  cleanupTestUser,
  setUserPlan,
  createTestLocation,
} from "../helpers/test-utils";

test.describe("Review Requests", () => {
  let userId: string;
  let email: string;
  let locationId: string;
  let locationName: string;

  test.beforeAll(async () => {
    const user = await createTestUser("req");
    userId = user.id;
    email = user.email;
    await setUserPlan(userId, "pro");

    // Create a location for requests
    locationName = `E2E Request Loc ${Date.now()}`;
    const location = await createTestLocation(userId, locationName);
    locationId = location.id;
  });

  test.afterAll(async () => {
    await cleanupTestUser(userId);
  });

  test("requests page loads with heading and location selector", async ({
    page,
  }) => {
    await loginViaUI(page, email);

    await page.getByRole("link", { name: "Review Requests" }).click();
    await page.waitForURL("**/dashboard/requests");

    await expect(
      page.locator("main").getByRole("heading", { name: "Review Requests" }),
    ).toBeVisible();

    // Location selector should be present (use .first() — label + combobox placeholder)
    await expect(page.getByText("Select a location").first()).toBeVisible({
      timeout: 15_000,
    });
  });

  test("selecting a location shows customer management", async ({ page }) => {
    await loginViaUI(page, email);
    await page.goto("/dashboard/requests");

    // Wait for the page to load — scope to main to avoid sidebar conflict
    await expect(
      page.locator("main").getByRole("heading", { name: "Review Requests" }),
    ).toBeVisible();

    // Open the location dropdown and select the test location
    await page.getByText("Select a location").first().click();
    await page.getByRole("option", { name: locationName }).click();

    // Should show the Customers tab
    await expect(page.getByRole("tab", { name: /Customers/i })).toBeVisible({
      timeout: 15_000,
    });

    // Should show the "Add Customer" button
    await expect(
      page.getByRole("button", { name: "Add Customer" }),
    ).toBeVisible();
  });

  test("add customer dialog works", async ({ page }) => {
    await loginViaUI(page, email);
    await page.goto("/dashboard/requests");

    // Wait for the page to load — scope to main to avoid sidebar conflict
    await expect(
      page.locator("main").getByRole("heading", { name: "Review Requests" }),
    ).toBeVisible();

    // Select location
    await page.getByText("Select a location").first().click();
    await page.getByRole("option", { name: locationName }).click();

    // Wait for customers tab to load
    await expect(
      page.getByRole("button", { name: "Add Customer" }),
    ).toBeVisible({ timeout: 15_000 });

    // Click "Add Customer" button
    await page.getByRole("button", { name: "Add Customer" }).click();

    // Dialog should appear
    await expect(
      page.getByRole("heading", { name: "Add Customer" }),
    ).toBeVisible();

    // Fill out the customer form
    const customerName = `E2E Customer ${Date.now()}`;
    await page.getByLabel("Name").fill(customerName);
    await page
      .getByLabel("Email")
      .fill(`e2e-test-${Date.now()}@test.example.com`);

    // Submit
    await page.getByRole("button", { name: "Add Customer" }).last().click();

    // Wait for the dialog to close and customer to appear in the table
    await expect(page.getByText(customerName)).toBeVisible({
      timeout: 15_000,
    });
  });

  test("request history tab is accessible", async ({ page }) => {
    await loginViaUI(page, email);
    await page.goto("/dashboard/requests");

    // Wait for the page to load — scope to main to avoid sidebar conflict
    await expect(
      page.locator("main").getByRole("heading", { name: "Review Requests" }),
    ).toBeVisible();

    // Select location
    await page.getByText("Select a location").first().click();
    await page.getByRole("option", { name: locationName }).click();

    // Wait for tabs to appear
    await expect(
      page.getByRole("tab", { name: /Customers/i }),
    ).toBeVisible({ timeout: 15_000 });

    // Click the Request History tab
    await page.getByRole("tab", { name: /Request History/i }).click();

    // Should show the history card (use .first() — tab text + card heading)
    await expect(page.getByText("Request History").first()).toBeVisible();
    await expect(
      page.getByText("Recent review requests sent from this location"),
    ).toBeVisible();
  });
});
