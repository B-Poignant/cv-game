import { CV } from "../../src/content/cv";
import { expect, test } from "./fixtures";

// F-032. In e2e, Vite serves the page at /cv/ (vite.config.ts); in production the game
// server serves the file `npm run cv:html` writes.
test.describe("Classic CV page", () => {
  test("the arrival panel leads to the classic CV, which leads back to the game", async ({
    page,
  }) => {
    await page.goto("/");
    const panel = page.getByRole("dialog", { name: "Who are you today?" });

    await panel.getByRole("link", { name: "read the classic CV" }).click();

    await expect(page).toHaveURL(/\/cv\/$/);
    await expect(
      page.getByRole("heading", { level: 1, name: CV.profile.name }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: CV.experiences[0].company }),
    ).toBeVisible();

    await page.getByRole("link", { name: "Jouer à Headhunted →" }).click();

    await expect(panel).toBeVisible();
  });

  test("fits a phone screen without sideways scrolling", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 });

    await page.goto("/cv/");

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
});
