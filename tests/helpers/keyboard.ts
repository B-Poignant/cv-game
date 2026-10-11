/** Simulates a key being pressed on `window`, as the browser would. */
export function pressKey(key: string): void {
  window.dispatchEvent(new KeyboardEvent("keydown", { key }));
}

export function releaseKey(key: string): void {
  window.dispatchEvent(new KeyboardEvent("keyup", { key }));
}
