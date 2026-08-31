---
name: browse
description: Browse the Loadout catalog of curated Codex and Claude Code extensions by project domain without changing files. Use when the user asks what MCP servers, hooks, or skills exist for a stack but is not ready to install.
allowed-tools: Read, AskUserQuestion
---

# Loadout — browse the catalog

Read-only. Show what's in the catalog for a chosen domain; do not modify any files.

## Steps

1. Resolve the plugin root from `PLUGIN_ROOT`, `CLAUDE_PLUGIN_ROOT`, or two levels above this `SKILL.md`,
   then read its `catalog/domains.json`, `mcp.json`, `skills.json`, and `hooks.json`.
2. If the user named a domain (or a stack that maps to one), use it. Otherwise list the domain
   `title`s from `domains.json` and use the host's available user-input UI. If none is available, ask with
   a compact numbered list.
3. For the chosen domain, resolve its `loadout` ids into the actual items and print them grouped by
   kind (MCP servers / Hooks & settings / Skills), each as **name — description**, with the `homepage`
   link and any `auth`/`note` caveat.
4. End by pointing the user to `$recommend` in Codex or `/loadout:recommend` in Claude Code if they want
   these profiled against their repo and applied. Note that catalog skill install commands are Claude-specific
   unless explicitly marked otherwise. Mention that **token-saver** skills (e.g. caveman) are not in browse —
   `/loadout:recommend` asks about those separately after the stack loadout.

Keep it scannable. This is the "read the shelf" mode; `recommend` is the "gear me up" mode.
