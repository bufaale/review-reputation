import { test, expect } from "@playwright/test";
import {
  createTestUser,
  loginViaUI,
  cleanupTestUser,
  setUserPlan,
} from "../helpers/test-utils";

test.describe("Settings", () => {
  let userId: string;
  let email: string;

  test.beforeAll(async () => {
    const user = await createTestUser("settings");
    userId = user.id;
    email = user.email;
    // Use pro plan so brand customization is available
    await setUserPlan(userId, "pro");
  });

  test.afterAll(async () => {
    await cleanupTestUser(userId);
  });

  test("settings page loads with profile form", async ({ page }) => {
    await loginViaUI(page, email);

    await page.getByRole("link", { name: "Profile" }).click();
    await page.waitForURL("**/settings");

    // Heading — scope to main to avoid sidebar link conflict
    await expect(
      page.locator("main").getByRole("heading", { name: "Profile Settings" }),
    ).toBeVisible();

    await expect(
      page.getByText("Manage your account information"),
    ).toBeVisible();

    // Profile card
    await expect(
      page.getByText("Profile").first(),
    ).toBeVisible();
    await expect(
      page.getByText("Update your personal information"),
    ).toBeVisible();
  });

  test("full name field is editable", async ({ page }) => {
    await loginViaUI(page, email);
    await page.goto("/settings");

    // Wait for the form to load (not skeleton state)
    await expect(page.getByLabel("Full Name")).toBeVisible({
      timeout: 15_000,
    });

    // The Full Name field should be editable
    const fullNameInput = page.getByLabel("Full Name");
    await expect(fullNameInput).toBeEditable();

    // Verify we can type into it
    await fullNameInput.clear();
    await fullNameInput.fill("E2E Updated Name");
    await expect(fullNameInput).toHaveValue("E2E Updated Name");
  });

  test("email field is disabled", async ({ page }) => {
    await loginViaUI(page, email);
    await page.goto("/settings");

    // Wait for the form to load
    await expect(page.getByLabel("Full Name")).toBeVisible({
      timeout: 15_000,
    });

    // Email field should be disabled
    const emailInput = page.getByLabel("Email");
    await expect(emailInput).toBeDisabled();

    // Should contain the user's email
    await expect(emailInput).toHaveValue(email);

    // Note about email not changeable
    await expect(
      page.getByText("Email cannot be changed here"),
    ).toBeVisible();
  });

  test("brand customization section is visible", async ({ page }) => {
    await loginViaUI(page, email);
    await page.goto("/settings");

    // Wait for the form to load
    await expect(page.getByLabel("Full Name")).toBeVisible({
      timeout: 15_000,
    });

    // Brand Settings card (use exact: true to avoid matching "Save Brand Settings" button)
    await expect(
      page.getByText("Brand Settings", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText(
        "Customize your brand appearance for review requests and public pages",
      ),
    ).toBeVisible();

    // Company Name field
    await expect(page.getByLabel("Company Name")).toBeVisible();

    // Primary / Secondary color fields
    await expect(page.getByLabel("Primary Color")).toBeVisible();
    await expect(page.getByLabel("Secondary Color")).toBeVisible();
  });

  test("can save profile changes", async ({ page }) => {
    await loginViaUI(page, email);
    await page.goto("/settings");

    // Wait for the form to load
    await expect(page.getByLabel("Full Name")).toBeVisible({
      timeout: 15_000,
    });

    // Update full name
    const fullNameInput = page.getByLabel("Full Name");
    await fullNameInput.clear();
    await fullNameInput.fill(`E2E Save Test ${Date.now()}`);

    // Click save button - the first "Save Changes" button is for the profile form
    await page.getByRole("button", { name: "Save Changes" }).first().click();

    // Should see success toast
    await expect(
      page.getByText("Profile updated successfully"),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("brand settings are editable for pro users", async ({ page }) => {
    await loginViaUI(page, email);
    await page.goto("/settings");

    // Wait for the form to load
    await expect(page.getByLabel("Full Name")).toBeVisible({
      timeout: 15_000,
    });

    // Company Name should be editable for Pro users
    const companyNameInput = page.getByLabel("Company Name");
    await expect(companyNameInput).toBeEditable();

    // Fill in company name
    await companyNameInput.clear();
    await companyNameInput.fill("E2E Test Company");

    // Save brand settings
    await page
      .getByRole("button", { name: "Save Brand Settings" })
      .click();

    // Should see success toast
    await expect(
      page.getByText("Brand settings updated successfully"),
    ).toBeVisible({ timeout: 10_000 });
  });
});

test.describe("Settings - Free user brand restrictions", () => {
  let userId: string;
  let email: string;

  test.beforeAll(async () => {
    const user = await createTestUser("settings-free");
    userId = user.id;
    email = user.email;
    await setUserPlan(userId, "free");
  });

  test.afterAll(async () => {
    await cleanupTestUser(userId);
  });

  test("free user sees brand customization locked behind Pro", async ({
    page,
  }) => {
    await loginViaUI(page, email);
    await page.goto("/settings");

    // Wait for the form to load
    await expect(page.getByLabel("Full Name")).toBeVisible({
      timeout: 15_000,
    });

    // Brand settings card should show the Pro badge (use exact: true to avoid matching button text)
    await expect(
      page.getByText("Brand Settings", { exact: true }),
    ).toBeVisible();

    // Should see the "Upgrade to Pro to customize your brand" text
    await expect(
      page.getByText("Upgrade to Pro to customize your brand"),
    ).toBeVisible();

    // Company Name field should be disabled
    const companyNameInput = page.getByLabel("Company Name");
    await expect(companyNameInput).toBeDisabled();
  });
});
