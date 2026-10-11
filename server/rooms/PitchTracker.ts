export interface PitchTimings {
  /** How long a recruiter has to send an offer once the dialog opens. */
  windowMs: number;
  /** Wait after a bad pitch before the dev listens to the same recruiter again. */
  cooldownMs: number;
  /** Minimum time between two refusals ("no intel", "not again"), so touching isn't spam. */
  noticeMs: number;
}

/** What touching the dev leads to for one recruiter. */
export type TouchOutcome =
  | { kind: "open" }
  | { kind: "no-intel" }
  | { kind: "cooldown"; secondsLeft: number }
  | { kind: "none" };

interface RecruiterPitch {
  /** The open dialog's deadline, if there is one. */
  openUntil?: number;
  cooldownUntil: number;
  /** Nothing new happens on touch before this. */
  quietUntil: number;
}

/**
 * Who may pitch to the dev, and when (F-042). Pure bookkeeping on times passed in by the
 * room, so it can be tested without waiting.
 */
export class PitchTracker {
  private readonly timings: PitchTimings;
  private readonly recruiters = new Map<string, RecruiterPitch>();

  constructor(timings: PitchTimings) {
    this.timings = timings;
  }

  /** A recruiter touches the dev. `hasIntel`: they hold enough intel cards to pitch. */
  public touch(id: string, hasIntel: boolean, now: number): TouchOutcome {
    const pitch = this.get(id);

    if (this.isOpen(pitch, now) || now < pitch.quietUntil) {
      return { kind: "none" };
    }

    if (now < pitch.cooldownUntil) {
      pitch.quietUntil = now + this.timings.noticeMs;

      return {
        kind: "cooldown",
        secondsLeft: Math.ceil((pitch.cooldownUntil - now) / 1000),
      };
    }

    if (!hasIntel) {
      pitch.quietUntil = now + this.timings.noticeMs;

      return { kind: "no-intel" };
    }

    pitch.openUntil = now + this.timings.windowMs;

    return { kind: "open" };
  }

  /** Uses up the open dialog. False if there's none, or it timed out. */
  public submit(id: string, now: number): boolean {
    const pitch = this.get(id);
    const open = this.isOpen(pitch, now);

    pitch.openUntil = undefined;

    return open;
  }

  /** After a bad pitch. */
  public fail(id: string, now: number): void {
    this.get(id).cooldownUntil = now + this.timings.cooldownMs;
  }

  /** The recruiter closed the dialog without pitching: don't reopen it straight away. */
  public cancel(id: string, now: number): void {
    const pitch = this.get(id);

    pitch.openUntil = undefined;
    pitch.quietUntil = now + this.timings.noticeMs;
  }

  public remove(id: string): void {
    this.recruiters.delete(id);
  }

  private isOpen(pitch: RecruiterPitch, now: number): boolean {
    return pitch.openUntil !== undefined && now < pitch.openUntil;
  }

  private get(id: string): RecruiterPitch {
    let pitch = this.recruiters.get(id);

    if (!pitch) {
      pitch = { cooldownUntil: 0, quietUntil: 0 };
      this.recruiters.set(id, pitch);
    }

    return pitch;
  }
}
