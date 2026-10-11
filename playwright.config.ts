import { defineConfig, devices } from "@playwright/test";

const CI = Boolean(process.env.CI);

// E2E gets its own ports, so it never reuses a dev server (npm run dev / npm run server)
// that may be running older code, and those can stay up during a test run.
const SERVER_PORT = 2577;
const CLIENT_PORT = 5183;

export default defineConfig({
  testDir: "tests/e2e",
  testMatch: "**/*.spec.ts",
  // All specs share one Colyseus server and room: run them one at a time, or visitors from
  // one test show up in another and the room fills up.
  fullyParallel: false,
  workers: 1,
  forbidOnly: CI,
  retries: CI ? 1 : 0,
  reporter: CI ? [["github"], ["html", { open: "never" }]] : "list",

  use: {
    baseURL: `http://localhost:${CLIENT_PORT}`,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },

  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],

  // Starts the real game: Colyseus and Vite, the client pointed at that Colyseus. A server
  // left on these ports by an interrupted run makes Playwright stop with "port already used":
  // stop it rather than test against it.
  webServer: [
    {
      command: "npm run server",
      port: SERVER_PORT,
      reuseExistingServer: false,
      // The dev stands still, so a canvas only changes when a visitor moves (F-060).
      env: { PORT: String(SERVER_PORT), DEV_WANDERS: "false" },
    },
    {
      command: `npm run dev -- --port ${CLIENT_PORT} --strictPort`,
      url: `http://localhost:${CLIENT_PORT}`,
      reuseExistingServer: false,
      env: { VITE_SERVER_URL: `http://localhost:${SERVER_PORT}` },
    },
  ],
});
