import { Client } from "@colyseus/sdk";
import type { Room } from "@colyseus/sdk";

import type { CvRoomState } from "../../server/rooms/CvRoomState";
import type { RecruiterIdentity } from "../../shared/recruiters";
import { serverEndpoint } from "./serverEndpoint";

export class MultiplayerClient {
  private readonly client: Client;
  private room?: Room<CvRoomState>;

  constructor(
    endpoint = serverEndpoint({
      override: import.meta.env.VITE_SERVER_URL,
      dev: import.meta.env.DEV,
      origin: window.location.origin,
    }),
  ) {
    this.client = new Client(endpoint);
  }

  /** Joins the shared room as `identity` (F-012). The server validates it. */
  public async connect(identity?: RecruiterIdentity): Promise<void> {
    if (this.room) {
      return;
    }

    try {
      const room = await this.client.joinOrCreate<CvRoomState>("cv", identity);

      this.room = room;

      console.log("[MULTIPLAYER] Connected", {
        roomId: room.roomId,
        sessionId: room.sessionId,
      });

      room.onLeave((code) => {
        console.warn("[MULTIPLAYER] Room left", {
          roomId: room.roomId,
          sessionId: room.sessionId,
          code,
        });

        if (this.room === room) {
          this.room = undefined;
        }
      });

      room.onError((code, message) => {
        console.error("[MULTIPLAYER] Room error", {
          roomId: room.roomId,
          sessionId: room.sessionId,
          code,
          message,
        });
      });
    } catch (error) {
      console.error("[MULTIPLAYER] Unable to connect", error);

      throw error;
    }
  }

  public isConnected(): boolean {
    return this.room !== undefined;
  }

  public getRoom(): Room<CvRoomState> {
    if (!this.room) {
      throw new Error("Multiplayer client is not connected");
    }

    return this.room;
  }

  public async disconnect(): Promise<void> {
    if (!this.room) {
      return;
    }

    const room = this.room;

    this.room = undefined;

    console.log("[MULTIPLAYER] Disconnecting", {
      roomId: room.roomId,
      sessionId: room.sessionId,
    });

    await room.leave();

    console.log("[MULTIPLAYER] Disconnected", {
      roomId: room.roomId,
      sessionId: room.sessionId,
    });
  }
}
