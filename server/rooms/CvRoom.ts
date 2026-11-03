import { type Client, Room, type RoomException } from "colyseus";

import {
  createWorldCollisions,
  DEV_FLEE_RADIUS,
  DEV_NAME,
  DEV_SPAWN,
  DEV_SPEED,
  DEV_SPRINT,
  isWalkable,
  PLAYER_SPAWN,
  PLAYER_SPEED,
} from "../../shared/world";
import {
  INTEL_NEEDED_TO_PITCH,
  intelCardFrom,
  isIntelSource,
  isWithinIntelReach,
} from "../../shared/intel";
import {
  CATCH_DISTANCE,
  DEV_LINES,
  isPitchOffer,
  type PitchEvent,
  PITCH_COOLDOWN_SECONDS,
  scorePitch,
} from "../../shared/pitch";
import { normalizeIdentity, randomRecruiter } from "../../shared/recruiters";
import { SPAM } from "../../shared/spam";
import { CvRoomState, DevState, EmailState, PlayerState } from "./CvRoomState";
import { DevWanderer } from "./DevWanderer";
import { MoveBudget } from "./MoveBudget";
import { PitchTracker } from "./PitchTracker";
import { SpamStorm } from "./SpamStorm";

/** Longest single move, in tiles: also how much movement a client can save up. */
const MAX_MOVE_DISTANCE = 1;

/** Headroom over PLAYER_SPEED for uneven frame and network timing. */
const SPEED_TOLERANCE = 1.25;

/** How often the server moves the dev, in milliseconds (20 times a second). */
export const SIMULATION_INTERVAL_MS = 50;

/** Time to send an offer once the pitch dialog opens (F-042). */
export const PITCH_WINDOW_MS = 60_000;

/** Minimum time between two "no" from the dev to the same recruiter. */
const PITCH_NOTICE_MS = 3000;

/** `DEV_WANDERS=false` keeps the dev in place (e2e tests compare screenshots). */
function devWanders(): boolean {
  return process.env.DEV_WANDERS !== "false";
}

/** `SPAM_FLIES=false` turns the spam hazard off (F-063): e2e and most integration tests. */
function spamFlies(): boolean {
  return process.env.SPAM_FLIES !== "false";
}

/** How fast a recruiter's move budget refills: their speed, plus headroom for timing. */
function refillRate(slowed: boolean): number {
  return PLAYER_SPEED * SPEED_TOLERANCE * (slowed ? SPAM.slowFactor : 1);
}

interface MoveMessage {
  column: number;
  row: number;
}

export class CvRoom extends Room {
  public maxClients = 10;

  public state = new CvRoomState();

  private readonly collisions = createWorldCollisions();

  private readonly moveBudgets = new Map<string, MoveBudget>();

  private readonly pitches = new PitchTracker({
    windowMs: PITCH_WINDOW_MS,
    cooldownMs: PITCH_COOLDOWN_SECONDS * 1000,
    noticeMs: PITCH_NOTICE_MS,
  });

  private readonly devWanderer = new DevWanderer(this.collisions, DEV_SPAWN, {
    speed: DEV_SPEED,
    fleeRadius: DEV_FLEE_RADIUS,
    sprint: DEV_SPRINT,
    maxTargetDistance: 5,
    minPauseSeconds: 0.5,
    maxPauseSeconds: 2,
    random: Math.random,
  });

  private readonly spamStorm = new SpamStorm({ random: Math.random });

  public onCreate(): void {
    const dev = new DevState();

    dev.name = DEV_NAME;
    dev.column = DEV_SPAWN.column;
    dev.row = DEV_SPAWN.row;
    this.state.dev = dev;

    this.onMessage("move", (client: Client, message: unknown) => {
      this.handleMove(client, message);
    });

    this.onMessage("collect-intel", (client: Client, message: unknown) => {
      this.handleCollectIntel(client, message);
    });

    this.onMessage("pitch", (client: Client, message: unknown) => {
      this.handlePitch(client, message);
    });

    this.onMessage("pitch-cancel", (client: Client) => {
      this.pitches.cancel(client.sessionId, performance.now());
    });

    const isDevWandering = devWanders();
    const isSpamFlying = spamFlies();

    if (isDevWandering || isSpamFlying) {
      this.setTimestep((deltaMs) => {
        if (isDevWandering) {
          this.moveDev(deltaMs / 1000);
        }
        if (isSpamFlying) {
          this.updateSpam(deltaMs / 1000);
        }
      }, SIMULATION_INTERVAL_MS);
    }
  }

  /**
   * A handler that throws would otherwise end the Node process, and every room with it.
   * Defining this makes Colyseus catch and report it instead (message handlers, timers,
   * the simulation step and the lifecycle hooks).
   */
  public onUncaughtException(error: RoomException, methodName: string): void {
    console.error(`[CvRoom] ${methodName} failed:`, error);
  }

  /** `options` comes from the client: an identity it typed (F-012), never trusted as is. */
  public onJoin(client: Client, options?: unknown): void {
    const player = new PlayerState();
    const identity = normalizeIdentity(options) ?? randomRecruiter();

    player.name = identity.name;
    player.company = identity.company;
    player.column = PLAYER_SPAWN.column;
    player.row = PLAYER_SPAWN.row;
    player.slowed = false;

    this.state.players.set(client.sessionId, player);
    this.moveBudgets.set(
      client.sessionId,
      new MoveBudget(MAX_MOVE_DISTANCE, refillRate(false), performance.now()),
    );

    console.log(`${identity.name} (${client.sessionId}) joined the CV room`);
  }

  public onLeave(client: Client, code?: number): void {
    console.log(`Player ${client.sessionId} left the CV room`, {
      code,
    });

    this.state.players.delete(client.sessionId);
    this.moveBudgets.delete(client.sessionId);
    this.pitches.remove(client.sessionId);
    this.spamStorm.remove(client.sessionId);
  }

  /**
   * Flies the spam emails (F-063) and slows down the recruiters they hit: their move budget
   * refills slower, and `slowed` tells their client to walk slower too.
   */
  private updateSpam(deltaSeconds: number): void {
    const targets = [...this.state.players.entries()].map(([id, player]) => ({
      id,
      column: player.column,
      row: player.row,
    }));
    const changes = this.spamStorm.update(deltaSeconds, targets);
    const now = performance.now();

    for (const id of changes.slowed) {
      this.setSlowed(id, true, now);
    }
    for (const id of changes.recovered) {
      this.setSlowed(id, false, now);
    }

    this.syncEmails();
  }

  private setSlowed(sessionId: string, slowed: boolean, nowMs: number): void {
    const player = this.state.players.get(sessionId);

    if (player) {
      player.slowed = slowed;
    }
    this.moveBudgets.get(sessionId)?.setRefillRate(refillRate(slowed), nowMs);
  }

  private syncEmails(): void {
    const emails = this.state.emails;
    const flying = new Map(
      this.spamStorm.emails.map((email) => [String(email.id), email]),
    );

    for (const key of [...emails.keys()]) {
      if (!flying.has(key)) {
        emails.delete(key);
      }
    }

    for (const [key, email] of flying) {
      const state = emails.get(key) ?? new EmailState();

      state.id = email.id;
      state.column = email.column;
      state.row = email.row;
      if (!emails.has(key)) {
        emails.set(key, state);
      }
    }
  }

  /** The dev wanders (F-060) and runs from nearby recruiters (F-061). Only the server moves him. */
  private moveDev(deltaSeconds: number): void {
    const recruiters = [...this.state.players.values()];
    const position = this.devWanderer.update(deltaSeconds, recruiters);

    this.state.dev.column = position.column;
    this.state.dev.row = position.row;

    for (const client of this.clients) {
      this.checkCatch(client);
    }
  }

  /**
   * A recruiter touching the dev (F-042): the server decides, from its own positions, whether
   * the pitch dialog opens or the dev says no.
   */
  private checkCatch(client: Client): void {
    const player = this.state.players.get(client.sessionId);

    if (!player || distanceBetween(player, this.state.dev) >= CATCH_DISTANCE) {
      return;
    }

    const outcome = this.pitches.touch(
      client.sessionId,
      player.intel.length >= INTEL_NEEDED_TO_PITCH,
      performance.now(),
    );

    switch (outcome.kind) {
      case "open":
        client.send("pitch", { type: "open" } satisfies PitchEvent);
        break;
      case "no-intel":
        client.send("pitch", {
          type: "refused",
          line: DEV_LINES.noIntel,
        } satisfies PitchEvent);
        break;
      case "cooldown":
        client.send("pitch", {
          type: "refused",
          line: DEV_LINES.cooldown(outcome.secondsLeft),
        } satisfies PitchEvent);
        break;
      case "none":
        break;
    }
  }

  /** Scores an offer sent while the recruiter's pitch dialog is open. Anything else is ignored. */
  private handlePitch(client: Client, message: unknown): void {
    if (!this.state.players.has(client.sessionId) || !isPitchOffer(message)) {
      return;
    }

    const now = performance.now();
    const outcome = this.pitches.submit(client.sessionId, now);

    if (outcome === "late") {
      // The recruiter's dialog is waiting for an answer: don't leave it hanging.
      client.send("pitch", {
        type: "refused",
        line: DEV_LINES.tooSlow,
      } satisfies PitchEvent);
    }
    if (outcome !== "accepted") {
      return;
    }

    const result = scorePitch(message);

    if (!result.hired) {
      this.pitches.fail(client.sessionId, now);
    }

    client.send("pitch", { type: "result", ...result } satisfies PitchEvent);
  }

  /** `message` comes from the client: anything can arrive, so it is checked before use. */
  private handleMove(client: Client, message: unknown): void {
    const player = this.state.players.get(client.sessionId);
    const budget = this.moveBudgets.get(client.sessionId);

    if (!player || !budget) {
      return;
    }

    if (!isMoveMessage(message) || !this.isValidPosition(message)) {
      return;
    }

    // Distance per move and speed over time: a client can't jump or move too fast.
    if (!budget.tryMove(distanceBetween(player, message), performance.now())) {
      return;
    }

    player.column = message.column;
    player.row = message.row;

    this.checkCatch(client);
  }

  /**
   * Gives the card of a building or the chest (F-031), once, to a recruiter standing close
   * enough. The client only names the source: the server checks everything else.
   */
  private handleCollectIntel(client: Client, message: unknown): void {
    const player = this.state.players.get(client.sessionId);
    const source =
      typeof message === "object" && message !== null && "source" in message
        ? message.source
        : undefined;

    if (!player || !isIntelSource(source)) {
      return;
    }

    const card = intelCardFrom(source);

    if (
      !card ||
      player.intel.includes(card) ||
      !isWithinIntelReach(player, source)
    ) {
      return;
    }

    player.intel.push(card);
  }

  /** Finite numbers, inside the map and not inside a building (same rule as the client). */
  private isValidPosition(position: MoveMessage): boolean {
    return (
      Number.isFinite(position.column) &&
      Number.isFinite(position.row) &&
      isWalkable(position, this.collisions)
    );
  }
}

function isMoveMessage(message: unknown): message is MoveMessage {
  return (
    typeof message === "object" &&
    message !== null &&
    "column" in message &&
    "row" in message &&
    typeof message.column === "number" &&
    typeof message.row === "number"
  );
}

function distanceBetween(from: MoveMessage, to: MoveMessage): number {
  return Math.hypot(to.column - from.column, to.row - from.row);
}
