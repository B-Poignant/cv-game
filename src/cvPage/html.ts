// A tiny HTML builder for the generated CV page (F-032). The page is written as a string
// (it's built in Node, with no DOM), so every piece of text goes through `escapeHtml`.

const ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

/** Text or attribute value made safe to put in HTML. */
export function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (character) => ESCAPES[character] ?? "");
}

/** Already-escaped HTML, so it isn't escaped twice. */
export interface Html {
  readonly html: string;
}

export type Child = Html | string | false | null | undefined;

export function raw(html: string): Html {
  return { html };
}

/**
 * `<name attributes>children</name>`: string children and attribute values are escaped;
 * `false`, `null` and `undefined` children and attributes are left out.
 */
export function tag(
  name: string,
  attributes: Record<string, string | false | undefined> = {},
  ...children: (Child | readonly Child[])[]
): Html {
  const attributeText = Object.entries(attributes)
    .filter((entry): entry is [string, string] => typeof entry[1] === "string")
    .map(([key, value]) => ` ${key}="${escapeHtml(value)}"`)
    .join("");

  return raw(`<${name}${attributeText}>${join(children.flat())}</${name}>`);
}

/** Children joined into one piece of HTML. */
export function join(children: readonly Child[]): string {
  return children
    .map((child) => {
      if (typeof child === "string") {
        return escapeHtml(child);
      }

      return child ? child.html : "";
    })
    .join("");
}
