import type { CvSectionId } from "../domain/Cv";
import type {
  MinigameDefinition,
  MinigameResult,
} from "../game/minigames/Minigame";

/** What the flow needs from the map scene (`MainScene`). */
export interface MinigameHost {
  visible: boolean;
  setPaused(paused: boolean): void;
  minigameEnded(section: CvSectionId, result: MinigameResult): void;
}

/** What the flow needs from the scene that runs minigames (`MinigameScene`). */
export interface MinigamePlayer {
  readonly isRunning: boolean;
  play(definition: MinigameDefinition): Promise<MinigameResult>;
}

/** Where the CV panel opens (`CvPanel`). */
export interface SectionOpener {
  open(section: CvSectionId): void;
}

/** Where the result is posted (`ChatLog`). */
export interface MessagePoster {
  post(message: { text: string }): void;
}

export type MinigameRegistry = Partial<Record<CvSectionId, MinigameDefinition>>;

/**
 * A building's minigame from start to finish (F-070): hides and pauses the map, plays,
 * posts the result, lets the map claim the card on a win, then opens the section's CV panel
 * (win or lose, so everyone reads the CV). The panel resumes the map when it closes.
 */
export class MinigameFlow {
  private readonly host: MinigameHost;
  private readonly player: MinigamePlayer;
  private readonly minigames: MinigameRegistry;
  private readonly panel: SectionOpener;
  private readonly chat: MessagePoster;

  constructor(
    host: MinigameHost,
    player: MinigamePlayer,
    minigames: MinigameRegistry,
    panel: SectionOpener,
    chat: MessagePoster,
  ) {
    this.host = host;
    this.player = player;
    this.minigames = minigames;
    this.panel = panel;
    this.chat = chat;
  }

  public hasMinigame(section: CvSectionId): boolean {
    return this.minigames[section] !== undefined;
  }

  public async start(section: CvSectionId): Promise<void> {
    const definition = this.minigames[section];

    if (!definition || this.player.isRunning) {
      return;
    }

    this.host.setPaused(true);
    this.host.visible = false;

    const result = await this.player.play(definition);

    this.host.visible = true;
    this.chat.post({
      text: result.won
        ? `${definition.title}: you won!`
        : `${definition.title}: not this time. The answers are in the CV.`,
    });
    this.host.minigameEnded(section, result);
    this.panel.open(section);
  }
}
