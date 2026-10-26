import { expect, test } from "@playwright/test";

test.describe("Product Hunt Homepage", () => {
  test("loads the homepage successfully", async ({ page }) => {
    const response = await page.goto("/");

    expect(response).not.toBeNull();
    if (response) {
      expect(response.status()).toBeLessThan(400);
    }

    await expect(page).toHaveTitle(/product hunt/i);
    await expect(page.locator("main")).toBeVisible();
  });

  test("displays at least one visible product link", async ({ page }) => {
    await page.goto("/");

    const productLinks = page.locator(
      '[data-test="homepage-section-today"] a[href^="/products/"]',
    );

    await expect(productLinks.first()).toBeVisible();
    await expect(productLinks.first()).toHaveAttribute(
      "href",
      /^\/products\/.+/,
    );
  });

  test("displays the four top-product sections", async ({ page }) => {
    await page.goto("/");

    const sectionHeadings = [
      "Top Products Launching Today",
      "Yesterday's Top Products",
      "Last Week's Top Products",
      "Last Month's Top Products",
    ];

    for (const heading of sectionHeadings) {
      await expect(
        page.getByRole("heading", { name: heading, exact: true }),
      ).toBeVisible();
    }
  });

  
  test("displays the key footer navigation links", async ({ page }) => {
    await page.goto("/");

    const footer = page.locator("footer");
    await expect(footer).toBeVisible();

    for (const name of [
      "Newsletter",
      "Apps",
      "About",
      "FAQ",
      "Terms",
      "Privacy & Cookies",
    ]) {
      await expect(
        footer.getByRole("link", { name, exact: true }),
      ).toBeVisible();
    }
  });

});
