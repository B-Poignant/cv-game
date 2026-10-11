import { describe, expect, it } from "vitest";

import { testPort, useColyseusServer } from "../../helpers/colyseus";

// F-080: the real server exposes the health check next to the rooms.
describe("Colyseus server HTTP", () => {
  useColyseusServer();

  it("answers /health", async () => {
    const response = await fetch(`http://localhost:${testPort()}/health`);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "ok" });
  });
});
