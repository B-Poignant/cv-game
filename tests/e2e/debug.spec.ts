import { expect, openGame, test } from "./fixtures";

// F-051
test.describe("Debug mode", () => {
  test("the 🐞 button shows a live readout of the player and the network, then hides it", async ({
    page,
  }) => {
    const console = await openGame(page);
    const button = page.getByRole("button", { name: "🐞 Debug" });
    const readout = page.locator("#debug-readout");

    await expect(button).toHaveAttribute("aria-pressed", "false");
    await expect(readout).toBeHidden();

    await button.click();

    await expect(button).toHaveAttribute("aria-pressed", "true");
    await expect(readout).toBeVisible();
    await expect(readout).toContainText("Network  online");
    await expect(readout).toContainText(/Server {3}\(\d+\.\d\d, \d+\.\d\d\)/);
    // The button gave focus back: the arrow keys still walk, and the readout follows.
    await expect(button).not.toBeFocused();
    const before = await readout.textContent();
    await page.keyboard.down("ArrowDown");
    await expect(readout).toContainText("↓ down");
    await page.keyboard.up("ArrowDown");
    await expect(readout).not.toHaveText(before ?? "");

    await button.click();

    await expect(readout).toBeHidden();
    expect(console.errors).toEqual([]);
  });
});
