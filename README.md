<div align="center">

<img src="assets/banner.svg" alt="Loadout — gear up Claude Code for your project in one command" width="100%">

<br/>

### Loadout looks at your project and sets up Claude Code for it — automatically.

It figures out which **MCP servers, hooks, and skills** actually fit your stack, shows you a short
ranked list with a reason for each, and **installs the ones you pick** — writing the config for you.
One command instead of reading a 500-item "awesome" list and copy-pasting install commands by hand.

**Works across agents:** full setup for Claude Code, and MCP servers for **Codex, Cursor, opencode, Gemini CLI & OpenClaw** too.

[English](README.md) · [한국어](README.ko.md)

![status](https://img.shields.io/badge/status-alpha-orange)
![license](https://img.shields.io/badge/license-MIT-blue)
![claude code](https://img.shields.io/badge/for-Claude%20Code-8A2BE2)
![zero deps](https://img.shields.io/badge/CLI-zero%20dependencies-green)

</div>

---

> **In one line:** point it at a repo → it recommends the right Claude Code extensions for that repo → it applies them.

## The problem

The Claude Code ecosystem has thousands of skills, MCP servers, hooks, and plugins — spread across dozens of
"awesome" lists. But every one of them is a **discovery list**: you read hundreds of entries and guess which
apply to you. As the community put it, *"the trap with awesome-lists is treating them as install lists — they're
discovery lists."*

Nobody asked the obvious question: **given *my* project, what should I actually install — and can you just do it for me?**

That's Loadout.

## What it does

<p align="center"><img src="assets/demo.svg" alt="Loadout in action: detect the stack, recommend a loadout, pick, and apply to .mcp.json + settings.json" width="92%"></p>

```text
$ npx claude-loadout

🎯 Loadout  — gearing up Claude Code for this project

Detected: package.json, next, react, tailwind, prettier, playwright
Best-fit domains: Frontend / Web UI, General / Any project

Recommended loadout:

 1  Playwright (browser automation)  [MCP server]
     Drive a real browser — navigate, click, assert, screenshot — via accessibility snapshots.
     why: matches react, next, playwright

 2  Auto-format JS/TS on edit (Prettier)  [Hook/setting]
     After Claude edits a file, run Prettier on it so the diff is always clean.
     why: matches package.json, prettier, react

 3  Context7 (up-to-date docs)  [MCP server]
     Pulls version-accurate docs for thousands of libraries into context — kills hallucinated APIs.
     ...

Install which? numbers e.g. 1,3,4  ·  'a' = all  ·  Enter = skip: 1,2,3

✅ Applied:
  .mcp.json          + playwright, context7
  .claude/settings.json + format-js-on-edit
```

It **scans** your project (languages, frameworks, CI, existing config), **matches** it to one or more domains,
**ranks** a short loadout with a one-line *why* for each item, lets you **pick**, and **writes** the config
for you — merging into `.mcp.json` and `.claude/settings.json`, never clobbering, and flagging any tokens you
still need to fill in.

## Two ways to use it

### 1. Inside Claude Code (recommended)

Add the marketplace once, then the recommender is a slash command:

```text
/plugin marketplace add sukoji/loadout
/plugin install loadout@loadout

/loadout:recommend     # profile this repo, recommend a loadout, and apply what you pick
/loadout:browse        # just browse the catalog by domain, no changes
```

`/loadout:recommend` reads your repo the way a human would, then uses `AskUserQuestion` to let you check the
items you want — and applies them in place.

### 2. As a standalone CLI

```bash
cd your-project
npx claude-loadout            # interactive
npx claude-loadout --dry-run  # just show the recommendation
npx claude-loadout --all      # apply the whole recommended loadout
npx claude-loadout doctor     # audit tokens, hook deps, security gaps (read-only)
npx claude-loadout --help     # full flag list
```

Zero dependencies, ~1s for scan/recommend, nothing to install globally.

### CLI flags

| Flag | What it does |
| :-- | :-- |
| *(none)* | Interactive — pick items by number |
| `--dry-run` / `-d` | Show recommendations only; write nothing |
| `--all` / `-a` / `-y` | Apply the top recommendations without prompting |
| `--discover` | Also surface **unverified** community skills |
| `--target <id>` | Write MCP config for `cursor`, `codex`, `gemini`, `opencode`, `openclaw`, or `all` |
| `--list-targets` | List agents and config file paths |
| `doctor` | Read-only audit: unfilled tokens, missing hook tools, `.env` guard, suggested gaps |

**Non-interactive shells** (CI, pipes): use `--dry-run` or `--all` — otherwise Loadout prints recommendations and exits without hanging on input.

### What auto-applies vs what you do

| Kind | Loadout writes it? | You still need to… |
| :-- | :-- | :-- |
| MCP servers | ✅ merges into `.mcp.json` (or agent MCP file) | Fill API keys; OAuth on first use for hosted servers |
| Hooks & settings | ✅ merges into `.claude/settings.json` | Install hook deps (`jq`, `ruff`, …); on Windows use Git Bash/WSL for shell hooks |
| Built-in skills (`/init`, `/code-review`) | ❌ already in Claude Code | Run the slash command when you want it |
| Marketplace plugins (Exa, Superpowers, …) | ❌ prints `/plugin install …` | Run those commands in Claude Code |

Run `npx claude-loadout doctor` anytime to see unfilled placeholders and missing PATH tools.

## Works with your agent — not just Claude Code

MCP servers are portable across today's agents; only the config file and format differ. Loadout writes
the right one for each. Skills and hooks are Claude Code-native, so for other agents Loadout applies the
MCP servers and tells you what's Claude-only.

```bash
npx claude-loadout --target codex        # writes ~/.codex-style .codex/config.toml
npx claude-loadout --target cursor        # writes .cursor/mcp.json
npx claude-loadout --target claude,cursor # apply to several at once
npx claude-loadout --target all           # every supported agent
npx claude-loadout --list-targets         # see them all
```

| Target (`--target`) | Agent | Config file | MCP format |
| :-- | :-- | :-- | :-- |
| `claude` *(default)* | Claude Code | `.mcp.json` + `.claude/settings.json` | `mcpServers` + skills/hooks |
| `cursor` | Cursor | `.cursor/mcp.json` | `mcpServers` |
| `gemini` | Gemini CLI | `.gemini/settings.json` | `mcpServers` |
| `opencode` | opencode | `opencode.json` | `mcp` (`type: local`) |
| `codex` | Codex CLI | `.codex/config.toml` | `[mcp_servers.*]` (TOML) |
| `openclaw` | OpenClaw | `~/.openclaw/openclaw.json` | `mcp.servers` |

If you don't pass `--target`, Loadout targets Claude Code and points out any other agents it detects in the project.

## Why this is different

| Everyone else | Loadout |
| :-- | :-- |
| A flat list you read and filter yourself | Profiles *your* repo and recommends for it |
| "Here are 500 things" | "Here are the 6 things *you* need, and why" |
| Copy-paste install commands by hand | Writes `.mcp.json` / `settings.json` for you |
| Discovery only | Discovery **+ apply**, in one step |

It's also a **plugin marketplace** and a **browsable catalog** — so discovery, recommendation, and install all
live in one place.

## Coverage — three tiers (not just a fixed list)

Loadout pulls from three tiers, so it reaches the whole ecosystem without ever blindly applying something unvetted:

- **Curated (37)** — hand-verified MCP servers, hooks & skills. Safe to auto-apply; every npx package is checked to resolve on npm (`npm run verify:mcp`) and smoke-started in release checks (`npm run test:mcps`).
- **Official marketplace (~240)** — Anthropic's official plugin directory, ingested automatically. Surfaced when they match your stack, installed via `/plugin`.
- **Community (`--discover`)** — well-known community skills like [caveman](https://github.com/JuliusBrussee/caveman) (token saver). Shown only when you ask, labeled **⚠ unverified**, and **never auto-applied**.

```bash
npx claude-loadout            # curated + matching official plugins
npx claude-loadout --discover # also surface community skills (review before installing)
```

## Domains

Loadout organizes its curated catalog by the kind of project you're working on:

| Domain | For |
| :-- | :-- |
| [Frontend / Web UI](docs/domains/frontend.md) | React, Vue, Svelte, Next — anything in a browser |
| [Backend / API](docs/domains/backend-api.md) | Servers, APIs, databases |
| [Data / ML / Notebooks](docs/domains/data-ml.md) | Python data work, training, analysis |
| [Research / Academic](docs/domains/research.md) | Literature review, notebooks, papers, experiments |
| [DevOps / Infra](docs/domains/devops.md) | CI/CD, Docker, Terraform, Kubernetes |
| [Mobile](docs/domains/mobile.md) | iOS, Android, React Native, Flutter |
| [Game Development](docs/domains/game-dev.md) | Godot, Unity, Unreal |
| [Security-sensitive](docs/domains/security.md) | Auth, payments, PII |
| [Docs / Writing / Office](docs/domains/docs-writing.md) | Docs and real Word/Excel/PDF/PPT deliverables |
| [General / Any project](docs/domains/general.md) | The always-useful baseline |

Full browsable index: [docs/domains/](docs/domains/README.md).

## How it works

```
your repo ──▶ scan (signals) ──▶ match domains ──▶ rank loadout ──▶ you pick ──▶ apply
             package.json,        frontend +        by signal        multi-      .mcp.json
             requirements.txt,    general           strength         select      .claude/settings.json
             Dockerfile, .env…                                                    + install commands
```

- **Catalog** (`plugins/loadout/catalog/*.json`) is the single source of truth — MCP servers, skills, and
  hooks, each tagged with the domains and signals it fits. Both the skill and the CLI read the same data.
- **Recommender** scores every domain by how many of its signals appear in your project, unions the top
  domains' loadouts, drops anything you already have, and ranks the rest.
- **Apply** deep-merges into your config. Hooks append to the right event arrays; MCP servers land under
  `mcpServers`; skills print the exact `/plugin` or built-in commands to run.

## Contributing a catalog entry

The catalog is meant to grow with the community. Add an entry to the relevant file in
`plugins/loadout/catalog/`, tag it with `domains` and `signals`, run the checks, and open a PR:

```bash
npm run validate     # catalog integrity: unique ids, required fields, domain references
npm run build:docs   # regenerate docs/domains/ from the catalog
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for the entry schema.

## Roadmap

- [x] Publish `claude-loadout` to npm for `npx`
- [x] `loadout doctor` — audit an existing setup and suggest what's missing
- [ ] More domains (game dev, embedded, browser extensions, Rust systems)
- [ ] Community-voted relevance signals
- [ ] Team loadouts — share a project loadout via a single file

## License

MIT © sukoji. The catalog links to third-party tools owned by their respective authors; Loadout only curates
and configures them.
