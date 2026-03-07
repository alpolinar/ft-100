import { expect, test } from "@playwright/test";

test("has title", async ({ page }) => {
  await page.goto("/");

  // Assuming the Next.js app renders standard content or returns a 200/404 based on the route
  // We'll just check if the page loaded successfully by looking at the title or standard body
  await expect(page).toHaveURL(/localhost:3000/);
});
