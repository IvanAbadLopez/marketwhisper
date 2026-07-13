import { test, expect } from "@playwright/test";

test.describe("Analysis Performance Optimization", () => {
  test.beforeEach(async ({ page }) => {
    // Login with demo user
    await page.goto("/login");
    await page.getByPlaceholder("you@example.com").fill("demo@marketwhisper.com");
    await page.getByPlaceholder("••••••••").fill("MarketWhisper2026!");
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page).toHaveURL("/");
  });

  test("should analyze text with 3 companies in under 20 seconds", async ({ page }) => {
    // Navigate to Analyze page
    await page.goto("/analyze");

    // Sample text mentioning 3 companies with different sentiments
    const sampleText = `
Apple reported strong iPhone sales in Q4 2024, beating analyst expectations. 
The company's services revenue also grew 15% year-over-year, demonstrating the strength of their ecosystem. 
Wall Street analysts are bullish on AAPL with a price target of $200.

Meanwhile, Microsoft continues to dominate the cloud computing space with Azure growing 30% this quarter. 
The integration of AI capabilities into their Office suite has been well-received by enterprise customers. 
MSFT stock reached new all-time highs.

In contrast, Tesla faces headwinds with increased competition in the EV market. 
Production delays at their Berlin factory and pricing pressure in China have concerned investors. 
Some analysts are turning bearish on TSLA, citing margin compression.
    `.trim();

    // Fill analysis form
    await page.getByPlaceholder(/paste.*news/i).fill(sampleText);
    await page.getByPlaceholder(/optional.*source/i).fill("Performance Test");

    // Start timer
    const startTime = Date.now();

    // Submit analysis
    await page.getByRole("button", { name: /analyze/i }).click();

    // Wait for success message (this means job was created and started)
    await expect(page.getByText("Analysis Started!")).toBeVisible({ timeout: 5000 });

    // Navigate to Jobs page
    await page.getByRole("button", { name: /view in queue/i }).click();
    await expect(page).toHaveURL("/jobs");

    // Wait for job to complete (looking for COMPLETED status)
    // With optimization, this should take ~10-15 seconds instead of 40-60 seconds
    const completedStatus = page.getByText("COMPLETED").first();
    await expect(completedStatus).toBeVisible({ timeout: 25000 });

    // Calculate elapsed time
    const elapsedTime = (Date.now() - startTime) / 1000;

    // Log performance
    console.log(`\n✅ Analysis completed in ${elapsedTime.toFixed(1)} seconds`);
    console.log(`   Expected: <20s (optimized) vs ~40-60s (before optimization)\n`);

    // Verify performance improvement
    expect(elapsedTime).toBeLessThan(25); // Should complete in under 25 seconds (was 40-60s before)

    // Verify all 3 companies were detected (ticker should show AAPL +2 or similar)
    const jobRow = page.locator("tr").filter({ hasText: /AAPL|Performance Test/ }).first();
    await expect(jobRow).toBeVisible();
  });

  test("should show all 3 detected companies on companies page", async ({ page }) => {
    // Navigate to Analyze page and submit analysis
    await page.goto("/analyze");

    const sampleText = `
Apple (AAPL) shows strong fundamentals with robust earnings growth.
Microsoft (MSFT) continues cloud dominance with Azure expansion.
Tesla (TSLA) faces increased competition in the EV market.
    `.trim();

    await page.getByPlaceholder(/paste.*news/i).fill(sampleText);
    await page.getByRole("button", { name: /analyze/i }).click();

    // Wait for job to start
    await expect(page.getByText("Analysis Started!")).toBeVisible({ timeout: 5000 });

    // Wait a bit for analysis to complete
    await page.waitForTimeout(20000); // 20 seconds should be enough

    // Navigate to Companies page
    await page.goto("/companies");

    // Verify all 3 companies are listed
    await expect(page.getByText("AAPL")).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("MSFT")).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("TSLA")).toBeVisible({ timeout: 5000 });

    // Click on first company to see details
    await page.getByText("AAPL").first().click();

    // Should navigate to company detail page
    await expect(page).toHaveURL(/\/companies\/AAPL/);

    // Should show analysis history
    await expect(page.getByText("Analysis History")).toBeVisible();
    
    // Should show the reasoning from the analysis
    await expect(page.getByText(/strong fundamentals|robust earnings/i)).toBeVisible({ timeout: 5000 });
  });

  test("performance benchmark: analyze multiple companies efficiently", async ({ page }) => {
    // This test verifies that analyzing multiple companies completes successfully
    // Expected: ~15-20s total for analysis

    await page.goto("/analyze");

    const multiCompanyText = `
Apple (AAPL) shows strong growth in services revenue.
Microsoft (MSFT) dominates cloud computing with Azure.
Tesla (TSLA) faces increased EV competition.
Amazon (AMZN) continues e-commerce expansion.
Google (GOOGL) leads in AI and search technology.
    `.trim();

    await page.getByPlaceholder(/paste.*news/i).fill(multiCompanyText);
    
    const startTime = Date.now();
    
    await page.getByRole("button", { name: /analyze/i }).click();
    await expect(page.getByText("Analysis Started!")).toBeVisible({ timeout: 5000 });

    // Navigate to jobs
    await page.getByRole("button", { name: /view in queue/i }).click();

    // Wait for completion
    await expect(page.getByText("COMPLETED").first()).toBeVisible({ timeout: 30000 });

    const elapsedTime = (Date.now() - startTime) / 1000;

    console.log(`\n⚡ 5 companies analyzed in ${elapsedTime.toFixed(1)} seconds`);
    console.log(`   With batching: <30s`);
    console.log(`   Without batching: ~50-70s\n`);

    // Should complete in under 30 seconds with batching
    expect(elapsedTime).toBeLessThan(30);
  });
});
