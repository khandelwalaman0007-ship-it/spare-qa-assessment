import { expect, test } from "@playwright/test";

test.describe("Product Hunt Search", () => {
  
  test("displays product results for a valid search", async ({ page }) => {
    await page.goto("/");

    const searchLauncher = page.getByPlaceholder("Search ( ctrl + k )");
    await expect(searchLauncher).toBeVisible();
    await searchLauncher.click();

    const searchModal = page.locator('[data-test="modal"]');
    await expect(searchModal).toBeVisible();

    const searchInput = page.locator(
      '[data-test="spotlight-search-input"]',
    );
    await expect(searchInput).toBeVisible();

    await searchInput.fill("1Password");

    await expect(
      page.getByRole("link", { name: /1Password/i }).first(),
    ).toBeVisible();
  });


  test("shows an empty state when no products match the search", async ({ page }) => {
    await page.goto("/");
  
    const searchLauncher = page.getByPlaceholder("Search ( ctrl + k )");
    await expect(searchLauncher).toBeVisible();
    await searchLauncher.click();
  
    const searchModal = page.locator('[data-test="modal"]');
    await expect(searchModal).toBeVisible();
  
    const searchInput = page.locator(
      '[data-test="spotlight-search-input"]',
    );
    await expect(searchInput).toBeVisible();
  
    const query = "qwertyuiop1234568";
    await searchInput.fill(query);
  
    await expect(
      searchModal.getByText(`No results found for "${query}"`, {
        exact: true,
      }),
    ).toBeVisible();
  });  
});