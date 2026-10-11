import { buildingButton, expect, openGame, test } from "./fixtures";

// F-031, F-052. Recruiters spawn at (12, 12); EXPERIENCE covers columns 16–18, rows 5–6.
test.describe("Intel cards", () => {
  test("opening a building up close earns its card", async ({ page }) => {
    const console = await openGame(page);
    await console.waitForLog("[MULTIPLAYER] Connected");
    const inventory = page.getByRole("complementary", { name: /^Intel/ });
    await expect(inventory).toHaveAccessibleName("Intel 0/3");

    // Up and right to about (15, 7), within 2 tiles of EXPERIENCE (diagonals run at
    // ~2.1 tiles/s per axis, straight lines at 3).
    await page.keyboard.down("ArrowUp");
    await page.keyboard.down("ArrowRight");
    await page.waitForTimeout(1400);
    await page.keyboard.up("ArrowRight");
    await page.waitForTimeout(700);
    await page.keyboard.up("ArrowUp");
    await (await buildingButton(page, "EXPERIENCE")).press("Enter");

    await expect(inventory).toHaveAccessibleName("Intel 1/3");
    await expect(inventory).toContainText("Séniorité");
    // The dev total grows each month; the lead roles are over.
    await expect(inventory).toContainText(/Dev : .+ \+ Lead : 4 ans 10 mois/);
    await expect(page.getByRole("log")).toContainText("New intel: Séniorité");
    expect(console.errors).toEqual([]);
  });

  test("opening a building from afar shows the CV but no card", async ({
    page,
  }) => {
    const console = await openGame(page);
    await console.waitForLog("[MULTIPLAYER] Connected");
    const inventory = page.getByRole("complementary", { name: /^Intel/ });

    await (await buildingButton(page, "SKILLS")).press("Enter");

    await expect(
      page.getByRole("dialog", { name: "Compétences" }),
    ).toBeVisible();
    await expect(page.getByRole("log")).toContainText(
      "Get closer to collect its intel.",
    );
    await expect(inventory).toHaveAccessibleName("Intel 0/3");
  });
});
