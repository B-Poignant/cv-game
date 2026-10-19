import { BUILDINGS, type CvSectionId } from "../../shared/buildings";
import { type IntelCardId, intelCardFrom } from "../../shared/intel";
import {
  type Achievement,
  type AchievementId,
  ACHIEVEMENTS,
  SPEED_HIRE_MS,
} from "../config/achievements";

/** Where unlocked achievements are kept between visits: `localStorage` in the browser. */
export interface AchievementStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export const ACHIEVEMENTS_STORAGE_KEY = "cv-game.achievements";

/** The browser's `localStorage`, or undefined where it's blocked (private mode, sandbox). */
export function browserStorage(): AchievementStorage | undefined {
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

type UnlockListener = (achievement: Achievement) => void;

/**
 * Unlocks achievements from what the visitor does (F-041). Pixi-free: `Game` reports the
 * events, the UI listens. Unlocked ones are saved in `storage` so they last between visits;
 * if storage fails, they only last for this visit. The rest (sections read, pitches made,
 * arrival time) is per visit.
 */
export class AchievementTracker {
  private readonly storage?: AchievementStorage;
  private readonly now: () => number;
  private readonly unlockedIds: Set<AchievementId>;
  private readonly sectionsRead = new Set<CvSectionId>();
  private readonly listeners = new Set<UnlockListener>();

  private arrivedAt?: number;
  private pitches = 0;

  constructor(storage?: AchievementStorage, now: () => number = Date.now) {
    this.storage = storage;
    this.now = now;
    this.unlockedIds = new Set(this.load());
  }

  /** Unlocked so far, in list order. */
  public get unlocked(): readonly Achievement[] {
    return ACHIEVEMENTS.filter((achievement) =>
      this.unlockedIds.has(achievement.id),
    );
  }

  public isUnlocked(id: AchievementId): boolean {
    return this.unlockedIds.has(id);
  }

  /** Calls `listener` with each new achievement. Returns a function that unsubscribes. */
  public onUnlock(listener: UnlockListener): () => void {
    this.listeners.add(listener);

    return () => {
      this.listeners.delete(listener);
    };
  }

  /** The visitor joined the game: starts the clock for "Hired in under 2 minutes". */
  public arrived(): void {
    this.arrivedAt = this.now();
  }

  /** A CV panel was opened. */
  public sectionOpened(section: CvSectionId): void {
    this.sectionsRead.add(section);

    if (BUILDINGS.every(({ section: id }) => this.sectionsRead.has(id))) {
      this.unlock("read-cv");
    }
  }

  /** The intel cards the visitor holds changed. */
  public intelChanged(cards: readonly IntelCardId[]): void {
    const chestCard = intelCardFrom("chest");

    if (chestCard && cards.includes(chestCard)) {
      this.unlock("chest");
    }
  }

  /** Ben answered a pitch. */
  public pitched(hired: boolean): void {
    this.pitches += 1;

    if (!hired) {
      return;
    }

    this.unlock("hired");
    if (this.pitches === 1) {
      this.unlock("first-try");
    }
    if (
      this.arrivedAt !== undefined &&
      this.now() - this.arrivedAt < SPEED_HIRE_MS
    ) {
      this.unlock("speed-hire");
    }
  }

  private unlock(id: AchievementId): void {
    if (this.unlockedIds.has(id)) {
      return;
    }

    this.unlockedIds.add(id);
    this.save();

    const achievement = ACHIEVEMENTS.find((candidate) => candidate.id === id);

    if (achievement) {
      for (const listener of this.listeners) {
        listener(achievement);
      }
    }
  }

  /** Saved ids, keeping only ones that still exist. Anything unreadable counts as none. */
  private load(): AchievementId[] {
    try {
      const saved: unknown = JSON.parse(
        this.storage?.getItem(ACHIEVEMENTS_STORAGE_KEY) ?? "[]",
      );

      return Array.isArray(saved) ? saved.filter(isAchievementId) : [];
    } catch (error) {
      console.warn("Saved achievements could not be read", error);
      return [];
    }
  }

  private save(): void {
    try {
      this.storage?.setItem(
        ACHIEVEMENTS_STORAGE_KEY,
        JSON.stringify([...this.unlockedIds]),
      );
    } catch (error) {
      console.warn("Achievements could not be saved", error);
    }
  }
}

function isAchievementId(value: unknown): value is AchievementId {
  return ACHIEVEMENTS.some((achievement) => achievement.id === value);
}
