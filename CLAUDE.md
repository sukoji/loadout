# CLAUDE.md — Loadout

**If you are resuming work on this project, read [HANDOFF.md](HANDOFF.md) first.** It has the current
status, the task board, and how to verify the build. This file is the short always-loaded version.

## What this is
A hybrid Claude Code **plugin marketplace + recommender**: profiles a project and *applies* a
domain-matched loadout of MCP servers / hooks / skills. Repo: https://github.com/sukoji/loadout.

## Critical conventions (violating these breaks things)
- **`plugins/loadout/catalog/*.json` is the single source of truth.** The `/loadout:recommend` skill and
  the `cli/` both read it. The catalog lives *inside the plugin* on purpose — installed plugins can't read
  files outside their own dir. Do not move it to the repo root.
- **`docs/domains/*.md` is generated.** Edit the catalog, then `npm run build:docs`. Never hand-edit them.
- **Before every commit:** `npm run validate` (0 warnings) and `npm run build:docs` (docs in sync). CI enforces both.
- **Accuracy > quantity.** Loadout *applies* what it recommends — a wrong install command is worse than
  none. Every catalog `config`/`install` must come from a verifiable source linked in `homepage`.
- Plugin skills are namespaced: the commands are `/loadout:recommend` and `/loadout:browse` (not `/loadout`).

## Quick verify
```bash
node scripts/validate-catalog.mjs && node cli/index.js --dry-run && claude plugin validate ./plugins/loadout
```

## Before you stop
Commit **and push** (push is the only durable state), then update HANDOFF.md §1 (status) and §6 (task board).
