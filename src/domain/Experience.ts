import type { WorkMode } from "../../shared/preferences";

export type { WorkMode };

export interface Experience {
  company: string;
  role: string;
  /** `YYYY-MM`. */
  startDate: string;
  /** `YYYY-MM`, or absent for the current job. */
  endDate?: string;
  contract?: string;
  location?: string;
  workMode?: WorkMode;
  /** Short summary of the role. */
  description?: string;
  /** Main missions and achievements, one per line. */
  highlights: string[];
  technologies: string[];
}
