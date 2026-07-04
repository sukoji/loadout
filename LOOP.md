# LOOP — Loadout improvement until claims are earned

**Status: ACTIVE** — Phase 1 stop criteria met at `v0.3.6`. Phase 2 shipped browse/CI/profile/automation UX through `v0.3.71` (MongoDB backend + Angular fixtures). Remaining: optional `NPM_TOKEN` secret and runtime-verified research catalog growth.

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
| 0.3.71 | 2026-07-05 | MongoDB backend domain signal + Angular/MongoDB fixtures |
| 0.3.70 | 2026-07-05 | Drizzle config scan + Supabase backend domain signal |
| 0.3.69 | 2026-07-05 | Express/NestJS/Fastify/Flask/Prisma backend recommend fixtures |
| 0.3.68 | 2026-07-05 | Phoenix/Elixir + Django backend scan; Fiber/Echo/Actix tests |
| 0.3.67 | 2026-07-05 | Rails + Go Gin/Fiber/Echo backend scan |
| 0.3.66 | 2026-07-05 | Spring Boot + Rust axum backend scan |
| 0.3.65 | 2026-07-05 | Laravel/PHP backend scan |
| 0.3.64 | 2026-07-05 | GraphQL/Redis backend scan |
| 0.3.63 | 2026-07-05 | Hono/Elysia/tRPC backend scan; weak domain signals |
| 0.3.62 | 2026-07-05 | Deno frontend domain; VitePress docs scan |
| 0.3.61 | 2026-07-05 | Nuxt/Solid/Qwik/Bun frontend scan |
| 0.3.60 | 2026-07-05 | `signals` includes matched domains |
| 0.3.59 | 2026-07-04 | `signals` CLI; doctor JSON version field |
| 0.3.58 | 2026-07-04 | Astro/Remix/SvelteKit/Deno frontend scan |
| 0.3.57 | 2026-07-04 | monorepo scan signals; devops match for turbo/nx |
| 0.3.56 | 2026-07-04 | doctor --require-healthy; dogfood in CI |
| 0.3.55 | 2026-07-04 | doctor summary.healthy / optionalOnly; doctor --quiet |
| 0.3.54 | 2026-07-04 | optional-plugins doctor label; README roadmap Done/Next/Later |
| 0.3.53 | 2026-07-04 | skip hooks missing PATH deps; dogfood notify-on-stop |
| 0.3.52 | 2026-07-04 | doctor gaps ignore always-available builtin skills |
| 0.3.51 | 2026-07-04 | `--hooks-only` for apply and doctor --fix |
| 0.3.50 | 2026-07-04 | skip init-claude-md when CLAUDE.md exists |
| 0.3.49 | 2026-07-04 | doctor --fix prints skill install steps |
| 0.3.48 | 2026-07-04 | protect-secrets for any `.env` repo; doctor prioritizes security gaps |
| 0.3.47 | 2026-07-04 | `doctor --fix` auto-applies MCP + hooks |
| 0.3.46 | 2026-07-04 | require signal match for specific-signal loadout items |
| 0.3.45 | 2026-07-04 | dogfood guard-dangerous-bash + block-push-to-main |
| 0.3.44 | 2026-07-04 | dogfood JS hooks; hook PATH deps are warnings |
| 0.3.43 | 2026-07-04 | dogfood .mcp.json; smarter doctor tip |
| 0.3.42 | 2026-07-04 | enable loadout-doctor workflow on this repo |
| 0.3.41 | 2026-07-04 | examples/ci-doctor.yml GitHub Actions template |
| 0.3.40 | 2026-07-04 | doctor JSON applyCommand fields |
| 0.3.39 | 2026-07-04 | apply --suggestions --mcp-only / --limit |
| 0.3.38 | 2026-07-04 | `apply --suggestions` one-shot (tick 30) |
| 0.3.37 | 2026-07-04 | doctor apply --ids tip; CI recipe docs |
| 0.3.36 | 2026-07-04 | apply --ids from doctor suggestions |
| 0.3.35 | 2026-07-04 | doctor JSON suggestions array |
| 0.3.34 | 2026-07-04 | search --limit; curated homepage validate warn |
| 0.3.33 | 2026-07-04 | `stats` catalog overview (tick 25) |
| 0.3.32 | 2026-07-04 | doctor JSON domains/signals profile fields |
| 0.3.31 | 2026-07-04 | search --type filter; doctor matched domains |
| 0.3.30 | 2026-07-04 | `search <query>` catalog search |
| 0.3.29 | 2026-07-04 | `domains <id>` detail; show id suggestions |
| 0.3.28 | 2026-07-04 | `show <id>` catalog lookup (tick 20) |
| 0.3.27 | 2026-07-04 | domains CLI command; all-10 domain catalog test |
| 0.3.26 | 2026-07-04 | docs/security scan signals; domain fixtures |
| 0.3.25 | 2026-07-04 | Helm/K8s/Ansible scan; devops recommend tests |
| 0.3.24 | 2026-07-04 | domain-priority ranking; prepublishOnly test gate |
| 0.3.23 | 2026-07-04 | mobile ranking fix (figma/playwright signals) |
| 0.3.22 | 2026-07-04 | Flutter/Gradle/Swift scan; mobile recommend tests |
| 0.3.21 | 2026-07-04 | richer --json (homepage/auth/tokens); doctor summary |
| 0.3.20 | 2026-07-04 | --all --json apply receipts; fuller hook detectInstalled |
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
5. Domain scan/recommend coverage (frontend→security, mobile, devops, docs) — ✅ v0.3.22–0.3.27
6. `domains` CLI browse — ✅ v0.3.27
7. `show <id>` catalog lookup — ✅ v0.3.28
8. `domains <id>` loadout detail + show suggestions — ✅ v0.3.29
9. `search <query>` catalog search — ✅ v0.3.30
10. `search --type` + doctor domains/signals profile — ✅ v0.3.31–0.3.32
11. `stats` catalog overview — ✅ v0.3.33
12. doctor → apply --ids automation loop — ✅ v0.3.35–0.3.37
13. `apply --suggestions` one-shot apply — ✅ v0.3.38
14. `--mcp-only` / `--limit` + doctor `applyCommand*` — ✅ v0.3.39–0.3.40
15. GitHub Actions doctor example — ✅ v0.3.41
16. Dogfood `loadout-doctor` workflow on this repo — ✅ v0.3.42
17. Dogfood `.mcp.json` + JS/security hooks — ✅ v0.3.43–0.3.45
18. Signal-gated loadout items (protect-secrets) — ✅ v0.3.46
19. `doctor --fix` one-shot apply — ✅ v0.3.47
20. protect-secrets on any `.env` repo + doctor prioritizes security gaps — ✅ v0.3.48
21. doctor --fix skill install guide — ✅ v0.3.49
22. skip `/init` when CLAUDE.md exists — ✅ v0.3.50
23. `--hooks-only` for apply / doctor --fix — ✅ v0.3.51
24. doctor gaps ignore always-available builtins — ✅ v0.3.52
25. skip hooks missing PATH deps; dogfood notify-on-stop — ✅ v0.3.53
26. optional-plugins doctor label; README roadmap — ✅ v0.3.54
27. doctor summary.healthy / optionalOnly; --quiet — ✅ v0.3.55
28. doctor --require-healthy; dogfood in CI — ✅ v0.3.56
29. monorepo scan signals — ✅ v0.3.57
30. Astro/Remix/SvelteKit/Deno frontend scan — ✅ v0.3.58
31. `signals` CLI — ✅ v0.3.59
32. `signals` includes matched domains — ✅ v0.3.60
33. Nuxt/Solid/Qwik/Bun frontend scan — ✅ v0.3.61
34. Deno frontend domain; VitePress docs scan — ✅ v0.3.62
35. Hono/Elysia/tRPC backend scan — ✅ v0.3.63
36. GraphQL/Redis backend scan — ✅ v0.3.64
37. Laravel/PHP backend scan — ✅ v0.3.65
38. Spring Boot + Rust axum backend scan — ✅ v0.3.66
39. Rails + Go Gin/Fiber/Echo backend scan — ✅ v0.3.67
40. Phoenix/Elixir + Django backend scan; Go/Rust backend test coverage — ✅ v0.3.68
41. Express/NestJS/Fastify/Flask/Prisma backend recommend fixtures — ✅ v0.3.69
42. Drizzle config scan + Supabase backend domain signal — ✅ v0.3.70
43. MongoDB backend domain signal + Angular/MongoDB fixtures — ✅ v0.3.71
