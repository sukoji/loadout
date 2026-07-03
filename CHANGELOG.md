# Changelog

All notable changes to Loadout are documented here. Format loosely follows
[Keep a Changelog](https://keepachangelog.com/); versions follow [SemVer](https://semver.org/).

## [Unreleased]
- See [HANDOFF.md](HANDOFF.md) §6 for the live task board.

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

[Unreleased]: https://github.com/sukoji/loadout/compare/v0.2.1...HEAD
[0.2.1]: https://github.com/sukoji/loadout/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/sukoji/loadout/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/sukoji/loadout/releases/tag/v0.1.0
