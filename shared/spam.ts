// Recruiter-spam hazards (F-063): "exciting opportunity" emails fly across the map and slow
// down the recruiters they hit. The server runs them; the client draws them and slows its
// own player to match, so both sides agree on the speed.

export const SPAM = {
  /** Emails flying at once, at most. */
  maxEmails: 2,
  /** The first email comes soon after the room opens… */
  firstSpawnSeconds: 1,
  /** …then one more every this many seconds, while there's room for it. */
  spawnIntervalSeconds: 5,
  /** Tiles per second: faster than recruiters, so they dodge rather than outrun. */
  speed: 5,
  /** A recruiter closer than this to an email, in tiles, is hit. */
  hitDistance: 0.6,
  /** A hit recruiter moves at this share of `PLAYER_SPEED`… */
  slowFactor: 0.5,
  /** …for this many seconds. Another hit restarts the count. */
  slowSeconds: 2,
} as const;

/** What the emails say, picked by id on the client (GAME_DESIGN.md › Tone). */
export const SPAM_SUBJECTS = [
  "Exciting opportunity!",
  "Quick call?",
  "Rockstar ninja wanted",
  "You're a perfect fit!",
  "Fast-paced team!",
] as const;

/** The subject an email shows, from its id, so every visitor sees the same one. */
export function spamSubject(id: number): string {
  return SPAM_SUBJECTS[Math.abs(Math.trunc(id)) % SPAM_SUBJECTS.length];
}
