import { ColyseusTestServer } from "@colyseus/testing";
import { afterAll, afterEach, beforeAll, beforeEach, vi } from "vitest";

import server from "../../server/app.config";

/**
 * One port per Vitest worker, so integration files can run in parallel
 * without fighting over a socket (and never on the dev port 2567).
 */
export function testPort(): number {
  return 3000 + Number(process.env.VITEST_POOL_ID ?? 0);
}

/**
 * Boots the real Colyseus server once per test file and disposes rooms
 * between tests. Call at the top level of a `describe` block.
 *
 * Rooms are created with the spam hazard off (F-063), so random emails can't slow a test's
 * moves down: a test about spam turns it on with `vi.stubEnv("SPAM_FLIES", "true")`.
 */
export function useColyseusServer(): () => ColyseusTestServer {
  let colyseus: ColyseusTestServer | undefined;

  beforeAll(async () => {
    // Not `boot(server, port)`: @colyseus/testing 0.18 ignores the port when
    // given a Server instance and always listens on 2568.
    await server.listen(testPort());
    colyseus = new ColyseusTestServer(server);
  });

  beforeEach(() => {
    vi.stubEnv("SPAM_FLIES", "false");
  });

  afterEach(async () => {
    await colyseus?.cleanup();
  });

  afterAll(async () => {
    await colyseus?.shutdown();
  });

  return () => {
    if (!colyseus) {
      throw new Error("Colyseus test server is not booted yet");
    }

    return colyseus;
  };
}
