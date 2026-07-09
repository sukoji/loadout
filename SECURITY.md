# Security & trust model

Loadout writes agent **config files** (`.mcp.json`, `.claude/settings.json`, and the equivalent for other
agents). It does **not** execute those tools itself — your agent does, on its next run. Understanding what
Loadout will and won't apply on your behalf is the core of its security model.

## Three tiers, three trust levels

| Tier | Source | Trust | What Loadout does |
| :-- | :-- | :-- | :-- |
| **Curated** | Hand-written, in this repo (`catalog/mcp.json`, `hooks.json`, `skills.json`) | Trusted — human-reviewed, every npx MCP verified to resolve on npm | **Auto-applied** to config on `--all` / `apply` |
| **Official** | Anthropic's official plugin marketplace (`ecosystem.json`, ingested) | Vetted by Anthropic | Surfaced by relevance; installed by **you** via `/plugin install` — never auto-written |
| **Community** | `catalog/community.json` (e.g. caveman) | **Unverified** | Shown only with `--discover`, labeled unverified, and **never auto-applied** — you review and install manually |

## What "auto-apply" means (and its trust assumption)

Curated **hooks are shell commands by design** — e.g. a formatter (`prettier`, `ruff`), a secret-file guard,
or a "block push to main" check. When you run `loadout apply`, curated hook entries are merged into
`.claude/settings.json` and your agent runs them on the matching events.

This means the curated catalog is **trusted content**, exactly like the code of any package you install. The
protection is that it is small, hand-written, version-controlled, and reviewable in this repo — not that the
commands are sandboxed. **Read `catalog/hooks.json` before applying if you want to see every command that can
land in your settings.** No untrusted or user-supplied input is ever interpolated into a hook command.

## Hardening in place

- **Community items never auto-apply.** They require `--discover` and a manual install step.
- **Config values are escaped** when written (JSON via `JSON.stringify`; TOML via quote/backslash escaping),
  and catalog `id`s are validated to `^[A-Za-z0-9._-]+$` so they can't break a TOML section header or object key.
- **Applies are idempotent** — re-applying the same loadout does not duplicate hook entries.
- **The official-marketplace ingest** (`scripts/ingest-official.mjs`) fetches over HTTPS with a timeout, rejects
  HTML error pages, and validates JSON; its output (`ecosystem.json`) is committed and reviewable, and entries
  install via `/plugin` rather than being written to config.

## Reporting a vulnerability

Open a private security advisory on the GitHub repository, or email the maintainer. Please do not file a public
issue for anything exploitable.
