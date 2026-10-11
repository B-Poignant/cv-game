import type { WorkMode } from "../domain/Experience";

// Formatting for CV content, in French like the content itself (see GAME_DESIGN.md › Language).

const MONTH_FORMAT = new Intl.DateTimeFormat("fr-FR", {
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

export function parseMonth(value: string): { year: number; month: number } {
  const [year, month] = value.split("-").map(Number);
  return { year, month };
}

/** `"2023-07"` → `"juil. 2023"`. */
export function formatMonth(value: string): string {
  const { year, month } = parseMonth(value);
  return MONTH_FORMAT.format(new Date(Date.UTC(year, month - 1, 1)));
}

/**
 * Months covered from `start` to `end` (or `now`), counting both ends like LinkedIn:
 * 2023-07 → 2023-07 is 1 month.
 */
export function monthsBetween(
  start: string,
  end: string | undefined,
  now: Date,
): number {
  const from = parseMonth(start);
  const to = end
    ? parseMonth(end)
    : { year: now.getUTCFullYear(), month: now.getUTCMonth() + 1 };

  return (to.year - from.year) * 12 + (to.month - from.month) + 1;
}

/** `40` → `"3 ans 4 mois"`, `12` → `"1 an"`, `6` → `"6 mois"`. */
export function formatDuration(months: number): string {
  const years = Math.floor(months / 12);
  const rest = months % 12;
  const parts: string[] = [];

  if (years > 0) {
    parts.push(`${years} ${years > 1 ? "ans" : "an"}`);
  }
  if (rest > 0 || years === 0) {
    parts.push(`${rest} mois`);
  }

  return parts.join(" ");
}

/** `"juil. 2023 – aujourd'hui · 3 ans 4 mois"`. */
export function formatPeriod(
  start: string,
  end: string | undefined,
  now: Date,
): string {
  const range = `${formatMonth(start)} – ${end ? formatMonth(end) : "aujourd'hui"}`;
  return `${range} · ${formatDuration(monthsBetween(start, end, now))}`;
}

const WORK_MODES: Record<WorkMode, string> = {
  remote: "À distance",
  hybrid: "Hybride",
  onsite: "Sur site",
};

export function formatWorkMode(mode: WorkMode): string {
  return WORK_MODES[mode];
}
