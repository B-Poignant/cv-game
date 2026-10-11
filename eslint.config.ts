import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import { defineConfig, globalIgnores } from "eslint/config";

/** Engine and server packages that pure layers must never import. */
const RUNTIME_PACKAGES = ["pixi.js", "colyseus", "@colyseus/*"];

export default defineConfig([
  globalIgnores([
    "dist",
    "build",
    "coverage",
    "test-results",
    "playwright-report",
    "blob-report",
  ]),
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts}"],
    plugins: { js },
    extends: ["js/recommended"],
    languageOptions: { globals: globals.browser },
  },
  {
    // Code that runs in Node, not the browser.
    files: [
      "server/**",
      ".claude/hooks/**",
      "*.config.ts",
      "tests/helpers/colyseus.ts",
    ],
    languageOptions: { globals: globals.node },
  },
  tseslint.configs.strictTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // `${count} tiles` is fine; objects and undefined still are not.
      "@typescript-eslint/restrict-template-expressions": [
        "error",
        { allowNumber: true },
      ],
      // `() => doSomething()` callbacks are idiomatic for listeners.
      "@typescript-eslint/no-confusing-void-expression": [
        "error",
        { ignoreArrowShorthand: true },
      ],
    },
  },
  {
    // Plain JS (hooks) is outside tsconfig, so it can't be type-checked.
    files: ["**/*.{js,mjs,cjs}"],
    extends: [tseslint.configs.disableTypeChecked],
  },
  {
    files: ["tests/**"],
    rules: {
      // Tests may assert that a value exists (`find(...)!`): a wrong guess fails the test.
      "@typescript-eslint/no-non-null-assertion": "off",
      // Asymmetric matchers (`expect.closeTo`, `expect.any`) are typed `any`.
      "@typescript-eslint/no-unsafe-assignment": "off",
    },
  },

  // Layer boundaries (docs/ARCHITECTURE.md › "Layers").
  {
    files: ["shared/**"],
    rules: {
      "@typescript-eslint/no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: RUNTIME_PACKAGES,
              message: "shared/ runs on both sides: no Pixi or Colyseus.",
            },
            {
              regex: "^\\.\\./",
              message: "shared/ must not import from src/ or server/.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/domain/**"],
    rules: {
      "@typescript-eslint/no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: RUNTIME_PACKAGES,
              message: "domain/ is plain data: no Pixi or Colyseus.",
            },
            {
              regex: "^\\.\\./(?!\\.\\./shared/)",
              message: "domain/ may only import domain/ and shared/.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/**"],
    ignores: ["src/domain/**"],
    rules: {
      "@typescript-eslint/no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              regex: "(^|/)server/",
              allowTypeImports: true,
              message:
                "Import server code with `import type` only, so it stays out of the browser bundle.",
            },
            {
              group: ["colyseus"],
              message: "The client uses @colyseus/sdk, not the server package.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["server/**"],
    rules: {
      "@typescript-eslint/no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["pixi.js"],
              message: "The server has no renderer.",
            },
            {
              regex: "(^|/)src/",
              message: "The server may only share code through shared/.",
            },
          ],
        },
      ],
    },
  },
]);
