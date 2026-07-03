---
name: recommend
description: Profile the current project and recommend a domain-matched loadout of Claude Code extensions (MCP servers, hooks, settings, skills), then apply the ones the user picks. Use when the user wants to set up, gear up, or optimize Claude Code for this repo, asks "what skills/MCP should I use here", runs /loadout, or opens a fresh project and wants the right tooling configured.
allowed-tools: Read, Glob, Grep, Bash, Edit, Write, AskUserQuestion, WebFetch
---

# Loadout — recommend & apply

Your job: look at THIS project, figure out what it is, and hand the user a short, ranked
**loadout** of Claude Code extensions worth adding — then apply exactly the ones they choose.
You are a recommender and installer, not a list-dumper. Never paste the whole catalog.

## Step 0 — Load the catalog

Read all four files from the plugin's bundled catalog:

- `${CLAUDE_PLUGIN_ROOT}/catalog/mcp.json`
- `${CLAUDE_PLUGIN_ROOT}/catalog/skills.json`
- `${CLAUDE_PLUGIN_ROOT}/catalog/hooks.json`
- `${CLAUDE_PLUGIN_ROOT}/catalog/domains.json`

Each catalog item has an `id`, `name`, `description`, `domains`, and `signals`. MCP items carry a
`config` (an `.mcp.json` server object), hook/setting items carry a `settings` object to merge, and
skill items carry an `install` block.

## Step 1 — Profile the project

Detect what the repo is. Be fast and evidence-based — do not ask the user things you can read:

- **Languages / frameworks / package managers**: look for `package.json` (and its deps — react, next,
  vue, svelte, express, nestjs, prisma…), `requirements.txt`, `pyproject.toml`, `go.mod`, `Cargo.toml`,
  `pom.xml`, `Gemfile`, `pubspec.yaml`, `*.xcodeproj`, `build.gradle`.
- **Infra / CI**: `Dockerfile`, `docker-compose*`, `.github/workflows`, `*.tf`, `k8s`/`helm`.
- **Data/ML**: `*.ipynb`, `numpy`/`pandas`/`torch`/`tensorflow` in deps.
- **Security surface**: auth/payment/crypto libs, presence of `.env`.
- **What's already set up**: read existing `.mcp.json`, `.claude/settings.json`,
  `.claude/settings.local.json`, and any `CLAUDE.md`. **Never recommend something already installed.**

Use Glob/Grep/Read. Keep it to a handful of targeted checks. Summarize the profile in 2–3 lines.

## Step 2 — Match domains and build the loadout

1. Score each domain in `domains.json` by how many of its `signals` appear in the profile. A domain
   whose signal is `"always"` (i.e. `general`) is always in play as the baseline.
2. Pick the 1–2 best-matching domains plus `general`.
3. Union their `loadout` id lists. Rank items by: (a) strength of signal match against the project,
   (b) whether the item is broadly useful (`signals` includes `"always"`), (c) not already installed.
4. Drop anything already present in the repo's config. Cap the recommendation at ~6–8 items so the
   choice stays easy. Note (don't hide) anything you cut for length.

## Step 3 — Present the loadout for selection

Show a tight table first: each recommended item as **name — one-line why it fits _this_ project**,
grouped by kind (MCP / Hooks & settings / Skills). Then call `AskUserQuestion` with
`multiSelect: true` so the user checks what they want. Put the strongest 2–3 picks first and mark the
top one "(Recommended)". Include items that need auth/tokens but label them clearly (e.g.
"needs a Figma token", "OAuth on first use").

If a project signal is ambiguous (e.g. no clear framework), ask one short clarifying question about the
project's domain before recommending — don't guess wildly.

## Step 4 — Apply what they picked

Apply each selected item by its kind. **Always show the exact change and confirm before writing.**
Merge; never overwrite an existing file wholesale. Prefer project scope unless the user says otherwise.

- **MCP items** → merge `config` into `./.mcp.json` under `mcpServers.<id>`. Create the file if absent.
  If the item has `"auth": true` or an `env` placeholder like `<your-...-token>`, tell the user exactly
  which token to fill in and where to get it — write the entry but flag the placeholder.
- **Hook / setting items** → deep-merge `settings` into `./.claude/settings.json` (create if absent).
  For hooks, append to the matching event array rather than replacing it. Surface each item's `note`
  (dependencies like `jq`, or platform caveats) so the user isn't surprised.
- **Skill items**:
  - `install.type: "builtin"` → nothing to install; tell the user the command to run (e.g. `/init`,
    `/code-review`) and what it does.
  - `install.type: "plugin"` → show the `install.commands` (e.g. `/plugin marketplace add …` then
    `/plugin install …`). These are user-run slash commands — present them for the user to run; do not
    fake them.
  - `install.type: "manual"` / `reference` → give the `homepage` link.

After applying, print a short receipt: what was written to which file, what tokens still need filling,
and the exact next commands to run. Remind the user to restart Claude Code (or `/reload-plugins`) so new
MCP servers and plugins load.

## Other agents (Codex, Cursor, opencode, Gemini, OpenClaw)

This skill configures **Claude Code**. MCP servers are portable to other agents; skills and hooks are not.
If the user wants the same MCP servers set up for another agent, tell them to run
`npx claude-loadout --target <codex|cursor|opencode|gemini|openclaw|all>` in the project — or, if asked,
write that agent's config directly from the catalog's MCP `config` fields, using the correct file and shape:
Codex `.codex/config.toml` (`[mcp_servers.NAME]`), Cursor `.cursor/mcp.json` (`mcpServers`), Gemini
`.gemini/settings.json` (`mcpServers`), opencode `opencode.json` (`mcp.NAME`, `type: local`, `command` array,
`environment`), OpenClaw `~/.openclaw/openclaw.json` (`mcp.servers.NAME`). Never write skills/hooks to these.

## Guardrails

- Read config before writing it; produce a minimal, valid merge. If you can't safely merge, show the
  snippet and let the user paste it.
- Every install command you output must come from the catalog's `install`/`config` fields or official
  Claude Code syntax — never invent package names or endpoints.
- Recommend fewer, better. A 6-item loadout the user actually applies beats a 30-item dump they ignore.
