import { expect, openGame, test } from "./fixtures";

// F-042, F-052. The e2e server keeps Ben still at (18, 18); recruiters spawn at (12, 12).
test.describe("Catching the dev", () => {
  test("Ben turns down a recruiter who has no intel", async ({ page }) => {
    const console = await openGame(page);
    await console.waitForLog("[MULTIPLAYER] Connected");
    const inventory = page.getByRole("complementary", { name: /^Intel/ });
    await expect(inventory).toHaveAccessibleName("Intel 0/3");

    // Straight down the diagonal to Ben: 6 tiles on each axis at ~2.1 tiles/s.
    await page.keyboard.down("ArrowRight");
    await page.keyboard.down("ArrowDown");
    await expect(page.getByRole("log")).toContainText(
      "Ben: Do you even know what I do?",
      { timeout: 8000 },
    );
    await page.keyboard.up("ArrowDown");
    await page.keyboard.up("ArrowRight");

    await expect(page.getByRole("dialog")).toBeHidden();
    expect(console.errors).toEqual([]);
  });
});
