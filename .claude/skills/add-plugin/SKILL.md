---
name: add-plugin
description: Vet and install a Claude Code plugin, skill pack, MCP server or similar third-party agent tool for this project. Use when asked to install, add or try a plugin, marketplace, MCP server or "skill" from the internet.
---

# Add a Claude Code plugin / third-party tool

Plugins, MCP servers and hooks run code on the user's machine with their permissions, so
vet the source before installing anything.

## 1. Identify the exact source

- Check the official marketplace first:
  `claude plugin marketplace list`, then search
  `~/.claude/plugins/marketplaces/claude-plugins-official/.claude-plugin/marketplace.json`.
- If it isn't there, search the web for the **canonical** repository. Watch for:
  - different owners publishing the same name
  - forks
  - near-duplicate package names (e.g. a PyPI package spelled differently from the project)
- **If several sources disagree, stop and ask the user for the exact repo URL.** Never guess.

## 2. Review what it does

Read the plugin's manifest and contents (README, `plugin.json`, hooks, MCP servers, scripts)
and tell the user plainly:

- what it adds (skills, agents, hooks, MCP servers) and roughly how many tokens it costs
- what runs automatically (hooks) and what it can reach (network, files, external APIs)
- extra requirements (Python, Docker, API keys) and whether they're installed here
- whether it overlaps or conflicts with this repo's skills, agents or hooks
  (`update-docs`, `write-tests`, `docs-keeper`, the Stop hook, …)

## 3. Install, with the user's confirmation

- From a marketplace: `/plugin marketplace add <owner/repo>` then
  `/plugin install <name>@<marketplace>`. The user runs these slash commands, or use the
  `claude plugin` CLI if it supports the step.
- Scope: project-wide plugins the team should share go in `.claude/settings.json`; personal
  ones go in user settings.

## 4. Afterwards

- Check it loads (`/plugin`, `/agents`, `/skills`) and doesn't break `npm run check`.
- If it changes how we work, add a line to CLAUDE.md, add it to the README section
  "Working with Claude Code", and add a CHANGELOG entry (use `update-docs`).
