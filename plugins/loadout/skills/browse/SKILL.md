---
name: browse
description: Browse the Loadout catalog of curated Claude Code extensions by domain (frontend, backend, data/ML, devops, mobile, security, docs) without changing anything. Use when the user wants to see what's available for a given kind of project, or asks "what MCP/skills/hooks exist for X" but isn't ready to install.
allowed-tools: Read, AskUserQuestion
---

# Loadout — browse the catalog

Read-only. Show what's in the catalog for a chosen domain; do not modify any files.

## Steps

1. Read `${CLAUDE_PLUGIN_ROOT}/catalog/domains.json`, `mcp.json`, `skills.json`, and `hooks.json`.
2. If the user named a domain (or a stack that maps to one), use it. Otherwise list the domain
   `title`s from `domains.json` and let the user pick one with `AskUserQuestion`.
3. For the chosen domain, resolve its `loadout` ids into the actual items and print them grouped by
   kind (MCP servers / Hooks & settings / Skills), each as **name — description**, with the `homepage`
   link and any `auth`/`note` caveat.
4. End by pointing the user to `/loadout:recommend` if they want these profiled against their actual
   repo and applied automatically.

Keep it scannable. This is the "read the shelf" mode; `recommend` is the "gear me up" mode.
