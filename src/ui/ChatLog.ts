/** One line in the chat log: who said it (none for game notices), and what. */
export interface ChatMessage {
  speaker?: string;
  text: string;
}

/** Older messages are dropped past this many, so the log doesn't grow forever. */
export const CHAT_LOG_LIMIT = 50;

/**
 * Every message the game shows this visitor (F-052): Ben's lines, new intel, hints. An HTML
 * box in the bottom-left corner (styled in style.css), newest at the bottom.
 */
export class ChatLog {
  public readonly element: HTMLElement;

  private readonly list: HTMLOListElement;

  constructor(parent: HTMLElement = document.body) {
    this.element = document.createElement("aside");
    this.element.className = "chat-log";
    this.element.setAttribute("aria-label", "Messages");
    this.element.hidden = true;

    this.list = document.createElement("ol");
    this.list.className = "chat-log__messages";
    this.list.setAttribute("role", "log");

    this.element.append(this.list);
    parent.appendChild(this.element);
  }

  public get messages(): readonly string[] {
    return [...this.list.children].map((item) => item.textContent);
  }

  public post({ speaker, text }: ChatMessage): void {
    const item = document.createElement("li");
    item.className = "chat-log__message";

    if (speaker) {
      const name = document.createElement("strong");
      name.textContent = speaker;
      item.append(name, `: ${text}`);
    } else {
      item.classList.add("chat-log__message--notice");
      item.textContent = text;
    }

    this.list.append(item);

    while (this.list.children.length > CHAT_LOG_LIMIT) {
      this.list.firstElementChild?.remove();
    }

    this.element.hidden = false;
    this.list.scrollTop = this.list.scrollHeight;
  }

  public destroy(): void {
    this.element.remove();
  }
}
