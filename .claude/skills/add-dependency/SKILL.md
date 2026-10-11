---
name: add-dependency
description: Add, upgrade or remove an npm package in cv-game safely (compatibility, dev vs runtime, docs). Use whenever a task needs a new library or tool, or when asked to install, upgrade or remove a package.
---

# Add / upgrade / remove a dependency

## 1. Is it needed?

- Can the platform, Pixi, Colyseus or code already in the repo do it? Prefer no new dependency.
- Runtime (`dependencies`) only if it ships to the browser or runs on the server.
  Tooling and tests go in `devDependencies` (`-D`).

## 2. Check it before installing

```bash
npm view <pkg> version
npm view <pkg> peerDependencies --json
npm view <pkg> versions --json | tail -5   # to find the line matching our stack
```

- **Match the stack's major/minor lines:** Colyseus packages must match `0.18.x`
  (`@colyseus/*`, `colyseus`), `@vitest/*` must match the installed `vitest` exactly, and so
  on. Pin the line explicitly when needed (`@colyseus/testing@0.18`).
- Look at maintenance (last publish, downloads) and the licence. Be suspicious of
  near-duplicate names (typosquats).
- Native install scripts (npm warns `install-scripts`) need a reason. Mention them to the user.

## 3. Install

```bash
npm install <pkg>@<range>        # or: npm install -D <pkg>@<range>
npm uninstall <pkg>              # removing: also delete its imports/config
```

Never edit `package-lock.json` by hand.

## 4. Verify

Run the `verify` skill at the "dependencies changed" depth: `npm run test:all` and `npm run build`.
If the package is a test or lint tool, make sure CI (`.github/workflows/ci.yml`) still covers it.

## 5. Document

Run `update-docs`:

- README "Tech stack" if it's a notable library
- CLAUDE.md "Stack"/"Commands" if it changes how we work
- `tests/README.md` if it's test tooling
- A CHANGELOG entry
