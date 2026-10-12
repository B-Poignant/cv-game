// @vitest-environment happy-dom
import { Container, Text, type Renderer } from "pixi.js";
import { describe, expect, it, vi } from "vitest";

import { THEMES } from "../../../src/config/themes";
import type {
  MinigameContext,
  MinigameDefinition,
  MinigameResult,
} from "../../../src/game/minigames/Minigame";
import { MinigameScene } from "../../../src/scenes/MinigameScene";

function fakeRenderer(width = 1280, height = 720) {
  return { width, height } as unknown as Renderer & {
    width: number;
    height: number;
  };
}

/** A minigame that does nothing but record what the scene does to it. */
function fakeMinigame(title = "TEST GAME") {
  const created: {
    context: MinigameContext;
    finish: (result: MinigameResult) => void;
    view: Container;
    update: ReturnType<typeof vi.fn>;
    resize: ReturnType<typeof vi.fn>;
    applyTheme: ReturnType<typeof vi.fn>;
    destroy: ReturnType<typeof vi.fn>;
  }[] = [];
  const definition: MinigameDefinition = {
    title,
    create(context, finish) {
      const game = {
        context,
        finish,
        view: new Container(),
        update: vi.fn(),
        resize: vi.fn(),
        applyTheme: vi.fn(),
        destroy: vi.fn(),
      };
      created.push(game);
      return game;
    },
  };

  return { definition, game: () => created[0] };
}

function pressEscape() {
  window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
}

// F-070
describe("MinigameScene", () => {
  it("is hidden until a minigame starts", () => {
    const scene = new MinigameScene(fakeRenderer());

    expect(scene.visible).toBe(false);
    expect(scene.isRunning).toBe(false);
  });

  it("shows the minigame under its title, on a board that fits the screen", () => {
    const scene = new MinigameScene(fakeRenderer(1280, 720));
    const { definition, game } = fakeMinigame("SKILLS PARK");

    void scene.play(definition);

    expect(scene.visible).toBe(true);
    expect(scene.isRunning).toBe(true);
    const title = scene.children.find((child) => child instanceof Text)!;
    expect(title.text).toBe("SKILLS PARK  ·  Esc to quit");
    expect(game().view.parent).not.toBeNull();
    expect(game().context.width).toBeGreaterThan(0);
    expect(game().context.width).toBeLessThanOrEqual(720);
    expect(game().context.height).toBeGreaterThan(0);
    expect(game().context.height).toBeLessThanOrEqual(540);
  });

  it("keeps the board inside a phone screen", () => {
    const scene = new MinigameScene(fakeRenderer(360, 640));
    const { definition, game } = fakeMinigame();

    void scene.play(definition);

    expect(game().context.width).toBeLessThanOrEqual(360);
    expect(game().context.height).toBeLessThanOrEqual(640);
  });

  it("gives the minigame the current theme", () => {
    const scene = new MinigameScene(fakeRenderer());
    scene.applyTheme(THEMES[1]);
    const { definition, game } = fakeMinigame();

    void scene.play(definition);

    expect(game().context.theme).toBe(THEMES[1]);
  });

  it("advances the minigame every frame", () => {
    const scene = new MinigameScene(fakeRenderer());
    const { definition, game } = fakeMinigame();
    void scene.play(definition);

    scene.update(0.016);

    expect(game().update).toHaveBeenCalledExactlyOnceWith(0.016);
  });

  it("resolves with the result, then removes, destroys and hides the minigame", async () => {
    const scene = new MinigameScene(fakeRenderer());
    const { definition, game } = fakeMinigame();
    const played = scene.play(definition);

    game().finish({ won: true });

    await expect(played).resolves.toEqual({ won: true });
    expect(game().view.parent).toBeNull();
    expect(game().destroy).toHaveBeenCalledOnce();
    expect(scene.visible).toBe(false);
    expect(scene.isRunning).toBe(false);
  });

  it("keeps the first result when the minigame reports its end twice", async () => {
    const scene = new MinigameScene(fakeRenderer());
    const { definition, game } = fakeMinigame();
    const played = scene.play(definition);

    game().finish({ won: true });
    game().finish({ won: false });

    await expect(played).resolves.toEqual({ won: true });
    expect(game().destroy).toHaveBeenCalledOnce();
  });

  it("counts Escape as a loss", async () => {
    const scene = new MinigameScene(fakeRenderer());
    const { definition } = fakeMinigame();
    const played = scene.play(definition);

    pressEscape();

    await expect(played).resolves.toEqual({ won: false });
  });

  it("stops listening to Escape once the minigame is over", async () => {
    const scene = new MinigameScene(fakeRenderer());
    const first = fakeMinigame();
    const second = fakeMinigame();
    const played = scene.play(first.definition);
    first.game().finish({ won: true });
    await played;

    pressEscape();
    void scene.play(second.definition);

    expect(scene.isRunning).toBe(true);
  });

  it("refuses to start a second minigame while one is running", async () => {
    const scene = new MinigameScene(fakeRenderer());
    void scene.play(fakeMinigame().definition);

    await expect(scene.play(fakeMinigame().definition)).rejects.toThrow(
      "A minigame is already running",
    );
  });

  it("passes the new play area size on when the window is resized", () => {
    const renderer = fakeRenderer(1280, 720);
    const scene = new MinigameScene(renderer);
    const { definition, game } = fakeMinigame();
    void scene.play(definition);

    renderer.width = 400;
    window.dispatchEvent(new Event("resize"));

    const [width] = game().resize.mock.calls[0] as [number, number];
    expect(width).toBeLessThanOrEqual(400);
  });

  it("recolours the title and passes a theme change on to the minigame", () => {
    const scene = new MinigameScene(fakeRenderer());
    const { definition, game } = fakeMinigame();
    void scene.play(definition);

    scene.applyTheme(THEMES[2]);

    const title = scene.children.find((child) => child instanceof Text)!;
    expect(title.style.fill).toBe(THEMES[2].label);
    expect(game().applyTheme).toHaveBeenCalledExactlyOnceWith(THEMES[2]);
  });

  it("destroys a running minigame and stops listening when destroyed", () => {
    const scene = new MinigameScene(fakeRenderer());
    const { definition, game } = fakeMinigame();
    void scene.play(definition);

    scene.destroy();
    pressEscape();

    expect(game().destroy).toHaveBeenCalledOnce();
  });
});
