// Stop hook: if code changed but no docs did, ask Claude to update the docs before stopping.
// Wired in .claude/settings.json (hooks.Stop). See the update-docs skill.
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";

const CODE = [/^src\//, /^server\//, /^package\.json$/, /\.config\.ts$/];
const DOCS = ["README.md", "docs/FEATURES.md", "CHANGELOG.md"];

let input = {};
try {
  input = JSON.parse(readFileSync(0, "utf8") || "{}");
} catch {
  // No or invalid input: treat as a normal stop.
}

// Already continuing because of this hook: never block twice (avoids loops).
if (input.stop_hook_active) process.exit(0);

let status = "";
try {
  status = execSync("git status --porcelain --untracked-files=all", {
    encoding: "utf8",
  });
} catch {
  process.exit(0); // Not a git repo or git unavailable: stay silent.
}

const changed = status
  .split("\n")
  .filter(Boolean)
  .map((line) => line.slice(3).replace(/^"|"$/g, "").split(" -> ").pop());

const codeChanged = changed.some((file) => CODE.some((re) => re.test(file)));
const docsChanged = changed.some((file) => DOCS.includes(file));

if (codeChanged && !docsChanged) {
  console.log(
    JSON.stringify({
      decision: "block",
      reason:
        "Code changed but no docs did (README.md, docs/FEATURES.md, CHANGELOG.md). " +
        "Run the update-docs skill, or state in one line why no doc update is needed.",
    }),
  );
}
