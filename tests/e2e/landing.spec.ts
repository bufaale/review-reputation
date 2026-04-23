import { test, expect } from "@playwright/test";

test.describe("Landing page — Review Reputation", () => {
  test("hero mentions AI review responses and Birdeye price gap", async ({
    page,
  }) => {
    const response = await page.goto("/");
    expect(response?.status()).toBeLessThan(400);
    await expect(
      page.getByText(/AI review responses/i).first()
    ).toBeVisible();
    await expect(page.getByText(/Birdeye/i).first()).toBeVisible();
    await expect(page.getByText(/\$19\/mo/).first()).toBeVisible();
  });

  test("hero mentions $299 competitor and CTA to signup", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText(/\$299/).first()).toBeVisible();
    await expect(
      page.getByRole("link", { name: /Start Free/i }).first()
    ).toBeVisible();
  });

  test("pricing section shows tiers and Most Popular", async ({ page }) => {
    await page.goto("/#pricing");
    await expect(
      page.getByText("Simple, transparent pricing").first()
    ).toBeVisible();
    await expect(page.getByText("Most Popular").first()).toBeVisible();
    await expect(page.getByText("Monthly", { exact: true }).first()).toBeVisible();
  });
});
