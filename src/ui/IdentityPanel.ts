import {
  COMPANY_MAX_LENGTH,
  NAME_MAX_LENGTH,
  normalizeIdentity,
  randomRecruiter,
  type RecruiterIdentity,
} from "../../shared/recruiters";

/** The classic HTML CV (F-032), for visitors who'd rather read than play. */
export const CV_PAGE_URL = "/cv/";

/**
 * The arrival panel (F-012): "Who are you today?", prefilled with a random recruiter.
 * 🎲 picks another one, Start enters the game. Styled in style.css (reuses the CV panel look).
 */
export class IdentityPanel {
  /** The dimmed backdrop; the form is its child. */
  public readonly element: HTMLDivElement;

  private readonly form: HTMLFormElement;
  private readonly nameInput: HTMLInputElement;
  private readonly companyInput: HTMLInputElement;
  private readonly error: HTMLParagraphElement;
  private readonly random: () => number;

  constructor(
    parent: HTMLElement = document.body,
    random: () => number = Math.random,
  ) {
    this.random = random;

    this.element = document.createElement("div");
    this.element.className = "cv-backdrop";
    this.element.hidden = true;

    this.form = document.createElement("form");
    this.form.className = "cv-panel identity-panel";
    this.form.setAttribute("role", "dialog");
    this.form.setAttribute("aria-modal", "true");
    this.form.setAttribute("aria-labelledby", "identity-panel-title");
    this.form.noValidate = true;

    const title = document.createElement("h1");
    title.id = "identity-panel-title";
    title.className = "cv-panel__title";
    title.textContent = "Who are you today?";

    const intro = document.createElement("p");
    intro.className = "identity-panel__intro";
    intro.textContent =
      "You're a recruiter, and Ben, the dev, is somewhere on this map. Pick a name.";

    this.nameInput = createInput("identity-name", NAME_MAX_LENGTH);
    this.companyInput = createInput("identity-company", COMPANY_MAX_LENGTH);

    this.error = document.createElement("p");
    this.error.className = "identity-panel__error";
    this.error.setAttribute("role", "alert");
    this.error.hidden = true;

    const reroll = document.createElement("button");
    reroll.type = "button";
    reroll.className = "identity-panel__reroll";
    reroll.textContent = "🎲";
    reroll.setAttribute("aria-label", "Pick another recruiter");
    reroll.addEventListener("click", () =>
      this.fill(randomRecruiter(this.random)),
    );

    const start = document.createElement("button");
    start.type = "submit";
    start.className = "identity-panel__start";
    start.textContent = "Start";

    const actions = document.createElement("div");
    actions.className = "identity-panel__actions";
    actions.append(reroll, start);

    const skip = document.createElement("p");
    skip.className = "identity-panel__skip";
    const cvLink = document.createElement("a");
    cvLink.href = CV_PAGE_URL;
    cvLink.textContent = "read the classic CV";
    skip.append("In a hurry? Skip the game and ", cvLink, ".");

    this.form.append(
      title,
      intro,
      createField("Name", this.nameInput),
      createField("Company", this.companyInput),
      this.error,
      actions,
      skip,
    );
    this.element.append(this.form);

    parent.appendChild(this.element);
  }

  public get isOpen(): boolean {
    return !this.element.hidden;
  }

  /**
   * Opens the panel with a random recruiter and resolves with the identity the visitor
   * starts with, once it's valid. The panel then closes.
   */
  public choose(): Promise<RecruiterIdentity> {
    this.fill(randomRecruiter(this.random));
    this.error.hidden = true;
    this.element.hidden = false;
    this.nameInput.focus();
    this.nameInput.select();

    return new Promise((resolve) => {
      const handleSubmit = (event: SubmitEvent): void => {
        event.preventDefault();

        const identity = normalizeIdentity({
          name: this.nameInput.value,
          company: this.companyInput.value,
        });

        if (!identity) {
          this.error.textContent = `Use 1–${NAME_MAX_LENGTH} characters for the name and 1–${COMPANY_MAX_LENGTH} for the company: letters, digits, spaces and . , ' & ! ? ( ) -`;
          this.error.hidden = false;

          return;
        }

        this.form.removeEventListener("submit", handleSubmit);
        this.element.hidden = true;
        resolve(identity);
      };

      this.form.addEventListener("submit", handleSubmit);
    });
  }

  public destroy(): void {
    this.element.remove();
  }

  private fill(identity: RecruiterIdentity): void {
    this.nameInput.value = identity.name;
    this.companyInput.value = identity.company;
  }
}

function createInput(id: string, maxLength: number): HTMLInputElement {
  const input = document.createElement("input");
  input.id = id;
  input.type = "text";
  input.maxLength = maxLength;
  input.autocomplete = "off";
  input.spellcheck = false;

  return input;
}

function createField(label: string, input: HTMLInputElement): HTMLLabelElement {
  const field = document.createElement("label");
  field.className = "identity-panel__field";
  field.htmlFor = input.id;

  const text = document.createElement("span");
  text.textContent = label;

  field.append(text, input);

  return field;
}
