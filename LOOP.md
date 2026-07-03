# LOOP — Loadout improvement until claims are earned

This file drives the `/loop` cadence: keep shipping until Loadout’s promises match real dev **and**
research utility — not marketing.

## Stop when ALL of these are true

1. **Recommendations are precise** — `npm run test:recommend` passes; no generic-signal marketplace flood;
   research repos surface Exa/Tavily/literature tools in the top 8.
2. **Catalog is verified** — `npm run validate` at 0 warnings; every curated `config`/`install` has a
   linked `homepage`; MCP package names pass `npm run verify:mcp`.
3. **Runtime confidence** — `scripts/test-mcps.mjs` (or equivalent) smoke-starts each curated stdio MCP;
   HTTP MCPs return a reachable endpoint. No “schema-only” entries in Tier 1.
4. **Honest UX** — README + `/loadout:recommend` clearly separate: auto-written (MCP/hooks) vs
   user-run (plugin installs, API keys). No implied full-auto where there isn’t.
5. **Research path works** — a fresh Jupyter + LaTeX repo gets a loadout a researcher would actually pick
   (web/literature MCPs, Ruff, docs) without irrelevant DB or GTM plugins.
6. **Dev path works** — React and FastAPI fixture repos get domain-correct top 8; hooks format on save;
   safety guards present.
7. **`loadout doctor`** — read-only audit flags missing tokens, hook deps (`jq`, `ruff`), and stale entries.
8. **Distribution** — each iteration: commit → push → `npm publish` (patch bump) → git tag `vX.Y.Z`.

Until then: pick the highest-leverage unchecked item from [HANDOFF.md](HANDOFF.md) §6, ship one slice,
run §5 verify, release, update §1 + this file’s checklist.

## Iteration log

| Version | Date | Focus |
| :-- | :-- | :-- |
| 0.3.1 | 2026-07-03 | Research domain; Exa/Tavily curated; Tier-2 noise filter; `test:recommend` |

## Next up (ordered)

1. `runtime-test-third-party-mcps` — smoke-test curated MCP commands
2. `implement-loadout-doctor` — `npx claude-loadout doctor`
3. `improve-readme-discoverability` — flags section + honest “what auto-applies” table
4. Windows hook note / optional PowerShell variants for Ruff guard
5. Expand curated research entries only after runtime verify (e.g. arXiv if a solid MCP exists)
