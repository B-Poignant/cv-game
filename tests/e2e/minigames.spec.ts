import {
  buildingButton,
  expect,
  openGame,
  test,
  walkToBuilding,
} from "./fixtures";

// F-070, F-071
test.describe("Minigames", () => {
  test("opening SKILLS up close plays the skill breakout; Escape quits to the CV", async ({
    page,
  }) => {
    const console = await openGame(page);
    const inventory = page.getByRole("complementary", { name: /^Intel/ });
    const panel = page.getByRole("dialog", { name: "Compétences" });

    await walkToBuilding(page, console, "SKILLS");
    await (await buildingButton(page, "SKILLS")).press("Enter");

    // The minigame is drawn on the canvas: the CV panel waits until it ends.
    await page.waitForTimeout(500);
    await expect(panel).toBeHidden();

    await page.keyboard.press("Escape");

    await expect(panel).toBeVisible();
    await expect(page.getByRole("log")).toContainText(
      "SKILLS PARK: SKILL BREAKOUT: not this time. The answers are in the CV.",
    );
    await expect(inventory).toHaveAccessibleName("Intel 0/3");
    expect(console.errors).toEqual([]);
  });
});
