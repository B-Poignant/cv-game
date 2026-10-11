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
