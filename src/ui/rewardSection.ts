import type { Contact } from "../domain/Contact";

/** The part of the clipboard API the copy buttons use (`navigator.clipboard`). */
export interface TextClipboard {
  writeText(text: string): Promise<void>;
}

/**
 * The reward after a good pitch (F-043): the dev's contact details, each with a copy button,
 * and the CV PDF if there is one. Built with textContent only.
 */
export function renderReward(
  contact: Contact,
  // Undefined outside HTTPS (and localhost); null in tests for "no clipboard".
  clipboard: TextClipboard | null | undefined = navigator.clipboard,
): HTMLElement {
  const section = document.createElement("section");
  section.className = "reward";
  section.setAttribute("aria-label", "Contact details");

  const intro = document.createElement("p");
  intro.className = "reward__intro";
  intro.textContent = "Here's how to reach me for real:";

  const list = document.createElement("ul");
  list.className = "reward__list";

  if (contact.linkedin) {
    list.append(
      createRow(
        "LinkedIn",
        contact.linkedin,
        contact.linkedin.replace(/^https?:\/\/(www\.)?/, ""),
        clipboard,
      ),
    );
  }

  if (contact.email) {
    list.append(
      createRow(
        "Email",
        `mailto:${contact.email}`,
        contact.email,
        clipboard,
        contact.email,
      ),
    );
  }

  section.append(intro, list);

  if (contact.cvPdf) {
    const download = document.createElement("a");
    download.className = "reward__download";
    download.href = contact.cvPdf;
    download.download = "";
    download.textContent = "Download my CV (PDF)";
    section.append(download);
  }

  return section;
}

function createRow(
  label: string,
  href: string,
  text: string,
  clipboard: TextClipboard | null | undefined,
  copyValue = href,
): HTMLLIElement {
  const row = document.createElement("li");
  row.className = "reward__row";

  const name = document.createElement("span");
  name.className = "reward__label";
  name.textContent = label;

  const link = document.createElement("a");
  link.href = href;
  link.textContent = text;
  if (!href.startsWith("mailto:")) {
    link.target = "_blank";
    link.rel = "noopener noreferrer";
  }

  const copy = document.createElement("button");
  copy.type = "button";
  copy.className = "reward__copy";
  copy.textContent = "Copy";
  copy.setAttribute("aria-label", `Copy ${label}`);
  copy.addEventListener("click", () => {
    if (!clipboard) {
      copy.textContent = "Copy failed";
      return;
    }

    clipboard.writeText(copyValue).then(
      () => {
        copy.textContent = "Copied!";
      },
      () => {
        copy.textContent = "Copy failed";
      },
    );
  });

  row.append(name, link, copy);

  return row;
}
