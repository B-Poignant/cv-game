import { describe, expect, it } from "vitest";

import { serverEndpoint } from "../../../src/network/serverEndpoint";

const ORIGIN = "https://cv.example.com";

// F-080
describe("serverEndpoint", () => {
  it("uses the local Colyseus server in dev", () => {
    expect(serverEndpoint({ dev: true, origin: "http://localhost:5173" })).toBe(
      "http://localhost:2567",
    );
  });

  it("uses the page's own origin in production", () => {
    expect(serverEndpoint({ dev: false, origin: ORIGIN })).toBe(ORIGIN);
  });

  it.each([true, false])(
    "prefers VITE_SERVER_URL when set (dev: %s)",
    (dev) => {
      expect(
        serverEndpoint({
          override: "https://rooms.example.com",
          dev,
          origin: ORIGIN,
        }),
      ).toBe("https://rooms.example.com");
    },
  );

  it("ignores an empty VITE_SERVER_URL", () => {
    expect(serverEndpoint({ override: "", dev: false, origin: ORIGIN })).toBe(
      ORIGIN,
    );
  });
});
