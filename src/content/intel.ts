import type { IntelCardId } from "../../shared/intel";
import type { Cv } from "../domain/Cv";
import type { Experience } from "../domain/Experience";
import { formatDuration, parseMonth } from "./format";

/** What an intel card (F-031) says, in French like the CV (GAME_DESIGN.md › Language). */
export interface IntelCardText {
  title: string;
  text: string;
}

/** Texts validated by the CV owner. Keep them in line with `DEV_PREFERENCES`. */
const FIXED_TEXTS = {
  stack: {
    title: "Stack principale",
    text: "PHP (Symfony, Laravel) et JavaScript / TypeScript (Ember.js, React, Vue.js)",
  },
  "work-mode": {
    title: "Critère éliminatoire",
    text: "Télétravail idéal, hybride accepté, 5 jours sur site : refus",
  },
} as const satisfies Partial<Record<IntelCardId, IntelCardText>>;

export function intelCardText(
  id: IntelCardId,
  cv: Cv,
  now: Date,
): IntelCardText {
  if (id === "lead") {
    const leads = leadExperiences(cv.experiences);

    const dev = formatDuration(
      distinctMonths(devExperiences(cv.experiences), now),
    );
    const lead = formatDuration(distinctMonths(leads, now));

    return {
      title: "Séniorité",
      text: `Dev : ${dev} + Lead : ${lead}`,
    };
  }

  return FIXED_TEXTS[id];
}

/** Lead roles (the role title says "Lead"), oldest first. */
export function leadExperiences(
  experiences: readonly Experience[],
): Experience[] {
  return experiences
    .filter((experience) => isLead(experience))
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
}

/** Developer roles: neither lead roles nor work-study jobs done during school. */
export function devExperiences(
  experiences: readonly Experience[],
): Experience[] {
  return experiences.filter(
    (experience) =>
      !isLead(experience) && !/alternance/i.test(experience.contract ?? ""),
  );
}

function isLead(experience: Experience): boolean {
  return /\blead\b/i.test(experience.role);
}

/**
 * Months covered by the experiences, counting both ends like LinkedIn but each month only
 * once: back-to-back roles share their changeover month.
 */
export function distinctMonths(
  experiences: readonly Experience[],
  now: Date,
): number {
  const months = new Set<number>();

  for (const { startDate, endDate } of experiences) {
    const first = monthNumber(parseMonth(startDate));
    const last = endDate
      ? monthNumber(parseMonth(endDate))
      : now.getUTCFullYear() * 12 + now.getUTCMonth();

    for (let month = first; month <= last; month += 1) {
      months.add(month);
    }
  }

  return months.size;
}

function monthNumber({ year, month }: { year: number; month: number }): number {
  return year * 12 + month - 1;
}
