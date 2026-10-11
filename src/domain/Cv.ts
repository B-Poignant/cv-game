import type { Education } from "./Education";
import type { Experience } from "./Experience";
import type { Language } from "./Language";
import type { Profile } from "./Profile";
import type { Project } from "./Project";
import type { Skill } from "./Skill";

export type { CvSectionId } from "../../shared/buildings";

/** The whole CV, one field per section (and per map district, see GAME_DESIGN.md). */
export interface Cv {
  profile: Profile;
  /** Most recent first. */
  experiences: Experience[];
  education: Education[];
  /** `level` from 1 (notions) to 5 (expert). */
  skills: Skill[];
  languages: Language[];
  projects: Project[];
}
