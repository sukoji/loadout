# Changelog

All notable changes to Loadout are documented here. Format loosely follows
[Keep a Changelog](https://keepachangelog.com/); versions follow [SemVer](https://semver.org/).

## [Unreleased]
- See [HANDOFF.md](HANDOFF.md) §6 for the live task board.

## [0.1.0] — 2026-07-03
Initial public release.

### Added
- `/loadout:recommend` skill — profiles the repo, recommends a domain-matched loadout, and applies picks
  to `.mcp.json` / `.claude/settings.json`.
- `/loadout:browse` skill — read-only catalog browse by domain.
- `claude-loadout` zero-dependency CLI (`node cli/index.js`) sharing the same engine.
- Curated catalog: 25 entries (12 MCP servers, 7 skills, 6 hooks/settings) across 8 domains.
- Plugin marketplace (`/plugin marketplace add sukoji/loadout`) and generated browsable docs (`docs/domains/`).
- Catalog validation + docs-sync CI.
- Bilingual README (English / 한국어).

### Fixed
- Removed a phantom `qa` domain reference from the `playwright` catalog entry and the validator whitelist
  that was masking it.

[Unreleased]: https://github.com/sukoji/loadout/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/sukoji/loadout/releases/tag/v0.1.0
