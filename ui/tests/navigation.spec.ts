import { expect, test } from "@playwright/test";

test.describe("Product Hunt Top Navigation", () => {
  test("displays the primary navigation links", async ({ page }) => {
    await page.goto("/");

    const navigation = page.getByRole("navigation").first();

    for (const name of [
      "Best Products",
      "Launches",
      "News",
      "Forums",
      "Advertise",
    ]) {
      await expect(
        navigation.getByRole("link", { name, exact: true }),
      ).toBeVisible();
    }
  });

  test("shows trending categories when hovering over Best Products", async ({
    page,
  }) => {
    await page.goto("/");

    await page
      .getByRole("link", { name: "Best Products", exact: true })
      .hover();

      await expect(
        page.getByRole("link", {
          name: "Trending Categories",
          exact: true,
        }),
      ).toBeVisible();

    await expect(
      page.getByText("Productivity", { exact: true }).first(),
    ).toBeVisible();

    await expect(
      page.getByText("Engineering & Development", { exact: true }).first(),
    ).toBeVisible();
  });

  test("opens the Product Categories page from Best Products", async ({
    page,
  }) => {
    await page.goto("/");

    await page
      .getByRole("link", { name: "Best Products", exact: true })
      .click();

    await expect(page).toHaveURL(/\/categories(?:\?|$)/);

    await expect(
      page.getByRole("heading", {
        name: "Product Categories",
        exact: true,
      }),
    ).toBeVisible();
  });

});
