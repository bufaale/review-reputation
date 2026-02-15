import { test, expect } from "@playwright/test";
import {
  createTestUser,
  loginViaUI,
  cleanupTestUser,
} from "../helpers/test-utils";

test.describe("Authentication", () => {
  let userId: string;
  let email: string;

  test.beforeAll(async () => {
    const user = await createTestUser("auth");
    userId = user.id;
    email = user.email;
  });

  test.afterAll(async () => {
    await cleanupTestUser(userId);
  });

  test("login with valid credentials redirects to dashboard", async ({
    page,
  }) => {
    await loginViaUI(page, email);

    // Should be on dashboard
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(
      page.getByRole("heading", { name: "Dashboard" }),
    ).toBeVisible();
    await expect(page.getByText("Welcome back")).toBeVisible();
  });

  test("login with wrong password shows error", async ({ page }) => {
    await page.goto("/login");

    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill("WrongPassword999!");
    await page.getByRole("button", { name: "Sign in" }).click();

    // Should show an error message and remain on login page
    await expect(page.getByText(/invalid/i)).toBeVisible({ timeout: 10_000 });
    await expect(page).toHaveURL(/\/login/);
  });

  test("unauthenticated dashboard access redirects to login", async ({
    page,
  }) => {
    // Clear cookies to ensure no session
    await page.context().clearCookies();

    await page.goto("/dashboard");

    // Should be redirected to login
    await expect(page).toHaveURL(/\/login/, { timeout: 15_000 });
  });

  test("signup page renders all fields and links", async ({ page }) => {
    await page.goto("/signup");

    // All required form elements
    await expect(
      page.getByText("Create an account"),
    ).toBeVisible();
    await expect(page.getByLabel("Full name")).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Sign up" }),
    ).toBeVisible();

    // Google OAuth button
    await expect(
      page.getByRole("button", { name: /google/i }),
    ).toBeVisible();

    // Link to login
    await expect(page.getByRole("link", { name: "Sign in" })).toBeVisible();
  });

  test("forgot password link from login works", async ({ page }) => {
    await page.goto("/login");

    await page
      .getByRole("link", { name: /forgot password/i })
      .click();

    await page.waitForURL("**/forgot-password");
    await expect(
      page.getByText("Reset your password"),
    ).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Send reset link" }),
    ).toBeVisible();
  });

  test("login page has link to signup", async ({ page }) => {
    await page.goto("/login");

    const signUpLink = page.getByRole("link", { name: "Sign up" });
    await expect(signUpLink).toBeVisible();
    await signUpLink.click();

    await page.waitForURL("**/signup");
    await expect(
      page.getByText("Create an account"),
    ).toBeVisible();
  });

  test("signup page has link back to login", async ({ page }) => {
    await page.goto("/signup");

    const signInLink = page.getByRole("link", { name: "Sign in" });
    await expect(signInLink).toBeVisible();
    await signInLink.click();

    await page.waitForURL("**/login");
    await expect(
      page.getByText("Welcome back"),
    ).toBeVisible();
  });
});
