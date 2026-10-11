import { expect, openGame, test } from "./fixtures";

// F-050
test.describe("Theme switcher", () => {
  test("is a button in the top-left corner showing the default theme", async ({
    page,
  }) => {
    await openGame(page);

    const button = page.getByRole("button", { name: /change theme/i });
    await expect(button).toHaveText("🎨 Classic");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "classic");

    const box = await button.boundingBox();
    expect(box?.x).toBeLessThan(50);
    expect(box?.y).toBeLessThan(50);
  });

  test("cycles Simpsons → South Park → Classic on click", async ({ page }) => {
    const console = await openGame(page);
    const button = page.getByRole("button", { name: /change theme/i });
    const html = page.locator("html");

    for (const [name, id] of [
      ["Simpsons", "simpsons"],
      ["South Park", "south-park"],
      ["Classic", "classic"],
    ]) {
      await button.click();

      await expect(button).toHaveText(`🎨 ${name}`);
      await expect(html).toHaveAttribute("data-theme", id);
    }

    expect(console.errors).toEqual([]);
  });

  test("does not keep keyboard focus after a click", async ({ page }) => {
    await openGame(page);
    const button = page.getByRole("button", { name: /change theme/i });

    await button.click();

    await expect(button).not.toBeFocused();
  });
});
