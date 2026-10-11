import { mkdtemp, rm, writeFile } from "node:fs/promises";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import path from "node:path";

import express from "express";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { configureHttp } from "../../../server/http";

// F-080
describe("configureHttp", () => {
  let clientDir: string;
  let server: Server;
  let baseUrl: string;

  beforeAll(async () => {
    clientDir = await mkdtemp(path.join(tmpdir(), "cv-game-client-"));
    await writeFile(
      path.join(clientDir, "index.html"),
      "<title>cv-game</title>",
    );

    const app = express();
    configureHttp(app, clientDir);
    server = app.listen(0);
    await new Promise<void>((resolve) => server.once("listening", resolve));
    baseUrl = `http://localhost:${(server.address() as AddressInfo).port}`;
  });

  afterAll(async () => {
    await new Promise((resolve) => server.close(resolve));
    await rm(clientDir, { recursive: true, force: true });
  });

  it("answers the health check", async () => {
    const response = await fetch(`${baseUrl}/health`);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "ok" });
  });

  it("serves the built client at /", async () => {
    const response = await fetch(`${baseUrl}/`);

    expect(response.status).toBe(200);
    expect(await response.text()).toContain("<title>cv-game</title>");
  });

  it("returns 404 for files that are not in the build", async () => {
    const response = await fetch(`${baseUrl}/missing.js`);

    expect(response.status).toBe(404);
  });
});
