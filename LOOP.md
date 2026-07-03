# LOOP — Loadout improvement until claims are earned

**Status: ACTIVE** — heartbeat restarted 2026-07-03. Phase 1 stop criteria met at `v0.3.6`; continuing on optional follow-ups below.

**Cadence goal:** 견고함 · 완성도 · 최신성 · 보안성 · UX — users should set up agents without friction,
and marketing should never outrun what the tool actually does.

This file drives the `/loop` cadence: keep shipping until Loadout’s promises match real dev **and**
research utility — not marketing.

## Stop when ALL of these are true

1. **Recommendations are precise** — `npm run test:recommend` passes; no generic-signal marketplace flood;
   research repos surface Exa/Tavily/literature tools in the top 8.
2. **Catalog is verified** — `npm run validate` at 0 warnings; every curated `config`/`install` has a
   linked `homepage`; MCP package names pass `npm run verify:mcp`.
3. **Runtime confidence** — `npm run test:mcps` smoke-starts curated stdio MCPs; HTTP MCPs probed;
   placeholder configs covered by `verify:mcp`. Set `SKIP_MCP_RUNTIME=1` to skip slow network tests.
4. **Honest UX** — ✅ README + `--help` separate auto-written (MCP/hooks) vs user-run (plugins, API keys).
5. **Research path works** — ✅ Jupyter + paper fixture tests in `test:recommend`.
6. **Dev path works** — ✅ FastAPI + React fixture tests in `test:recommend`.
7. **`loadout doctor`** — ✅ v0.3.2 read-only audit (tokens, hook deps, `.env` guard, gaps).
8. **Distribution** — ✅ commit → push → `npm publish` + tag; optional CI publish via `publish.yml` + `NPM_TOKEN`.

Until all stop criteria hold: pick the highest-leverage item from [HANDOFF.md](HANDOFF.md) §6, ship one slice,
run `npm test`, release, update this log.

## Iteration log

| Version | Date | Focus |
| :-- | :-- | :-- |
| 0.3.19 | 2026-07-04 | angular/nestjs/fastify scan; apply --json receipts |
| 0.3.18 | 2026-07-03 | scan lockfiles/vite/tsconfig; minimal manifest items[] |
| 0.3.5 | 2026-07-03 | game-dev domain; cross-agent MCP detectInstalled |
| 0.3.4 | 2026-07-03 | Windows Ruff hook; Jupyter research tests; CONTRIBUTING |
| 0.3.3 | 2026-07-03 | FastAPI recommend tests; KO README parity |
| 0.3.2 | 2026-07-03 | `doctor`, MCP smoke tests, `--help`, CI hardening |
| 0.3.1 | 2026-07-03 | Research domain; Tier-2 noise filter; `test:recommend` |

## Next up (ordered)

1. Add `NPM_TOKEN` to GitHub repo secrets to enable tag-triggered CI publish
2. Expand curated research entries only after runtime verify
3. Cross-agent `detectInstalled` — ✅ all six agents (v0.3.16)
4. Document JSON + team loadout UX — ✅ v0.3.17
