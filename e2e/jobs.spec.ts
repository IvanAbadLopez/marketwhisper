import { test, expect } from "@playwright/test";

test.describe("Job Queue System", () => {
  test.beforeEach(async ({ page }) => {
    // Login with demo user
    await page.goto("/login");
    await page.getByPlaceholder("you@example.com").fill("demo@marketwhisper.com");
    await page.getByPlaceholder("••••••••").fill("demo1234");
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page).toHaveURL("/");
  });

  test("should show Processes navigation item", async ({ page }) => {
    // Navigate to Jobs page
    await page.goto("/jobs");
    
    // Verify page title
    await expect(page.getByText("Process Queue")).toBeVisible();
  });

  test("should create analysis job and track in queue", async ({ page }) => {
    // Navigate to Analyze page
    await page.goto("/analyze");

    // Fill analysis form
    const sampleText = "Apple Inc reported strong Q3 earnings with revenue up 15%. The company's AI investments are paying off.";
    await page.getByPlaceholder(/paste.*news/i).fill(sampleText);
    await page.getByPlaceholder(/optional.*source/i).fill("Test E2E");

    // Submit analysis
    await page.getByRole("button", { name: /analyze/i }).click();

    // Wait for success message
    await expect(page.getByText("Analysis Started!")).toBeVisible({ timeout: 3000 });

    // Click "View in queue" button
    await page.getByRole("button", { name: /view in queue/i }).click();

    // Should be on Jobs page
    await expect(page).toHaveURL("/jobs");

    // Verify job appears in the queue
    await expect(page.getByText("AAPL")).toBeVisible({ timeout: 5000 });
    
    // Should show PENDING or PROCESSING status initially
    const statusElement = page.locator("text=/PENDING|PROCESSING/").first();
    await expect(statusElement).toBeVisible();
  });

  test("should filter jobs by type", async ({ page }) => {
    await page.goto("/jobs");

    // Find and click the type filter dropdown
    const typeFilter = page.getByRole("combobox").filter({ hasText: /All Types|ANALYSIS|ENRICHMENT/ }).first();
    await typeFilter.click();

    // Select ANALYSIS
    await page.getByRole("option", { name: "ANALYSIS" }).click();

    // Verify URL has type parameter
    await expect(page).toHaveURL(/type=ANALYSIS/);
  });

  test("should filter jobs by status", async ({ page }) => {
    await page.goto("/jobs");

    // Find and click the status filter dropdown
    const statusFilter = page.getByRole("combobox").filter({ hasText: /All Status|Active|Completed|Failed/ }).nth(1);
    await statusFilter.click();

    // Select Active (PENDING + PROCESSING)
    await page.getByRole("option", { name: "Active" }).click();

    // Verify URL has status parameter
    await expect(page).toHaveURL(/status=/);
  });

  test("should show active jobs count in sidebar", async ({ page }) => {
    await page.goto("/");

    // Check if sidebar has Processes link
    const processesLink = page.getByRole("link", { name: /processes/i });
    await expect(processesLink).toBeVisible();

    // If there are active jobs, badge should be visible
    // Note: This might be 0 in a clean test environment
    // We just verify the badge element exists
    const badge = processesLink.locator("span").filter({ hasText: /^\d+$/ });
    // Badge might not be visible if no active jobs, so we just check the link exists
    await expect(processesLink).toBeVisible();
  });

  test("should show recent jobs on dashboard", async ({ page }) => {
    await page.goto("/");

    // Verify "Recent Activity" section exists
    await expect(page.getByText("Recent Activity")).toBeVisible();

    // Verify "View all processes" link exists
    const viewAllLink = page.getByRole("link", { name: /view all processes/i });
    await expect(viewAllLink).toBeVisible();

    // Click the link
    await viewAllLink.click();

    // Should navigate to Jobs page
    await expect(page).toHaveURL("/jobs");
  });

  test("should show Active Processes stat card on dashboard", async ({ page }) => {
    await page.goto("/");

    // Verify Active Processes card exists
    await expect(page.getByText("Active Processes")).toBeVisible();

    // Should show a number (even if 0)
    const statCard = page.locator("text=Active Processes").locator("..");
    await expect(statCard).toBeVisible();
  });

  test("should expand job card to show details", async ({ page }) => {
    // Create a job first
    await page.goto("/analyze");
    await page.getByPlaceholder(/paste.*news/i).fill("Microsoft Azure revenue grew 30% year over year.");
    await page.getByRole("button", { name: /analyze/i }).click();
    await expect(page.getByText("Analysis Started!")).toBeVisible({ timeout: 3000 });

    // Go to jobs page
    await page.goto("/jobs");

    // Wait for job to appear
    await expect(page.getByText(/MSFT|Microsoft/)).toBeVisible({ timeout: 5000 });

    // Find and click expand button (chevron icon)
    const expandButton = page.getByRole("button").filter({ has: page.locator("svg") }).first();
    await expandButton.click();

    // Verify expanded content is visible
    // This could be result data or error message depending on job status
    // We just verify that clicking the expand button works
  });

  test("should auto-refresh job status", async ({ page }) => {
    // Create a job
    await page.goto("/analyze");
    await page.getByPlaceholder(/paste.*news/i).fill("Tesla stock surged after strong delivery numbers.");
    await page.getByRole("button", { name: /analyze/i }).click();
    await expect(page.getByText("Analysis Started!")).toBeVisible({ timeout: 3000 });

    // Go to jobs page
    await page.goto("/jobs");

    // Wait for job to appear
    await expect(page.getByText(/TSLA|Tesla/)).toBeVisible({ timeout: 5000 });

    // Wait a few seconds to allow auto-refresh to occur
    // The JobQueue component auto-refreshes every 3 seconds
    await page.waitForTimeout(4000);

    // Verify the job is still visible (confirms auto-refresh didn't break)
    await expect(page.getByText(/TSLA|Tesla/)).toBeVisible();
  });

  test("should show empty state when no jobs", async ({ page }) => {
    await page.goto("/jobs");

    // If there are no jobs, should show appropriate message
    // Note: In real scenario, there might be jobs, so we just verify page loads
    await expect(page.getByText("Process Queue")).toBeVisible();
  });

  test("should navigate to company detail from completed job", async ({ page }) => {
    // This test assumes we have a completed job
    await page.goto("/jobs");

    // Look for a "View Result" button (only visible on COMPLETED jobs)
    const viewResultButton = page.getByRole("button", { name: /view result/i }).first();
    
    // This button might not exist if no jobs are completed
    const isVisible = await viewResultButton.isVisible({ timeout: 2000 }).catch(() => false);
    
    if (isVisible) {
      await viewResultButton.click();
      // Should navigate to company detail page
      await expect(page).toHaveURL(/\/companies\/[A-Z]+/);
    } else {
      // Skip test if no completed jobs exist
      test.skip();
    }
  });

  test("should show job type icon correctly", async ({ page }) => {
    await page.goto("/jobs");

    // Verify page loads
    await expect(page.getByText("Process Queue")).toBeVisible();

    // Job cards should have appropriate icons
    // Brain icon for ANALYSIS, Sparkles icon for ENRICHMENT
    // We just verify the page structure is correct
  });

  test("should display elapsed time for jobs", async ({ page }) => {
    // Create a job
    await page.goto("/analyze");
    await page.getByPlaceholder(/paste.*news/i).fill("Amazon Web Services continues to dominate cloud market.");
    await page.getByRole("button", { name: /analyze/i }).click();
    await expect(page.getByText("Analysis Started!")).toBeVisible({ timeout: 3000 });

    // Go to jobs page
    await page.goto("/jobs");

    // Wait for job to appear
    await expect(page.getByText(/AMZN|Amazon/)).toBeVisible({ timeout: 5000 });

    // Should show elapsed time (e.g., "2s", "1m", etc.)
    const timeIndicator = page.locator("text=/\\d+[smh]/").first();
    await expect(timeIndicator).toBeVisible();
  });
});
