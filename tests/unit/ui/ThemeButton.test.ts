// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from "vitest";

import { THEMES } from "../../../src/config/themes";
import { ThemeCycle } from "../../../src/game/ThemeCycle";
import { ThemeButton } from "../../../src/ui/ThemeButton";

describe("ThemeButton", () => {
  let parent: HTMLElement;
  let themes: ThemeCycle;

  beforeEach(() => {
    parent = document.createElement("div");
    themes = new ThemeCycle(THEMES);
  });

  it("adds an accessible button showing the current theme", () => {
    new ThemeButton(themes, parent);

    const button = parent.querySelector("button");
    expect(button?.type).toBe("button");
    expect(button?.className).toBe("theme-button");
    expect(button?.textContent).toBe("🎨 Classic");
    expect(button?.getAttribute("aria-label")).toBe(
      "Change theme (current: Classic)",
    );
  });

  it("switches to the next theme on click", () => {
    const { element } = new ThemeButton(themes, parent);

    element.click();

    expect(themes.current.name).toBe("Simpsons");
    expect(element.textContent).toBe("🎨 Simpsons");
  });

  it("cycles through every theme back to the first", () => {
    const { element } = new ThemeButton(themes, parent);

    const labels = THEMES.map(() => {
      element.click();
      return element.textContent;
    });

    expect(labels).toEqual(["🎨 Simpsons", "🎨 South Park", "🎨 Classic"]);
  });

  it("gives focus back to the game after a click", () => {
    const { element } = new ThemeButton(themes, parent);
    document.body.appendChild(parent);
    element.focus();

    element.click();

    expect(document.activeElement).not.toBe(element);
    parent.remove();
  });

  it("follows theme changes made elsewhere", () => {
    const { element } = new ThemeButton(themes, parent);

    themes.next();

    expect(element.textContent).toBe("🎨 Simpsons");
  });

  it("removes itself and stops listening on destroy", () => {
    const button = new ThemeButton(themes, parent);

    button.destroy();
    themes.next();

    expect(parent.querySelector("button")).toBeNull();
    expect(button.element.textContent).toBe("🎨 Classic");
  });
});
