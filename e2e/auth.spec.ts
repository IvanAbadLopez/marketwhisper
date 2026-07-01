import { test, expect } from "@playwright/test";

test.describe("Authentication Flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should redirect to login when not authenticated", async ({ page }) => {
    await expect(page).toHaveURL(/.*login/);
  });

  test("should display login page elements", async ({ page }) => {
    await page.goto("/login");

    await expect(page.getByText("MarketWhisper")).toBeVisible();
    await expect(page.getByText("Your Market Intelligence Hub")).toBeVisible();
    await expect(page.getByPlaceholder("you@example.com")).toBeVisible();
    await expect(page.getByPlaceholder("••••••••")).toBeVisible();
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
  });

  test("should show demo credentials info", async ({ page }) => {
    await page.goto("/login");

    await expect(page.getByText("Demo Account:")).toBeVisible();
    await expect(page.getByText("demo@marketwhisper.com")).toBeVisible();
  });

  test("should login with demo credentials and logout", async ({ page }) => {
    await page.goto("/login");

    // Fill login form
    await page.getByPlaceholder("you@example.com").fill("demo@marketwhisper.com");
    await page.getByPlaceholder("••••••••").fill("demo1234");

    // Submit form
    await page.getByRole("button", { name: /sign in/i }).click();

    // Should redirect to homepage
    await expect(page).toHaveURL("/");

    // Should see header with user info
    await expect(page.getByText("Demo User")).toBeVisible();
    await expect(page.getByText("demo@marketwhisper.com")).toBeVisible();

    // Should see logout button
    const logoutButton = page.getByRole("button", { name: /logout/i });
    await expect(logoutButton).toBeVisible();

    // Click logout
    await logoutButton.click();

    // Should redirect to login
    await expect(page).toHaveURL(/.*login/);
  });

  test("should show error with invalid credentials", async ({ page }) => {
    await page.goto("/login");

    // Fill with wrong credentials
    await page.getByPlaceholder("you@example.com").fill("wrong@example.com");
    await page.getByPlaceholder("••••••••").fill("wrongpassword");

    // Submit form
    await page.getByRole("button", { name: /sign in/i }).click();

    // Should show error message
    await expect(page.getByText(/invalid email or password/i)).toBeVisible();
  });

  test("should navigate to register page", async ({ page }) => {
    await page.goto("/login");

    await page.getByRole("link", { name: /register/i }).click();

    await expect(page).toHaveURL(/.*register/);
    await expect(page.getByText("Create Account")).toBeVisible();
  });
});

test.describe("Protected Routes", () => {
  test("should protect home page", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/.*login/);
  });

  test("should allow access after login", async ({ page }) => {
    // Login first
    await page.goto("/login");
    await page.getByPlaceholder("you@example.com").fill("demo@marketwhisper.com");
    await page.getByPlaceholder("••••••••").fill("demo1234");
    await page.getByRole("button", { name: /sign in/i }).click();

    // Should access protected page
    await expect(page).toHaveURL("/");
    await expect(page.getByText("Welcome to MarketWhisper")).toBeVisible();
  });
});
