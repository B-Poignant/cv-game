import type { Cv, CvSectionId } from "../domain/Cv";
import { renderSection } from "./cvSections";

export type OpenChangeListener = (open: boolean) => void;

/**
 * HTML dialog over the canvas showing one CV section (F-030).
 * Closes with the ✕ button, Escape, or a click on the backdrop. Styled in style.css.
 */
export class CvPanel {
  /** The dimmed backdrop; the dialog is its child. */
  public readonly element: HTMLDivElement;

  private readonly dialog: HTMLDivElement;
  private readonly title: HTMLHeadingElement;
  private readonly content: HTMLDivElement;
  private readonly cv: Cv;
  private readonly listeners = new Set<OpenChangeListener>();
  private section: CvSectionId | undefined;

  constructor(cv: Cv, parent: HTMLElement = document.body) {
    this.cv = cv;

    this.element = document.createElement("div");
    this.element.className = "cv-backdrop";
    this.element.hidden = true;

    this.dialog = document.createElement("div");
    this.dialog.className = "cv-panel";
    this.dialog.setAttribute("role", "dialog");
    this.dialog.setAttribute("aria-modal", "true");
    this.dialog.setAttribute("aria-labelledby", "cv-panel-title");
    this.dialog.tabIndex = -1;

    this.title = document.createElement("h1");
    this.title.id = "cv-panel-title";
    this.title.className = "cv-panel__title";

    const close = document.createElement("button");
    close.type = "button";
    close.className = "cv-panel__close";
    close.textContent = "✕";
    close.setAttribute("aria-label", "Close");
    close.addEventListener("click", () => this.close());

    const header = document.createElement("header");
    header.className = "cv-panel__header";
    header.append(this.title, close);

    this.content = document.createElement("div");
    this.content.className = "cv-panel__content";

    this.dialog.append(header, this.content);
    this.element.append(this.dialog);

    // A click on the backdrop itself (not inside the dialog) closes the panel.
    this.element.addEventListener("click", (event) => {
      if (event.target === this.element) {
        this.close();
      }
    });
    document.addEventListener("keydown", this.handleKeyDown);

    parent.appendChild(this.element);
  }

  public get isOpen(): boolean {
    return this.section !== undefined;
  }

  public get currentSection(): CvSectionId | undefined {
    return this.section;
  }

  public open(section: CvSectionId): void {
    const wasOpen = this.isOpen;
    const rendered = renderSection(section, this.cv);

    this.section = section;
    this.title.textContent = rendered.title;
    this.content.replaceChildren(rendered.body);
    this.content.scrollTop = 0;
    this.element.hidden = false;
    this.dialog.focus();

    if (!wasOpen) {
      this.notify(true);
    }
  }

  public close(): void {
    if (!this.isOpen) {
      return;
    }

    this.section = undefined;
    this.element.hidden = true;
    this.content.replaceChildren();
    this.notify(false);
  }

  /** Calls `listener` when the panel opens or closes. Returns a function that unsubscribes. */
  public onOpenChange(listener: OpenChangeListener): () => void {
    this.listeners.add(listener);

    return () => {
      this.listeners.delete(listener);
    };
  }

  public destroy(): void {
    document.removeEventListener("keydown", this.handleKeyDown);
    this.listeners.clear();
    this.element.remove();
  }

  private handleKeyDown = (event: KeyboardEvent): void => {
    if (event.key === "Escape" && this.isOpen) {
      this.close();
    }
  };

  private notify(open: boolean): void {
    for (const listener of this.listeners) {
      listener(open);
    }
  }
}
