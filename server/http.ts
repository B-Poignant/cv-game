import express from "express";

/**
 * HTTP routes next to the Colyseus WebSocket (F-080): a health check for
 * container hosts, and the built client so one port serves the whole game.
 */
export function configureHttp(
  app: express.Application,
  clientDir: string,
): void {
  app.get("/health", (_request, response) => {
    response.json({ status: "ok" });
  });

  // Missing in dev and tests (Vite serves the client there): requests just 404.
  app.use(express.static(clientDir));
}
