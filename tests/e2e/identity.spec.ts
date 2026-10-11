import { expect, openGame, test } from "./fixtures";

// F-012
test.describe("Recruiter identity", () => {
  test("the arrival panel offers a random recruiter, ready to start", async ({
    page,
  }) => {
    await page.goto("/");
    const panel = page.getByRole("dialog", { name: "Who are you today?" });

    await expect(panel).toBeVisible();
    await expect(panel.getByLabel("Name")).toBeFocused();
    await expect(panel.getByLabel("Name")).not.toHaveValue("");
    await expect(panel.getByLabel("Company")).not.toHaveValue("");
  });

  test("other visitors see the name you chose", async ({ newVisitor }) => {
    const alice = await newVisitor();
    const bob = await newVisitor();

    const aliceConsole = await openGame(alice, {
      name: "Alex",
      company: "SynergyCorp",
    });
    await aliceConsole.waitForLog("[MULTIPLAYER] Connected");
    const bobConsole = await openGame(bob);

    await bobConsole.waitForLog("[REMOTE] Player added to Pixi: Alex");

    expect(aliceConsole.errors).toEqual([]);
    expect(bobConsole.errors).toEqual([]);
  });
});
