# LOOP — Loadout improvement until claims are earned

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
8. **Distribution** — each iteration: commit → push → `npm publish` (patch bump) → git tag `vX.Y.Z`.

Until then: pick the highest-leverage unchecked item from [HANDOFF.md](HANDOFF.md) §6, ship one slice,
run §5 verify, release, update §1 + this file’s checklist.

## Iteration log

| Version | Date | Focus |
| :-- | :-- | :-- |
| 0.3.5 | 2026-07-03 | game-dev domain; cross-agent MCP detectInstalled |
| 0.3.3 | 2026-07-03 | FastAPI recommend tests; KO README parity; Windows doctor hints |
| 0.3.2 | 2026-07-03 | `doctor`, MCP smoke tests, `--help`, non-interactive UX, CI hardening |
| 0.3.1 | 2026-07-03 | Research domain; Exa/Tavily curated; Tier-2 noise filter; `test:recommend` |

## Next up (ordered)

1. Expand curated research entries only after runtime verify
2. Team loadouts / shared loadout file format
