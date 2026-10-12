import { buildingButton, expect, openGame, test } from "./fixtures";

// F-070, F-071. Recruiters spawn at (12, 12); SKILLS covers columns 5–7, rows 5–6.
test.describe("Minigames", () => {
  test("opening SKILLS up close plays the buzzword catcher; Escape quits to the CV", async ({
    page,
  }) => {
    const console = await openGame(page);
    await console.waitForLog("[MULTIPLAYER] Connected");
    const inventory = page.getByRole("complementary", { name: /^Intel/ });
    const panel = page.getByRole("dialog", { name: "Compétences" });

    // Up and left to about (8, 7), within 2 tiles of SKILLS (diagonals run at ~2.1 tiles/s
    // per axis, straight lines at 3).
    await page.keyboard.down("ArrowUp");
    await page.keyboard.down("ArrowLeft");
    await page.waitForTimeout(1900);
    await page.keyboard.up("ArrowLeft");
    await page.waitForTimeout(400);
    await page.keyboard.up("ArrowUp");
    await (await buildingButton(page, "SKILLS")).press("Enter");

    // The minigame is drawn on the canvas: the CV panel waits until it ends.
    await page.waitForTimeout(500);
    await expect(panel).toBeHidden();

    await page.keyboard.press("Escape");

    await expect(panel).toBeVisible();
    await expect(page.getByRole("log")).toContainText(
      "SKILLS PARK: BUZZWORD CATCHER: not this time. The answers are in the CV.",
    );
    await expect(inventory).toHaveAccessibleName("Intel 0/3");
    expect(console.errors).toEqual([]);
  });
});
