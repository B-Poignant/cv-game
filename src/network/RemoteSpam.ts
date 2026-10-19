import { Callbacks, type Room } from "@colyseus/sdk";
import type { Container } from "pixi.js";

import type {
  CvRoomState,
  EmailState,
  PlayerState,
} from "../../server/rooms/CvRoomState";
import type { Theme } from "../config/themes";
import { SpamEmail } from "../game/entities/SpamEmail";
import type { IsometricConverter } from "../game/IsometricConverter";

/**
 * The spam hazard as this visitor sees it (F-063): draws the emails the server flies, and
 * reports when the server slows this visitor down (`onSlowedChange`) so the player walks at
 * the same speed the server allows.
 */
export class RemoteSpam {
  private readonly world: Container;
  private readonly converter: IsometricConverter;
  private readonly emails = new Map<string, SpamEmail>();
  private readonly unsubscribers: (() => void)[] = [];

  private theme?: Theme;

  constructor(
    world: Container,
    converter: IsometricConverter,
    room: Room<CvRoomState>,
    onSlowedChange: (slowed: boolean) => void,
  ) {
    this.world = world;
    this.converter = converter;

    const callbacks = Callbacks.get(room);

    this.unsubscribers.push(
      callbacks.onAdd("emails", (email: EmailState, key: string) => {
        this.add(key, email);
        this.unsubscribers.push(
          callbacks.onChange(email, () => {
            this.emails.get(key)?.setGridPosition(email);
          }),
        );
      }),
      callbacks.onRemove("emails", (_email: EmailState, key: string) => {
        this.remove(key);
      }),
      callbacks.onAdd("players", (player: PlayerState, sessionId: string) => {
        if (sessionId !== room.sessionId) {
          return;
        }

        this.unsubscribers.push(
          // Not called with the value on arrival (always false): only for changes.
          callbacks.listen(
            player,
            "slowed",
            (slowed, previous) => {
              if (slowed !== previous) {
                onSlowedChange(slowed);
              }
            },
            false,
          ),
        );
      }),
    );
  }

  /** The emails on screen, by id. */
  public get drawn(): readonly SpamEmail[] {
    return [...this.emails.values()];
  }

  public applyTheme(theme: Theme): void {
    this.theme = theme;

    for (const email of this.emails.values()) {
      email.applyTheme(theme);
    }
  }

  public destroy(): void {
    for (const unsubscribe of this.unsubscribers) {
      unsubscribe();
    }
    this.unsubscribers.length = 0;

    for (const key of [...this.emails.keys()]) {
      this.remove(key);
    }
  }

  private add(key: string, state: EmailState): void {
    const email = new SpamEmail(state.id, this.converter);

    if (this.theme) {
      email.applyTheme(this.theme);
    }

    email.setGridPosition(state);
    this.emails.set(key, email);
    this.world.addChild(email);
  }

  private remove(key: string): void {
    const email = this.emails.get(key);

    if (!email) {
      return;
    }

    this.world.removeChild(email);
    email.destroy();
    this.emails.delete(key);
  }
}
