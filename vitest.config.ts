import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Every test starts from a clean slate: no leaked spies, stubs or fake timers.
    restoreMocks: true,
    unstubGlobals: true,
    unstubEnvs: true,

    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          include: ["tests/unit/**/*.test.ts"],
          // Pure logic runs in Node. Files that touch Pixi or the DOM opt in
          // with a `// @vitest-environment happy-dom` docblock.
          environment: "node",
        },
      },
      {
        extends: true,
        test: {
          name: "integration",
          include: ["tests/integration/**/*.test.ts"],
          environment: "node",
          testTimeout: 15_000,
          hookTimeout: 15_000,
        },
      },
    ],

    coverage: {
      provider: "v8",
      include: ["src/**/*.ts", "server/**/*.ts", "shared/**/*.ts"],
      exclude: [
        "src/main.ts",
        "server/index.ts",
        // Type-only modules: nothing to execute.
        "src/domain/**",
        "shared/grid.ts",
      ],
      reporter: ["text-summary", "html", "lcov"],
      // Floors, not targets: raise them as coverage grows, never lower them.
      // Game.ts needs real WebGL, so it is covered by e2e only.
      thresholds: {
        statements: 85,
        branches: 75,
        functions: 85,
        lines: 85,
        "server/**/*.ts": {
          statements: 90,
          branches: 85,
          functions: 90,
          lines: 90,
        },
        "src/game/**/*.ts": {
          statements: 75,
          branches: 65,
          functions: 75,
          lines: 75,
        },
        "src/network/**/*.ts": {
          statements: 90,
          branches: 75,
          functions: 90,
          lines: 90,
        },
        "src/scenes/MainScene.ts": {
          statements: 90,
          branches: 90,
          functions: 80,
          lines: 90,
        },
      },
    },
  },
});
