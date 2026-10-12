import { STACK_OPTIONS } from "../../../../shared/pitch";
import { DEV_PREFERENCES } from "../../../../shared/preferences";

/** Pure buzzwords: nobody's stack (GAME_DESIGN.md › "Skills Park: buzzword catcher"). */
const BUZZWORDS = [
  "Synergy",
  "Blockchain-native",
  "Rockstar",
  "Ninja",
  "10x",
  "Web3",
  "Disruptive",
] as const;

/** The dev's real stack: catch these (F-071). */
export const WORDS_TO_CATCH: readonly string[] = DEV_PREFERENCES.stack;

/** What he turns down in a pitch (F-042), plus pure buzzwords: dodge these (F-071). */
export const WORDS_TO_DODGE: readonly string[] = [
  ...STACK_OPTIONS.filter((option) => option.reply !== "").flatMap(
    (option) => option.technologies,
  ),
  ...BUZZWORDS,
];
