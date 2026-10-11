import type { Theme } from "../config/themes";
import type { ThemeCycle } from "../game/ThemeCycle";

/** HTML button (top-left, styled in style.css) that switches to the next theme. */
export class ThemeButton {
  public readonly element: HTMLButtonElement;

  private readonly unsubscribe: () => void;

  constructor(themes: ThemeCycle, parent: HTMLElement = document.body) {
    this.element = document.createElement("button");
    this.element.type = "button";
    this.element.className = "theme-button";

    this.element.addEventListener("click", () => {
      themes.next();
      // Give focus back to the game so Enter/Space don't re-trigger the button.
      this.element.blur();
    });

    this.unsubscribe = themes.onChange((theme) => this.render(theme));
    this.render(themes.current);

    parent.appendChild(this.element);
  }

  private render(theme: Theme): void {
    this.element.textContent = `🎨 ${theme.name}`;
    this.element.setAttribute(
      "aria-label",
      `Change theme (current: ${theme.name})`,
    );
  }

  public destroy(): void {
    this.unsubscribe();
    this.element.remove();
  }
}
