import { test, expect } from "@playwright/test";
import {
  createTestUser,
  loginViaUI,
  cleanupTestUser,
  setUserPlan,
} from "../helpers/test-utils";

test.describe("Billing", () => {
  test.describe("Free user", () => {
    let userId: string;
    let email: string;

    test.beforeAll(async () => {
      const user = await createTestUser("bill-free");
      userId = user.id;
      email = user.email;
      // Ensure free plan
      await setUserPlan(userId, "free");
    });

    test.afterAll(async () => {
      await cleanupTestUser(userId);
    });

    test("free user sees billing page with upgrade buttons", async ({
      page,
    }) => {
      await loginViaUI(page, email);

      await page.getByRole("link", { name: "Billing" }).click();
      await page.waitForURL("**/settings/billing");

      // Heading — scope to main to avoid sidebar link conflict
      await expect(
        page.locator("main").getByRole("heading", { name: "Billing" }),
      ).toBeVisible();

      // Current plan section
      await expect(page.getByText("Current Plan")).toBeVisible();
      await expect(page.getByText("Your current subscription details")).toBeVisible();

      // Should show "Free" plan with a status badge (use .first() — may appear in plan name + badge)
      await expect(page.getByText("Free").first()).toBeVisible();
      await expect(page.getByText("free").first()).toBeVisible();

      // Upgrade buttons should be present
      await expect(
        page.getByRole("button", { name: /Upgrade to Pro/i }),
      ).toBeVisible();
      await expect(
        page.getByRole("button", { name: /Upgrade to Business/i }),
      ).toBeVisible();
    });
  });

  test.describe("Pro user", () => {
    let userId: string;
    let email: string;

    test.beforeAll(async () => {
      const user = await createTestUser("bill-pro");
      userId = user.id;
      email = user.email;
      await setUserPlan(userId, "pro");
    });

    test.afterAll(async () => {
      await cleanupTestUser(userId);
    });

    test("pro user sees active plan status", async ({ page }) => {
      await loginViaUI(page, email);

      await page.getByRole("link", { name: "Billing" }).click();
      await page.waitForURL("**/settings/billing");

      // Heading — scope to main to avoid sidebar link conflict
      await expect(
        page.locator("main").getByRole("heading", { name: "Billing" }),
      ).toBeVisible();

      // Should show the plan name and active badge
      await expect(page.getByText("Current Plan")).toBeVisible();
      await expect(page.getByText("active").first()).toBeVisible();
    });
  });
});
