import type { Room } from "@colyseus/sdk";

import type { CvRoomState } from "../../server/rooms/CvRoomState";
import type { PitchEvent, PitchOffer } from "../../shared/pitch";

/**
 * The pitch messages between this visitor and the room (F-042). The server decides when the
 * dialog opens (it checks the catch) and scores the offer; this only passes messages on.
 */
export class PitchChannel {
  private readonly room: Room<CvRoomState>;
  private readonly unsubscribe: () => void;

  constructor(room: Room<CvRoomState>, onEvent: (event: PitchEvent) => void) {
    this.room = room;
    this.unsubscribe = room.onMessage("pitch", (payload: unknown) => {
      if (isPitchEvent(payload)) {
        onEvent(payload);
      }
    });
  }

  public pitch(offer: PitchOffer): void {
    this.room.send("pitch", offer);
  }

  /** The visitor closed the dialog without pitching. */
  public cancel(): void {
    this.room.send("pitch-cancel");
  }

  public destroy(): void {
    this.unsubscribe();
  }
}

function isPitchEvent(value: unknown): value is PitchEvent {
  if (typeof value !== "object" || value === null || !("type" in value)) {
    return false;
  }

  switch (value.type) {
    case "open":
      return true;
    case "refused":
      return "line" in value && typeof value.line === "string";
    case "result":
      return (
        "hired" in value &&
        typeof value.hired === "boolean" &&
        "lines" in value &&
        Array.isArray(value.lines) &&
        value.lines.every((line) => typeof line === "string")
      );
    default:
      return false;
  }
}
