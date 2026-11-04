/**
 * The debug mode's switch and readout (F-051): a "🐞 Debug" button in the bottom-right
 * corner that shows or hides the overlay and a text readout of what the code is doing.
 * Shown to every visitor: it also shows recruiters how the game is built. Styled in
 * style.css; the text is set with `textContent`.
 */
export class DebugPanel {
  public readonly element: HTMLElement;

  private readonly button: HTMLButtonElement;
  private readonly readout: HTMLPreElement;
  private readonly listeners: ((open: boolean) => void)[] = [];

  constructor(parent: HTMLElement = document.body) {
    this.element = document.createElement("div");
    this.element.className = "debug";

    this.readout = document.createElement("pre");
    this.readout.id = "debug-readout";
    this.readout.className = "debug__readout";
    this.readout.hidden = true;

    this.button = document.createElement("button");
    this.button.type = "button";
    this.button.className = "debug__button";
    this.button.textContent = "🐞 Debug";
    this.button.setAttribute("aria-controls", this.readout.id);
    this.button.setAttribute("aria-pressed", "false");
    this.button.addEventListener("click", () => {
      this.toggle();
      // Give focus back to the game so the arrow keys move the player again.
      this.button.blur();
    });

    this.element.append(this.readout, this.button);
    parent.appendChild(this.element);
  }

  public get isOpen(): boolean {
    return !this.readout.hidden;
  }

  public toggle(): void {
    this.readout.hidden = !this.readout.hidden;
    this.button.setAttribute("aria-pressed", String(this.isOpen));

    for (const listener of this.listeners) {
      listener(this.isOpen);
    }
  }

  public onToggle(listener: (open: boolean) => void): void {
    this.listeners.push(listener);
  }

  /** Shows `lines`, one per line. Does nothing while closed. */
  public render(lines: readonly string[]): void {
    const text = lines.join("\n");

    if (this.isOpen && this.readout.textContent !== text) {
      this.readout.textContent = text;
    }
  }

  public destroy(): void {
    this.listeners.length = 0;
    this.element.remove();
  }
}
