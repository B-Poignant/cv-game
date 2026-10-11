import { buildingButton, expect, openGame, test } from "./fixtures";

// F-030
test.describe("CV panels", () => {
  test("no panel is shown when the game loads", async ({ page }) => {
    await openGame(page);

    await expect(page.getByRole("dialog")).toBeHidden();
  });

  test("Tab works again after the mouse turned keyboard access off", async ({
    page,
  }) => {
    await openGame(page);
    await page.mouse.move(100, 100);
    await page.mouse.move(200, 200);

    await (await buildingButton(page, "SKILLS")).press("Enter");

    await expect(
      page.getByRole("dialog", { name: "Compétences" }),
    ).toBeVisible();
  });

  test("Enter on a building opens its section, Escape closes it", async ({
    page,
  }) => {
    const console = await openGame(page);

    await (await buildingButton(page, "EXPERIENCE")).press("Enter");

    const panel = page.getByRole("dialog", { name: "Expérience" });
    await expect(panel).toBeVisible();
    await expect(panel).toContainText("BoondManager");
    await expect(panel).toContainText("juil. 2023 – aujourd'hui");

    await page.keyboard.press("Escape");

    await expect(panel).toBeHidden();
    expect(console.errors).toEqual([]);
  });

  // F-005
  test("the Education Campus building shows the education and languages", async ({
    page,
  }) => {
    await openGame(page);

    await (await buildingButton(page, "EDUCATION")).press("Enter");

    const panel = page.getByRole("dialog", { name: "Formation et langues" });
    await expect(panel).toBeVisible();
    await expect(panel).toContainText("BTS, Informatique");
    await expect(panel).toContainText("Anglais");
  });

  test("clicking a building with the mouse opens its section", async ({
    page,
  }) => {
    await openGame(page);
    const box = await (await buildingButton(page, "SKILLS")).boundingBox();
    expect(box).not.toBeNull();

    await page.mouse.click(box!.x + box!.width / 2, box!.y + box!.height / 2);

    const panel = page.getByRole("dialog", { name: "Compétences" });
    await expect(panel).toBeVisible();
    await expect(panel).toContainText("Symfony");
    await expect(
      panel.getByRole("img", { name: "niveau 5 sur 5" }).first(),
    ).toBeVisible();
  });

  test("the ✕ button closes the panel", async ({ page }) => {
    await openGame(page);
    await (await buildingButton(page, "SKILLS")).press("Enter");
    const panel = page.getByRole("dialog", { name: "Compétences" });
    await expect(panel).toBeVisible();

    await panel.getByRole("button", { name: "Close" }).click();

    await expect(panel).toBeHidden();
  });

  for (const [title, name] of [
    ["EXPERIENCE", "Expérience"],
    ["SKILLS", "Compétences"],
    ["EDUCATION", "Formation et langues"],
  ]) {
    test(`the ${name} panel fits inside the window`, async ({ page }) => {
      await page.setViewportSize({ width: 1000, height: 700 });
      await openGame(page);
      await (await buildingButton(page, title)).press("Enter");

      const box = await page.getByRole("dialog", { name }).boundingBox();

      expect(box!.y).toBeGreaterThanOrEqual(0);
      expect(box!.y + box!.height).toBeLessThanOrEqual(700);
      await expect(
        page.getByRole("heading", { name, level: 1 }),
      ).toBeInViewport();
    });
  }

  test("long content scrolls inside the panel, not the page", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 800, height: 500 });
    await openGame(page);
    await (await buildingButton(page, "EXPERIENCE")).press("Enter");
    await expect(page.getByRole("dialog")).toBeVisible();

    const scroll = await page.evaluate(() => {
      const content = document.querySelector(".cv-panel__content")!;
      return {
        scrollable: content.scrollHeight > content.clientHeight,
        pageScrolls: document.documentElement.scrollHeight > window.innerHeight,
      };
    });

    expect(scroll).toEqual({ scrollable: true, pageScrolls: false });
  });
});
