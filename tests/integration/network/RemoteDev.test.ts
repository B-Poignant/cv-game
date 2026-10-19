// @vitest-environment happy-dom
import { Container, Text } from "pixi.js";
import { describe, expect, it, vi } from "vitest";

import type { CvRoom } from "../../../server/rooms/CvRoom";
import { THEMES } from "../../../src/config/themes";
import { Dev } from "../../../src/game/entities/Dev";
import { IsometricConverter } from "../../../src/game/IsometricConverter";
import { RemoteDev } from "../../../src/network/RemoteDev";
import { useColyseusServer } from "../../helpers/colyseus";

const converter = new IsometricConverter(64, 32);

// F-060: the real server moves the dev, the client draws him.
describe("RemoteDev", () => {
  const colyseus = useColyseusServer();

  async function joinAsMe() {
    const room = await colyseus().createRoom<CvRoom>("cv", {});
    const me = await colyseus().connectTo(room);
    const world = new Container();
    const remoteDev = new RemoteDev(world, converter, me);

    const devs = () => world.children.filter((child) => child instanceof Dev);

    return { room, me, world, remoteDev, devs };
  }

  it("draws Ben once, where the server says he is", async () => {
    const { me, devs } = await joinAsMe();

    await vi.waitFor(() => expect(devs()).toHaveLength(1));
    const [dev] = devs();
    expect(dev.devName).toBe("Ben");
    expect({ x: dev.x, y: dev.y }).toEqual(
      converter.toScreen({
        column: me.state.dev.column,
        row: me.state.dev.row,
      }),
    );
  });

  it("follows him as he wanders", async () => {
    const { devs } = await joinAsMe();
    await vi.waitFor(() => expect(devs()).toHaveLength(1));
    const [dev] = devs();
    const start = { x: dev.x, y: dev.y };

    await vi.waitFor(() => expect({ x: dev.x, y: dev.y }).not.toEqual(start), {
      timeout: 4000,
    });
  });

  it("applies the theme, also when it was chosen before he appeared", async () => {
    const theme = THEMES[1];
    const room = await colyseus().createRoom<CvRoom>("cv", {});
    const me = await colyseus().connectTo(room);
    const world = new Container();
    const remoteDev = new RemoteDev(world, converter, me);

    remoteDev.applyTheme(theme);

    await vi.waitFor(() => expect(remoteDev.character).toBeDefined());
    const label = remoteDev.character?.children.find(
      (child) => child instanceof Text && child.text === "Ben",
    );
    expect(label).toMatchObject({ style: { fill: theme.label } });
  });

  it("removes him on destroy", async () => {
    const { remoteDev, devs } = await joinAsMe();
    await vi.waitFor(() => expect(devs()).toHaveLength(1));

    remoteDev.destroy();

    expect(devs()).toHaveLength(0);
  });

  // F-062
  it("knows where Ben is, and shows what he says above him", async () => {
    const { me, remoteDev, devs } = await joinAsMe();

    await vi.waitFor(() => expect(devs()).toHaveLength(1));
    remoteDev.say("Bye!");
    remoteDev.update(0.1);

    expect(remoteDev.gridPosition).toEqual({
      column: me.state.dev.column,
      row: me.state.dev.row,
    });
    expect(devs()[0].speech).toBe("Bye!");
  });
});
