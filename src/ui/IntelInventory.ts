import { type IntelCardId, INTEL_NEEDED_TO_PITCH } from "../../shared/intel";
import type { IntelCardText } from "../content/intel";

/**
 * The intel cards a recruiter holds (F-031): an HTML box in the top-right corner (styled in
 * style.css), hidden until the room says which cards the visitor has. New cards are
 * announced through `announce` (the chat log, F-052).
 */
export class IntelInventory {
  public readonly element: HTMLElement;

  private readonly describe: (id: IntelCardId) => IntelCardText;
  private readonly announce: (text: string) => void;
  private readonly heading: HTMLHeadingElement;
  private readonly list: HTMLUListElement;
  private readonly empty: HTMLParagraphElement;

  private cards: IntelCardId[] = [];

  constructor(
    describe: (id: IntelCardId) => IntelCardText,
    announce: (text: string) => void,
    parent: HTMLElement = document.body,
  ) {
    this.describe = describe;
    this.announce = announce;

    this.element = document.createElement("aside");
    this.element.className = "intel-inventory";
    this.element.setAttribute("aria-labelledby", "intel-inventory-title");
    this.element.hidden = true;

    this.heading = document.createElement("h2");
    this.heading.id = "intel-inventory-title";
    this.heading.className = "intel-inventory__title";

    this.list = document.createElement("ul");
    this.list.className = "intel-inventory__cards";

    this.empty = document.createElement("p");
    this.empty.className = "intel-inventory__empty";
    this.empty.textContent = "Open buildings up close to collect intel.";

    this.element.append(this.heading, this.list, this.empty);
    parent.appendChild(this.element);
  }

  public get isShown(): boolean {
    return !this.element.hidden;
  }

  /** Shows `cards`, and announces the ones that weren't there before. */
  public update(cards: readonly IntelCardId[]): void {
    const isFirstUpdate = this.element.hidden;
    const added = cards.filter((card) => !this.cards.includes(card));

    this.cards = [...cards];
    this.element.hidden = false;
    this.render();

    if (!isFirstUpdate && added.length > 0) {
      const titles = added.map((card) => this.describe(card).title);
      this.announce(`New intel: ${titles.join(", ")}`);
    }
  }

  private render(): void {
    this.heading.textContent = `Intel ${this.cards.length}/${INTEL_NEEDED_TO_PITCH}`;
    this.empty.hidden = this.cards.length > 0;
    this.list.replaceChildren(
      ...this.cards.map((card) => this.renderCard(card)),
    );
  }

  private renderCard(card: IntelCardId): HTMLLIElement {
    const { title, text } = this.describe(card);
    const item = document.createElement("li");
    const titleElement = document.createElement("strong");
    const textElement = document.createElement("span");

    item.className = "intel-inventory__card";
    item.dataset.card = card;
    titleElement.textContent = title;
    textElement.textContent = text;
    item.append(titleElement, textElement);

    return item;
  }

  public destroy(): void {
    this.element.remove();
  }
}
