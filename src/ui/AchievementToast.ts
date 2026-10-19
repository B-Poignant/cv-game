import type { Achievement } from "../config/achievements";

/** How long a toast stays up, in milliseconds. */
export const TOAST_MS = 4000;

/**
 * Announces a new achievement (F-041): a short note at the top of the screen, read out by
 * screen readers (`role="status"`). A new one replaces the last. Styled in style.css.
 */
export class AchievementToast {
  public readonly element: HTMLElement;

  private hideTimer?: ReturnType<typeof setTimeout>;

  constructor(parent: HTMLElement = document.body) {
    this.element = document.createElement("div");
    this.element.className = "achievement-toast";
    this.element.setAttribute("role", "status");
    this.element.hidden = true;
    parent.appendChild(this.element);
  }

  public get text(): string | undefined {
    return this.element.hidden ? undefined : this.element.textContent;
  }

  public show(achievement: Achievement): void {
    clearTimeout(this.hideTimer);
    this.element.textContent = `🏆 Achievement unlocked: ${achievement.title}`;
    this.element.hidden = false;
    this.hideTimer = setTimeout(() => {
      this.element.hidden = true;
    }, TOAST_MS);
  }

  public destroy(): void {
    clearTimeout(this.hideTimer);
    this.element.remove();
  }
}
