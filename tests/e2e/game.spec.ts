import { expect, openGame, test } from "./fixtures";

test.describe("Visitor journey", () => {
  test("loads the game without errors", async ({ page }) => {
    const console = await openGame(page);

    await console.waitForLog("[MULTIPLAYER] Connected");

    const canvas = page.locator("canvas");
    const box = await canvas.boundingBox();
    expect(box?.width).toBeGreaterThan(0);
    expect(box?.height).toBeGreaterThan(0);
    expect(console.errors).toEqual([]);
  });

  test("fills the window edge to edge, without scrollbars", async ({
    page,
  }) => {
    await openGame(page);

    const box = await page.locator("canvas").boundingBox();
    const viewport = page.viewportSize();
    expect(box).toMatchObject({
      x: 0,
      y: 0,
      width: viewport?.width,
      height: viewport?.height,
    });

    const scrolls = await page.evaluate(() => ({
      horizontal: document.documentElement.scrollWidth > window.innerWidth,
      vertical: document.documentElement.scrollHeight > window.innerHeight,
    }));
    expect(scrolls).toEqual({ horizontal: false, vertical: false });
  });

  test("fills the window when it is resized", async ({ page }) => {
    await openGame(page);

    await page.setViewportSize({ width: 800, height: 600 });

    await expect
      .poll(async () => (await page.locator("canvas").boundingBox())?.width)
      .toBe(800);
  });
});

test.describe("Multiplayer", () => {
  // F-060
  test("shows the dev, Ben, on the map", async ({ page }) => {
    const console = await openGame(page);

    await console.waitForLog("[DEV] Shown: Ben");
    expect(console.errors).toEqual([]);
  });

  test("two visitors see each other move", async ({ newVisitor }) => {
    const alice = await newVisitor();
    const bob = await newVisitor();

    const aliceConsole = await openGame(alice);
    await aliceConsole.waitForLog("[MULTIPLAYER] Connected");

    const bobConsole = await openGame(bob);
    await bobConsole.waitForLog("[MULTIPLAYER] Connected");

    await aliceConsole.waitForLog("[REMOTE] Player added to Pixi");
    // Alice stands still, so her canvas only changes if Bob's character moves.
    const aliceCanvas = alice.locator("canvas");
    const before = await aliceCanvas.screenshot();

    // Bob walks right for a moment; Alice should see him move.
    await bob.keyboard.down("ArrowRight");
    await bob.waitForTimeout(300);
    await bob.keyboard.up("ArrowRight");

    await expect
      .poll(async () => (await aliceCanvas.screenshot()).equals(before))
      .toBe(false);

    expect(aliceConsole.errors).toEqual([]);
    expect(bobConsole.errors).toEqual([]);
  });
});
