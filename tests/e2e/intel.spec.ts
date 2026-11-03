import { CV } from "../../src/content/cv";
import {
  buildingButton,
  expect,
  openGame,
  test,
  walkToBuilding,
} from "./fixtures";

/** The CV's jobs from the oldest to the newest, as the timeline's cards name them (F-072). */
const JOBS_OLDEST_FIRST = [...CV.experiences]
  .sort((a, b) => a.startDate.localeCompare(b.startDate))
  .map((experience) => `${experience.company} — ${experience.role}`);

// F-031, F-052, F-072
test.describe("Intel cards", () => {
  test("winning a building's minigame up close earns its card", async ({
    page,
  }) => {
    const console = await openGame(page);
    await console.waitForLog("[MULTIPLAYER] Connected");
    const inventory = page.getByRole("complementary", { name: /^Intel/ });
    await expect(inventory).toHaveAccessibleName("Intel 0/3");

    await walkToBuilding(page, console, "EXPERIENCE");
    await (await buildingButton(page, "EXPERIENCE")).press("Enter");

    // The career timeline: its cards are buttons in the accessibility layer. Pick the ones
    // shown, from the oldest job to the newest.
    const cardFor = (job: string) =>
      page.getByRole("button", { name: job, exact: true });
    const shownJobs = async () => {
      const counts = await Promise.all(
        JOBS_OLDEST_FIRST.map((job) => cardFor(job).count()),
      );
      return JOBS_OLDEST_FIRST.filter((_job, index) => counts[index] > 0);
    };
    await expect.poll(async () => (await shownJobs()).length).toBe(5);
    for (const job of await shownJobs()) {
      await cardFor(job).press("Enter");
    }

    await expect(page.getByRole("log")).toContainText(
      "EXPERIENCE AVENUE: CAREER TIMELINE: you won!",
    );
    await expect(inventory).toHaveAccessibleName("Intel 1/3");
    await expect(inventory).toContainText("Séniorité");
    // The dev total grows each month; the lead roles are over.
    await expect(inventory).toContainText(/Dev : .+ \+ Lead : 4 ans 10 mois/);
    await expect(page.getByRole("log")).toContainText("New intel: Séniorité");
    expect(console.errors).toEqual([]);
  });

  test("a building stays shut from afar: no minigame, no CV, no card", async ({
    page,
  }) => {
    const console = await openGame(page);
    await console.waitForLog("[MULTIPLAYER] Connected");
    const inventory = page.getByRole("complementary", { name: /^Intel/ });

    await (await buildingButton(page, "SKILLS")).press("Enter");

    await expect(page.getByRole("log")).toContainText(
      "Get closer to enter SKILLS.",
    );
    await expect(page.getByRole("dialog")).toBeHidden();
    await expect(inventory).toHaveAccessibleName("Intel 0/3");
  });

  // F-040: the chest hides in a bush at (21, 21), down and right of the spawn (12, 12).
  test("the hidden chest shows up close, and Enter opens it for the secret card", async ({
    page,
  }) => {
    const console = await openGame(page);
    await console.waitForLog("[MULTIPLAYER] Connected");
    const inventory = page.getByRole("complementary", { name: /^Intel/ });
    // Tab turns Pixi's keyboard layer on; the chest isn't in it from the spawn.
    await buildingButton(page, "SKILLS");
    const chest = page.getByRole("button", { name: "Open the chest" });
    await expect(chest).toHaveCount(0);

    // The diagonal ends against the chest, which blocks the way, so it passes within reach.
    await page.keyboard.down("ArrowDown");
    await page.keyboard.down("ArrowRight");
    try {
      await expect(chest).toBeAttached({ timeout: 10_000 });
    } finally {
      await page.keyboard.up("ArrowRight");
      await page.keyboard.up("ArrowDown");
    }
    await chest.press("Enter");

    await expect(inventory).toHaveAccessibleName("Intel 1/3");
    await expect(inventory).toContainText("Critère éliminatoire");
    expect(console.errors).toEqual([]);
  });
});
