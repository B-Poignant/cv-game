import { ACHIEVEMENTS } from "../config/achievements";
import type { AchievementTracker } from "../game/AchievementTracker";

/**
 * The achievements list (F-041): a "🏆 n/5" button under the theme button that shows or
 * hides every achievement, unlocked (✓) or not yet (🔒). Styled in style.css.
 */
export class AchievementsPanel {
  public readonly element: HTMLElement;

  private readonly button: HTMLButtonElement;
  private readonly list: HTMLUListElement;
  private readonly tracker: AchievementTracker;
  private readonly unsubscribe: () => void;

  constructor(
    tracker: AchievementTracker,
    parent: HTMLElement = document.body,
  ) {
    this.tracker = tracker;

    this.element = document.createElement("div");
    this.element.className = "achievements";

    this.list = document.createElement("ul");
    this.list.id = "achievements-list";
    this.list.className = "achievements__list";
    this.list.hidden = true;

    this.button = document.createElement("button");
    this.button.type = "button";
    this.button.className = "achievements__button";
    this.button.setAttribute("aria-controls", this.list.id);
    this.button.setAttribute("aria-expanded", "false");
    this.button.addEventListener("click", () => {
      this.toggle();
      // Give focus back to the game so the arrow keys move the player again.
      this.button.blur();
    });

    this.element.append(this.button, this.list);
    parent.appendChild(this.element);

    this.unsubscribe = tracker.onUnlock(() => {
      this.render();
    });
    this.render();
  }

  public get isOpen(): boolean {
    return !this.list.hidden;
  }

  public toggle(): void {
    this.list.hidden = !this.list.hidden;
    this.button.setAttribute("aria-expanded", String(this.isOpen));
  }

  public destroy(): void {
    this.unsubscribe();
    this.element.remove();
  }

  private render(): void {
    const count = this.tracker.unlocked.length;
    const total = ACHIEVEMENTS.length;

    this.button.textContent = `🏆 ${String(count)}/${String(total)}`;
    this.button.setAttribute(
      "aria-label",
      `Achievements: ${String(count)} of ${String(total)}`,
    );
    this.list.replaceChildren(
      ...ACHIEVEMENTS.map((achievement) => {
        const isUnlocked = this.tracker.isUnlocked(achievement.id);
        const item = document.createElement("li");
        const title = document.createElement("strong");
        const description = document.createElement("span");

        item.className = "achievements__item";
        item.dataset.unlocked = String(isUnlocked);
        title.textContent = `${isUnlocked ? "✓" : "🔒"} ${achievement.title}`;
        description.textContent = achievement.description;
        item.append(title, description);

        return item;
      }),
    );
  }
}
