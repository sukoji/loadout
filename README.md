<div align="center">

# 🎯 Loadout

### Gear up Claude Code for *your* project — in one command.

**Loadout profiles your repo, recommends a domain-matched set of skills, MCP servers, and hooks, and applies the ones you pick.**
Not another 500-item list you have to read. A loadout you *apply*.

[English](README.md) · [한국어](README.ko.md)

![status](https://img.shields.io/badge/status-alpha-orange)
![license](https://img.shields.io/badge/license-MIT-blue)
![claude code](https://img.shields.io/badge/for-Claude%20Code-8A2BE2)
![zero deps](https://img.shields.io/badge/CLI-zero%20dependencies-green)

</div>

---

## The problem

The Claude Code ecosystem has thousands of skills, MCP servers, hooks, and plugins — spread across dozens of
"awesome" lists. But every one of them is a **discovery list**: you read hundreds of entries and guess which
apply to you. As the community put it, *"the trap with awesome-lists is treating them as install lists — they're
discovery lists."*

Nobody asked the obvious question: **given *my* project, what should I actually install — and can you just do it for me?**

That's Loadout.

## What it does

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
```

Zero dependencies, ~1s, nothing to install globally.

## Why this is different

| Everyone else | Loadout |
| :-- | :-- |
| A flat list you read and filter yourself | Profiles *your* repo and recommends for it |
| "Here are 500 things" | "Here are the 6 things *you* need, and why" |
| Copy-paste install commands by hand | Writes `.mcp.json` / `settings.json` for you |
| Discovery only | Discovery **+ apply**, in one step |

It's also a **plugin marketplace** and a **browsable catalog** — so discovery, recommendation, and install all
live in one place.

## Domains

Loadout organizes its curated catalog by the kind of project you're working on:

| Domain | For |
| :-- | :-- |
| [Frontend / Web UI](docs/domains/frontend.md) | React, Vue, Svelte, Next — anything in a browser |
| [Backend / API](docs/domains/backend-api.md) | Servers, APIs, databases |
| [Data / ML / Notebooks](docs/domains/data-ml.md) | Python data work, training, analysis |
| [DevOps / Infra](docs/domains/devops.md) | CI/CD, Docker, Terraform, Kubernetes |
| [Mobile](docs/domains/mobile.md) | iOS, Android, React Native, Flutter |
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

- [ ] Publish `claude-loadout` to npm for `npx`
- [ ] More domains (game dev, embedded, browser extensions, Rust systems)
- [ ] Community-voted relevance signals
- [ ] `loadout doctor` — audit an existing setup and suggest what's missing
- [ ] Team loadouts — share a project loadout via a single file

## License

MIT © sukoji. The catalog links to third-party tools owned by their respective authors; Loadout only curates
and configures them.
