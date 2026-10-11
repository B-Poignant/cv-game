---
name: release
description: Cut a cv-game release by verifying everything, moving the CHANGELOG's Unreleased section to a version, bumping package.json, and preparing the commit and tag. Use when asked to release, publish a version, bump the version or tag.
---

# Release

The user must explicitly ask for a release. Commits and tags are created only on their
confirmation, and nothing is pushed unless they say so.

## 1. Preconditions

- Run `git status`: changes left lying around must either be part of the release (ask) or stay out.
- Docs are up to date. Run `update-docs` if anything since the last release isn't in
  `CHANGELOG.md` `[Unreleased]`. Feature statuses in `docs/FEATURES.md` must match the code.
- Run the `verify` skill at full depth: `npm run test:all` and `npm run build`, all green.

## 2. Choose the version (SemVer, pre-1.0)

Read `[Unreleased]` and propose a version to the user:

- **minor** (0.x.0): new features (Added)
- **patch** (0.0.x): only fixes or internal changes

## 3. Update files

1. `CHANGELOG.md`: rename `## [Unreleased]` to `## [X.Y.Z] - YYYY-MM-DD` (today's date),
   and add a fresh empty `## [Unreleased]` above it.
2. `npm version X.Y.Z --no-git-tag-version` updates `package.json` and `package-lock.json`.
3. README "Status", if the release changes what's ready.

## 4. Commit and tag (only after the user confirms)

```bash
git add -A && git commit -m "Release vX.Y.Z"   # include the attribution trailer
git tag -a vX.Y.Z -m "vX.Y.Z"
```

Show the CHANGELOG section for this version as the release notes. Don't push; tell the user
the command (`git push --follow-tags`).
