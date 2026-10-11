import { defineConfig } from "vite";

/**
 * Production build of the Colyseus server (F-080): `npm run build:server`.
 * Bundles `server/` + `shared/` into one Node file; npm packages stay external.
 */
export default defineConfig({
  publicDir: false,
  build: {
    ssr: "server/index.ts",
    outDir: "build/server",
    emptyOutDir: true,
  },
});
