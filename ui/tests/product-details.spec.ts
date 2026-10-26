import { expect, test } from "@playwright/test";

test.describe("Product Hunt Product Details", () => {
  test("opens a product detail page from the homepage", async ({ page }) => {
    await page.goto("/");

    const productLink = page
      .locator(
        '[data-test="homepage-section-today"] a[href^="/products/"]',
      )
      .first();

    await expect(productLink).toBeVisible();

    const productHref = await productLink.getAttribute("href");
    expect(productHref).toBeTruthy();

    await productLink.click();

    await expect(page).toHaveURL(/\/products\/[^/?#]+/);
    await expect(page.locator("main")).toBeVisible();
    await expect(page.locator("h1").first()).toBeVisible();
  });
});