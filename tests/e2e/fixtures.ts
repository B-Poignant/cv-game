import {
  test as base,
  expect,
  type BrowserContext,
  type Page,
} from "@playwright/test";

/**
 * Collects everything the page writes to the console, plus uncaught errors.
 * The game renders to a canvas, so console output is our window into its state.
 */
export class ConsoleRecorder {
  readonly logs: string[] = [];
  readonly errors: string[] = [];

  constructor(page: Page) {
    page.on("console", (message) => {
      const text = message.text();
      this.logs.push(text);
      if (message.type() === "error") {
        this.errors.push(text);
      }
    });
    page.on("pageerror", (error) => this.errors.push(error.message));
  }

  /** Waits until a console line containing `fragment` has been logged. */
  async waitForLog(fragment: string): Promise<void> {
    await expect
      .poll(() => this.logs.some((line) => line.includes(fragment)), {
        message: `console log containing "${fragment}"`,
      })
      .toBe(true);
  }
}

export interface Identity {
  name: string;
  company: string;
}

/**
 * Opens the game, waits for the canvas and goes past the arrival panel (F-012): with the
 * given identity, or the random one it was prefilled with.
 */
export async function openGame(
  page: Page,
  identity?: Identity,
): Promise<ConsoleRecorder> {
  const recorder = new ConsoleRecorder(page);
  await page.goto("/");
  await expect(page.locator("canvas")).toBeVisible();

  const panel = page.getByRole("dialog", { name: "Who are you today?" });
  await expect(panel).toBeVisible();
  if (identity) {
    await panel.getByLabel("Name").fill(identity.name);
    await panel.getByLabel("Company").fill(identity.company);
  }
  await panel.getByRole("button", { name: "Start" }).click();
  await expect(panel).toBeHidden();

  return recorder;
}

/**
 * Buildings live in the canvas. Pressing Tab turns on Pixi's accessibility layer,
 * which puts a real <button> over each building, named "Open <TITLE>".
 * Press Enter on it to open the building, or use its bounding box to click the canvas.
 */
export async function buildingButton(page: Page, title: string) {
  await page.keyboard.press("Tab");
  const button = page.getByRole("button", { name: `Open ${title}` });
  await expect(button).toBeAttached();
  return button;
}

type ArrowKey = "ArrowUp" | "ArrowDown" | "ArrowLeft" | "ArrowRight";

/**
 * From the spawn (12, 12), a diagonal held for `diagonalMs`, then the first key alone for
 * `straightMs` (diagonals run at ~2.1 tiles/s per axis, straight lines at 3). Each route ends
 * within 2 tiles of its building, close enough to open it.
 */
const ROUTES: Record<
  string,
  { keys: [ArrowKey, ArrowKey]; diagonalMs: number; straightMs: number }
> = {
  // To about (8, 7); SKILLS covers columns 5–7, rows 5–6.
  SKILLS: { keys: ["ArrowUp", "ArrowLeft"], diagonalMs: 1900, straightMs: 400 },
  // To about (15, 7); EXPERIENCE covers columns 16–18, rows 5–6.
  EXPERIENCE: {
    keys: ["ArrowUp", "ArrowRight"],
    diagonalMs: 1400,
    straightMs: 700,
  },
  // To about (8, 17); EDUCATION covers columns 5–7, rows 17–18.
  EDUCATION: {
    keys: ["ArrowDown", "ArrowLeft"],
    diagonalMs: 1900,
    straightMs: 400,
  },
};

/**
 * Walks from the spawn to within reach of a building (they only open from up close). Waits
 * for the server first, so it doesn't send the visitor back to the spawn.
 */
export async function walkToBuilding(
  page: Page,
  console: ConsoleRecorder,
  title: string,
): Promise<void> {
  const { keys, diagonalMs, straightMs } = ROUTES[title];
  await console.waitForLog("[MULTIPLAYER] Connected");

  await page.keyboard.down(keys[0]);
  await page.keyboard.down(keys[1]);
  await page.waitForTimeout(diagonalMs);
  await page.keyboard.up(keys[1]);
  await page.waitForTimeout(straightMs);
  await page.keyboard.up(keys[0]);
}

/**
 * Opens a building's CV panel the shortest way: walk up to it, open it, and quit its
 * minigame with Escape (the panel opens win or lose, F-070).
 */
export async function openSection(
  page: Page,
  console: ConsoleRecorder,
  title: string,
): Promise<void> {
  await walkToBuilding(page, console, title);
  await (await buildingButton(page, title)).press("Enter");
  // The minigame is drawn on the canvas: give it a moment to start.
  await page.waitForTimeout(300);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeVisible();
}

/**
 * `newVisitor()` opens a page in its own browser context, i.e. a separate visitor. Every
 * context is closed after the test, even a failed one, so no visitor stays in the shared room.
 */
export const test = base.extend<{ newVisitor: () => Promise<Page> }>({
  newVisitor: async ({ browser }, use) => {
    const contexts: BrowserContext[] = [];

    await use(async () => {
      const context = await browser.newContext();
      contexts.push(context);

      return context.newPage();
    });

    await Promise.all(contexts.map((context) => context.close()));
  },
});
export { expect };
