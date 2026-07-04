# Changelog

All notable changes to Loadout are documented here. Format loosely follows
[Keep a Changelog](https://keepachangelog.com/); versions follow [SemVer](https://semver.org/).

## [Unreleased]
- See [LOOP.md](LOOP.md).

## [0.3.51] — 2026-07-04
### Added
- **`--hooks-only`** — filter for `apply --suggestions`, `apply --ids`, and `doctor --fix` (hooks/settings only; mirrors `--mcp-only`).
- Doctor JSON **`fixCommandHooksOnly`** / **`applyCommandHooksOnly`**.

## [0.3.50] — 2026-07-04
### Fixed
- **`detectInstalled`** — treats existing `CLAUDE.md` (or `.claude/CLAUDE.md`) as `/init` already done, so `init-claude-md` is not re-suggested.

## [0.3.49] — 2026-07-04
### Added
- **`doctor --fix` skill install guide** — prints exact Claude Code commands/notes for remaining skills (never auto-written).
- Doctor JSON **`skills`** array with `commands` / `note` / `homepage` for each skill suggestion.

## [0.3.48] — 2026-07-04
### Fixed
- **`protect-secrets`** — now in the general loadout (still `.env`-gated), so frontend/mobile/etc. repos with credentials get it even when the security domain isn't top-ranked.
- **`doctor --fix`** — prioritizes catalog ids attached to fix/warn findings (e.g. missing `protect-secrets`).

### Changed
- **Ranking** — narrow, fully-matched signals (≤2) get a precision boost so surgical hooks aren't buried by broad multi-signal items.

## [0.3.47] — 2026-07-04
### Added
- **`doctor --fix`** — apply auto-writable suggestions (MCP + hooks) in one command; skills stay manual.
- **`doctor --fix --mcp-only`** / **`--dry-run`** / **`--json`** — scoped fix, preview, and machine-readable receipts.
- Doctor JSON **`fixCommand`** / **`fixCommandMcpOnly`** fields.

## [0.3.46] — 2026-07-04
### Changed
- **Recommend** — domain-loadout items with specific signals (e.g. `protect-secrets` → `.env`) are skipped unless a signal matches.
- **`protect-secrets`** — no longer tagged `always`; only surfaces when `.env` is present.

## [0.3.45] — 2026-07-04
### Added
- **Dogfood** — `guard-dangerous-bash` and `block-push-to-main` hooks in project settings.

## [0.3.44] — 2026-07-04
### Added
- **Dogfood** — Prettier + ESLint-on-edit hooks in `.claude/settings.json`.

### Changed
- **`doctor`** — missing hook PATH tools (`jq`, `prettier`, …) are warnings, not hard fixes (hooks no-op).

## [0.3.43] — 2026-07-04
### Added
- **Dogfood** — this repo now ships a project `.mcp.json` (context7, git, playwright, github, filesystem).

### Changed
- **`doctor` tip** — prefers `--mcp-only` only when MCP suggestions remain.
- Ranking regression tests use an isolated root so a dogfooded `.mcp.json` cannot hide recommendations.

## [0.3.42] — 2026-07-04
### Added
- **`.github/workflows/loadout-doctor.yml`** — dogfoods `doctor --json` on this repo (artifact upload).

## [0.3.41] — 2026-07-04
### Added
- **`examples/ci-doctor.yml`** — copy-paste GitHub Actions job for `doctor --json` (+ optional apply).

## [0.3.40] — 2026-07-04
### Added
- **`doctor --json`** — `applyCommand`, `applyCommandMcpOnly`, and `applyCommandIds` ready-to-run strings for CI.

## [0.3.39] — 2026-07-04
### Added
- **`apply --suggestions --mcp-only`** — apply only MCP server suggestions (skip skills/hooks).
- **`apply --suggestions --limit N`** — cap how many suggestions to apply (default 5).

## [0.3.38] — 2026-07-04
### Added
- **`apply --suggestions`** — apply the top recommendations for the current repo in one non-interactive step.

## [0.3.37] — 2026-07-04
### Added
- **`doctor`** — prints a ready-to-run `apply --ids …` tip when suggestions exist.
- README CI recipe for `doctor --json` → `apply --ids`.

## [0.3.36] — 2026-07-04
### Added
- **`apply --ids id1,id2`** — apply specific catalog items without a manifest file (pairs with `doctor --json` suggestions).

## [0.3.35] — 2026-07-04
### Added
- **`doctor --json`** — `suggestions` array with top recommended item ids/reasons for automation.

## [0.3.34] — 2026-07-04
### Added
- **`search --limit N`** — cap search results (default 20).
- **Catalog validate** — warns when curated MCP/skills lack a `homepage`.

## [0.3.33] — 2026-07-04
### Added
- **`stats` / `stats --json`** — catalog overview (domains, tiers, types, version).

## [0.3.32] — 2026-07-04
### Added
- **`doctor --json`** — structured `domains` and `signals` arrays for CI/profile tooling.
- **`doctor`** — prints detected project signals alongside matched domains.

## [0.3.31] — 2026-07-04
### Added
- **`search --type mcp|skill|hook`** — filter catalog search by item type.
- **`doctor`** — reports matched project domains (e.g. Frontend, Research).

### Changed
- Search logic lives in `cli/lib/search.mjs` (shared by CLI and tests).

## [0.3.30] — 2026-07-04
### Added
- **`search <query>` / `search <query> --json`** — search the catalog by id, name, description, signals, or domains.

## [0.3.29] — 2026-07-04
### Added
- **`domains <id>`** — show one domain's loadout items (with `--json`).
- **`show`** — suggests similar catalog ids when the id is unknown.

## [0.3.28] — 2026-07-04
### Added
- **`show <id>` / `show <id> --json`** — inspect one catalog entry (config, install commands, homepage).

## [0.3.27] — 2026-07-04
### Added
- **`domains` / `domains --json`** — list catalog domains, signal hints, and loadout sizes.
- **`test:domains`** — asserts all 10 domains are present with non-empty loadouts.

## [0.3.26] — 2026-07-04
### Added
- **Scan** — docs (`.docx`/`.xlsx`, Docusaurus, `docs/`) and security (`auth`/`jwt`/`oauth` from auth packages).
- **`test:recommend` / `test:scan`** — docs-writing and security-domain fixtures.

### Changed
- docs-writing domain signals use `.docx` / `.xlsx` (not bare `*.md`, which would match every README).

## [0.3.25] — 2026-07-04
### Added
- **Scan** — Helm (`Chart.yaml`), Ansible (`ansible.cfg`), Kubernetes dirs (`k8s/`, `kubernetes/`, …).
- **`test:recommend` / `test:scan`** — DevOps ranking and infra file fixtures.

## [0.3.24] — 2026-07-04
### Changed
- **Ranking** — items from the signal-matched domain outrank general always-on defaults when scores are otherwise equal.
- **`prepublishOnly`** — `npm publish` runs `npm test` first so a failing suite cannot ship.

## [0.3.23] — 2026-07-04
### Fixed
- **Mobile ranking** — Figma and Playwright include `flutter` / `expo` / `react-native` signals so they surface in mobile loadouts (hotfix for v0.3.22 test gap).

## [0.3.22] — 2026-07-04
### Added
- **Scan** — Flutter (`flutter:` in `pubspec.yaml`), `build.gradle` / `.kts`, `Package.swift`.
- **`test:recommend`** — Flutter and Expo/React Native ranking fixtures.

## [0.3.21] — 2026-07-04
### Added
- **`--json` recommend** — items include `homepage`, `auth`, and `needsTokens` when relevant.
- **`doctor --json`** — includes `summary: { fix, warn, ok }` counts.

### Changed
- README / README.ko document `--all --json` and `apply --json`.

## [0.3.20] — 2026-07-04
### Added
- **`--all --json`** — apply top recommendations and print receipts as JSON (CI-friendly).
- **detectInstalled** — recognizes eslint, gofmt, rustfmt, and block-push-to-main hooks already in settings.

## [0.3.19] — 2026-07-04
### Added
- **Scan** — Angular (`angular.json`, `@angular/*`), NestJS (`nest-cli.json`), Fastify, `yarn.lock` / `bun.lock`.
- **`apply -f --json`** — print apply receipts as JSON after writing configs.

## [0.3.18] — 2026-07-03
### Added
- **Scan** — `vite.config.*`, `tsconfig.json`, `pnpm-lock.yaml`, `uv.lock` project signals.
- **Minimal manifest** — `apply -f` accepts `{ "items": ["id", …] }` string arrays (documented by test).

### Changed
- Frontend / data-ml domain signals include `tsconfig.json` and `uv.lock`.

## [0.3.17] — 2026-07-03
### Added
- **`--version` / `-V`** — print package version.

### Changed
- README + README.ko — document export/apply, all `--json` flags, team loadout workflow; KO roadmap synced.

## [0.3.16] — 2026-07-03
### Added
- **`apply -f --dry-run --json`** — preview team manifest apply as structured JSON.
- **`LOADOUT_OPENCLAW_HOME`** — override OpenClaw config dir (detect, doctor, `--target openclaw`).
- **OpenClaw `detectInstalled`** — covered in regression tests via env override.

## [0.3.15] — 2026-07-03
### Added
- **`--json`** — print scan + recommend results as JSON (read-only; pairs with `--dry-run` in CI).
- **`buildRecommendPreview`** — shared JSON shape for recommend and export; `test:recommend-json`.

## [0.3.14] — 2026-07-03
### Added
- **`export --json`** — print team manifest JSON to stdout (no file write).
- **detectInstalled tests** — Gemini CLI and opencode MCP configs covered in regression suite.

## [0.3.13] — 2026-07-03
### Added
- **`doctor --json`** — machine-readable audit output; exits 1 when fix items exist.
- **Scan** — `papers/` or `paper/` directory emits a `papers` research signal.

### Changed
- `test:scan` covers papers-directory → Tavily research ranking.

## [0.3.12] — 2026-07-03
### Added
- **`test:scan`** — regression test that real `.ipynb`/`.bib` files produce research recommendations.
- **Scan** — `.ipynb` files also emit a `jupyter` signal (not just the extension token).

### Changed
- CI runs full `npm test` (detect-installed, doctor, manifest regressions).

## [0.3.11] — 2026-07-03
### Added
- **`apply -f`** — `--target cursor|codex|…` applies team manifest MCPs to other agents (hooks stay Claude-only).

## [0.3.10] — 2026-07-03
### Added
- **`export`** — `.loadout.json` now includes `installed` MCP ids already detected on disk.
- **`test:manifest`** — regression test for `apply -f` round-trip and installed exclusion.

## [0.3.9] — 2026-07-03
### Added
- **`doctor`** — warns when the same MCP id is configured in multiple agent configs.
- **`test:doctor`** — regression test for placeholder tokens, cross-agent dupes, `.env` guard gap.

### Changed
- CONTRIBUTING: release checklist + `NPM_TOKEN` CI publish setup.

## [0.3.8] — 2026-07-03
### Added
- **`test:detect-installed`** — regression test for Codex/Cursor MCP deduplication.
- **`doctor`** — audits Cursor, Gemini, opencode, Codex TOML, and OpenClaw MCP configs.

### Changed
- `package.json` repository URL normalized for npm publish warnings.

## [0.3.7] — 2026-07-03
### Changed
- **`detectInstalled`** — also reads Codex `.codex/config.toml` and OpenClaw `~/.openclaw/openclaw.json`
  so cross-agent MCP setups are not re-recommended.

## [0.3.6] — 2026-07-03
### Added
- **`npx claude-loadout export`** — write a shareable `.loadout.json` team manifest from the current repo profile.
- **`npx claude-loadout apply -f .loadout.json`** — apply a shared manifest (MCP + hooks; skills print install commands).
- **`.github/workflows/publish.yml`** — `npm publish` on `v*` tags when `NPM_TOKEN` repo secret is set.

## [0.3.5] — 2026-07-03
### Added
- **`game-dev` domain** — Godot (`project.godot`), Unity (`ProjectSettings`), Unreal (`.uproject`) signals.
- **Godot recommend regression tests**.

### Changed
- **`detectInstalled`** — also reads `.cursor/mcp.json`, `.gemini/settings.json`, and `opencode.json` so
  cross-agent setups are not re-recommended.

## [0.3.4] — 2026-07-03
### Added
- **`lint-python-on-edit-win`** — PowerShell Ruff hook; Loadout auto-selects on Windows instead of the jq/bash variant.
- **Jupyter research regression tests** (LOOP #5).
- **CONTRIBUTING.md** — full PR checklist + worked MCP example.

### Changed
- **`doctor`** — flags POSIX Ruff hooks on Windows and suggests the native variant.

## [0.3.3] — 2026-07-03
### Added
- **FastAPI dev-path regression tests** in `test:recommend` (LOOP #6 — backend gets postgres/guards, not playwright).

### Changed
- **Korean README** — full parity for CLI flags, auto-apply table, Research domain link.
- **`doctor` on Windows** — clearer Git Bash/WSL + `jq` install hint.

## [0.3.2] — 2026-07-03
### Added
- **`npx claude-loadout doctor`** — read-only audit: unfilled MCP tokens, missing hook PATH deps (`jq`,
  `ruff`, …), `.env` without protect-secrets, and top recommendation gaps.
- **`npm run test:mcps`** — smoke-starts curated stdio MCPs and probes HTTP endpoints (skippable via
  `SKIP_MCP_RUNTIME=1`; placeholder configs use `verify:mcp` only).
- **`--help`** — documents all flags and an honest auto-apply vs manual table.
- **`npm test`** — validate + recommend regression + npm package verify (CI runs these).

### Changed
- **Non-interactive UX** — piped/CI shells no longer hang waiting for input; use `--all` or `--dry-run`.
- **README** — CLI flags table, what auto-applies vs what you run, Research domain link, doctor in roadmap.
- **CI** — runs `test:recommend` and `verify:mcp` on every push.

## [0.3.1] — 2026-07-03
### Added
- **`research` domain** — notebooks, LaTeX/BibTeX, arxiv/wandb/mlflow signals; loadout centers on Exa, Tavily,
  Fetch, Firecrawl, and document tooling.
- **Curated Exa + Tavily skill entries** (`exa-research`, `tavily-research`) so literature-heavy repos get
  deep-research plugins without digging through the full marketplace.
- **`npm run test:recommend`** — regression checks that ML/paper repos surface the right tools and block
  generic `python` marketplace noise.

### Changed
- **Smarter Tier-2 filtering** — official marketplace plugins need specific signals (or 2+ weak ones);
  curated items rank first; at most 2 official plugins in the recommendation pool.
- **`data-ml` loadout** — dropped MongoDB (only relevant when you actually use Mongo); added Exa/Tavily;
  trimmed dev-only Superpowers from the default ML list.
- **`general` loadout** — removed Brave Search (needs API key; not a universal default).

## [0.3.0] — 2026-07-03
### Added
- **Three-tier coverage** — Loadout now reaches beyond its curated list:
  - **Tier 1 curated (35)** — hand-verified, auto-apply safe.
  - **Tier 2 official (~240)** — Anthropic's official plugin marketplace, ingested via
    `scripts/ingest-official.mjs` into `catalog/ecosystem.json`. Surfaced when they match your stack,
    installed with `/plugin`. Category → domain mapping + tech-signal derivation; de-duped against curated.
  - **Tier 3 community** (`catalog/community.json`, seeded with the caveman token-saver) — surfaced only
    with `--discover`, labeled **unverified**, and **never auto-applied**.
- CLI `--discover` flag and tier badges on each candidate. `npm run ingest` refreshes the official tier.

## [0.2.1] — 2026-07-03
### Changed
- Clearer candidate display: each recommended item now shows its kind + **official/community**, an
  **auth/token** badge, and a **source link**, so you know what you're choosing before you pick. The
  `/loadout:recommend` skill presents the same detail in its selection prompt.
### Removed
- Dropped a legacy account email from the `plugin.json` / `marketplace.json` author fields.

## [0.2.0] — 2026-07-03
### Added
- **Catalog expanded 25 → 35 entries**, all verified: MCP servers **Supabase, MongoDB, Stripe, Notion,
  Brave Search, Firecrawl**; hooks **ESLint --fix on edit, gofmt on edit, rustfmt on edit,
  block-push-to-main**. New signals (supabase, mongodb) for detection.
- **Accuracy gate** — `scripts/verify-mcp-packages.mjs` confirms every npx-based MCP server resolves to a
  real published npm package (a wrong install command is worse than no entry).
- **Animated terminal demo** (`assets/demo.svg`) embedded in the README.

## [0.1.0] — 2026-07-03
Initial public release — on npm as [`claude-loadout`](https://www.npmjs.com/package/claude-loadout) and
as the `sukoji/loadout` Claude Code plugin marketplace.

### Added
- `/loadout:recommend` skill — profiles the repo, recommends a domain-matched loadout, and applies picks
  to `.mcp.json` / `.claude/settings.json`.
- `/loadout:browse` skill — read-only catalog browse by domain.
- `claude-loadout` zero-dependency CLI (`npx claude-loadout`) sharing the same engine.
- Curated catalog: 25 entries (12 MCP servers, 7 skills, 6 hooks/settings) across 8 domains.
- **Cross-agent targets** — MCP servers apply to Codex (`.codex/config.toml`), Cursor (`.cursor/mcp.json`),
  Gemini CLI (`.gemini/settings.json`), opencode (`opencode.json`), and OpenClaw (`~/.openclaw/openclaw.json`),
  not just Claude Code. Flags: `--target <id[,id]>`, `--target all`, `--list-targets`, plus detection of
  other agents in the project. Formats verified against each agent's official docs; zero-dependency TOML
  emitter for Codex (stdio only, HTTP MCPs skipped with a note). Skills/hooks stay Claude Code-native.
- Plugin marketplace (`/plugin marketplace add sukoji/loadout`) and generated browsable docs (`docs/domains/`).
- SVG hero banner (`assets/banner.svg`).
- Catalog validation + docs-sync CI.
- Bilingual README (English / 한국어).

### Fixed
- Plugin install failed with "source type your Claude Code version does not support." Switched the
  marketplace entry from `metadata.pluginRoot` + bare source to an explicit `source: ./plugins/loadout`.
- Removed a phantom `qa` domain reference from the `playwright` catalog entry and the validator whitelist
  that was masking it.

[Unreleased]: https://github.com/sukoji/loadout/compare/v0.3.0...HEAD
[0.3.0]: https://github.com/sukoji/loadout/compare/v0.2.1...v0.3.0
[0.2.1]: https://github.com/sukoji/loadout/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/sukoji/loadout/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/sukoji/loadout/releases/tag/v0.1.0
