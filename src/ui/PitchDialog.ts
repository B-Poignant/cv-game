import {
  isPitchOffer,
  LINE_OPTIONS,
  type PitchCategory,
  type PitchOffer,
  type PitchResult,
  ROLE_OPTIONS,
  STACK_OPTIONS,
  WORK_MODE_OPTIONS,
} from "../../shared/pitch";

const GROUPS: readonly {
  category: PitchCategory;
  legend: string;
  options: readonly { id: string; label: string }[];
}[] = [
  { category: "stack", legend: "Stack", options: STACK_OPTIONS },
  { category: "workMode", legend: "Work mode", options: WORK_MODE_OPTIONS },
  { category: "role", legend: "Role", options: ROLE_OPTIONS },
  { category: "line", legend: "Opening line", options: LINE_OPTIONS },
];

type Stage = "closed" | "choosing" | "waiting" | "result";

/**
 * The pitch (F-042): once a recruiter with enough intel catches the dev, they pick one
 * option per part of the offer. The server scores it and the dialog shows the dev's answer.
 * Styled in style.css (reuses the CV panel look).
 */
export class PitchDialog {
  /** The dimmed backdrop; the form is its child. */
  public readonly element: HTMLDivElement;

  private readonly form: HTMLFormElement;
  private readonly title: HTMLHeadingElement;
  private readonly offer: HTMLDivElement;
  private readonly error: HTMLParagraphElement;
  private readonly submit: HTMLButtonElement;
  private readonly result: HTMLDivElement;
  private readonly replies: HTMLUListElement;
  private readonly done: HTMLButtonElement;
  private readonly extra: HTMLDivElement;

  private settle?: () => void;

  constructor(parent: HTMLElement = document.body) {
    this.element = document.createElement("div");
    this.element.className = "cv-backdrop";
    this.element.hidden = true;

    this.form = document.createElement("form");
    this.form.className = "cv-panel pitch-dialog";
    this.form.setAttribute("role", "dialog");
    this.form.setAttribute("aria-modal", "true");
    this.form.setAttribute("aria-labelledby", "pitch-dialog-title");
    this.form.noValidate = true;

    this.title = document.createElement("h1");
    this.title.id = "pitch-dialog-title";
    this.title.className = "cv-panel__title";

    const close = document.createElement("button");
    close.type = "button";
    close.className = "cv-panel__close";
    close.textContent = "✕";
    close.setAttribute("aria-label", "Close");
    close.addEventListener("click", () => this.settle?.());

    const header = document.createElement("div");
    header.className = "pitch-dialog__header";
    header.append(this.title, close);

    const intro = document.createElement("p");
    intro.className = "pitch-dialog__intro";
    intro.textContent =
      "You caught Ben! He's listening, for now. Build an offer from your intel.";

    this.error = document.createElement("p");
    this.error.className = "pitch-dialog__error";
    this.error.setAttribute("role", "alert");
    this.error.hidden = true;

    this.submit = document.createElement("button");
    this.submit.type = "submit";
    this.submit.className = "pitch-dialog__button";

    this.offer = document.createElement("div");
    this.offer.className = "pitch-dialog__offer";
    this.offer.append(
      intro,
      ...GROUPS.map((group) => createGroup(group)),
      this.error,
      this.submit,
    );

    this.replies = document.createElement("ul");
    this.replies.className = "pitch-dialog__replies";

    this.done = document.createElement("button");
    this.done.type = "button";
    this.done.className = "pitch-dialog__button";
    this.done.textContent = "Close";
    this.done.addEventListener("click", () => this.settle?.());

    this.result = document.createElement("div");
    this.result.className = "pitch-dialog__result";
    this.extra = document.createElement("div");
    this.extra.className = "pitch-dialog__extra";

    this.result.append(this.replies, this.extra, this.done);

    this.form.append(header, this.offer, this.result);
    this.element.append(this.form);
    this.element.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        this.settle?.();
      }
    });

    parent.appendChild(this.element);
  }

  public get isOpen(): boolean {
    return !this.element.hidden;
  }

  /**
   * Opens the dialog and resolves with the offer once every part is picked, or `undefined`
   * if the visitor closes it. After an offer, the dialog stays open until `showResult`.
   */
  public choose(): Promise<PitchOffer | undefined> {
    this.form.reset();
    this.setStage("choosing");
    this.form.querySelector("input")?.focus();

    return new Promise((resolve) => {
      const finish = (offer: PitchOffer | undefined): void => {
        this.form.removeEventListener("submit", handleSubmit);
        this.settle = offer ? () => this.setStage("closed") : undefined;

        if (offer) {
          this.setStage("waiting");
        } else {
          this.setStage("closed");
        }

        resolve(offer);
      };

      const handleSubmit = (event: SubmitEvent): void => {
        event.preventDefault();

        const data = new FormData(this.form);
        const offer = Object.fromEntries(
          GROUPS.map(({ category }) => [category, data.get(category)]),
        );

        if (!isPitchOffer(offer)) {
          this.error.textContent = "Pick one option in each part of the offer.";
          this.error.hidden = false;

          return;
        }

        finish(offer);
      };

      this.settle = () => finish(undefined);
      this.form.addEventListener("submit", handleSubmit);
    });
  }

  /**
   * Shows the dev's answer, followed by `extra` if given (the reward, F-043), and resolves
   * when the visitor closes the dialog.
   */
  public showResult(result: PitchResult, extra?: HTMLElement): Promise<void> {
    this.title.textContent = result.hired ? "You got me!" : "Not this time";
    this.replies.replaceChildren(
      ...result.lines.map((line) => {
        const item = document.createElement("li");
        item.textContent = `Ben: “${line}”`;

        return item;
      }),
    );
    this.extra.replaceChildren(...(extra ? [extra] : []));
    this.setStage("result");
    this.done.focus();

    return new Promise((resolve) => {
      this.settle = () => {
        this.settle = undefined;
        this.setStage("closed");
        resolve();
      };
    });
  }

  public destroy(): void {
    this.element.remove();
  }

  private setStage(stage: Stage): void {
    this.element.hidden = stage === "closed";
    this.offer.hidden = stage === "result";
    this.result.hidden = stage !== "result";
    this.error.hidden = true;

    if (stage === "choosing") {
      this.title.textContent = "Make Ben an offer";
    }

    for (const input of this.form.querySelectorAll("input")) {
      input.disabled = stage === "waiting";
    }
    this.submit.disabled = stage === "waiting";
    this.submit.textContent =
      stage === "waiting" ? "Ben is thinking…" : "Pitch";
  }
}

function createGroup({
  category,
  legend,
  options,
}: (typeof GROUPS)[number]): HTMLFieldSetElement {
  const fieldset = document.createElement("fieldset");
  fieldset.className = "pitch-dialog__group";

  const legendElement = document.createElement("legend");
  legendElement.textContent = legend;
  fieldset.append(legendElement);

  for (const option of options) {
    const label = document.createElement("label");
    label.className = "pitch-dialog__option";

    const input = document.createElement("input");
    input.type = "radio";
    input.name = category;
    input.value = option.id;

    const text = document.createElement("span");
    text.textContent = option.label;

    label.append(input, text);
    fieldset.append(label);
  }

  return fieldset;
}
