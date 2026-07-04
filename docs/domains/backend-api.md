# Backend / API

> Servers, APIs, databases — Node, Python, Go, Rust, Java services.

_Signals that map here: `express`, `fastify`, `hono`, `elysia`, `trpc`, `nestjs`, `django`, `flask`, `fastapi`, `go.mod`, `Cargo.toml`, `pom.xml`, `prisma`, `drizzle`, `postgres`_

## MCP servers

- **Context7 (up-to-date docs)** — Pulls version-accurate, up-to-date documentation and code examples for thousands of libraries straight into context — kills 'hallucinated API' bugs. Add 'use context7' to a prompt. — [source](https://github.com/upstash/context7)
- **Postgres (read-only)** — Let Claude inspect a Postgres schema and run read-only queries so it writes migrations and queries against your real tables. Point it at a connection string. — [source](https://github.com/crystaldba/postgres-mcp) · 🔑 needs auth
- **Supabase** — Let Claude inspect your Supabase project — schema, tables, and (read-only) queries — so it writes migrations and SQL against your real database. Runs read-only by default. — [source](https://github.com/supabase-community/supabase-mcp) · 🔑 needs auth
- **MongoDB** — Explore a MongoDB database and run queries/aggregations from the session, so Claude works against your real collections instead of guessing the shape. — [source](https://github.com/mongodb-js/mongodb-mcp-server) · 🔑 needs auth
- **Stripe** — Official Stripe MCP — create and inspect customers, products, prices, and payment links, and search Stripe's docs, straight from the session. Use a restricted/test key. — [source](https://github.com/stripe/agent-toolkit) · 🔑 needs auth
- **GitHub** — Read and act on GitHub — issues, PRs, code search, Actions, reviews — from inside the session. Uses GitHub's official hosted MCP server (OAuth on first use). — [source](https://github.com/github/github-mcp-server) · 🔑 needs auth
- **Sentry** — Pull real error reports, stack traces, and issue context from Sentry so Claude can debug against production reality. Hosted MCP with OAuth. — [source](https://docs.sentry.io/product/sentry-mcp/) · 🔑 needs auth
- **Git** — Structured git operations (status, log, diff, blame, branch) as first-class tools instead of shell parsing. Handy for history-heavy tasks and safer diffs. — [source](https://github.com/modelcontextprotocol/servers/tree/main/src/git)

## Hooks & settings

- **Auto-format JS/TS on edit (Prettier)** — After Claude writes or edits a file, run Prettier on that exact file so the diff is always clean. Keeps you from reviewing formatting noise.
- **Auto-fix JS/TS lint on edit (ESLint)** — After Claude edits a JS/TS file, run `eslint --fix` on that file so lint errors get fixed inline instead of failing CI later. Pairs with the Prettier hook.
- **Auto-format Go on edit (gofmt)** — After Claude edits a .go file, run `gofmt -w` on it. Keeps Go code canonical and diffs noise-free.
- **Block dangerous shell commands** — A PreToolUse guard that blocks catastrophic commands (recursive deletes of /, ~, or $HOME, and disk-wipe patterns) before they run. Cheap insurance for autonomous sessions.
- **Refuse to read secret files** — Blocks Read on .env / credential files so secrets never get pulled into context (and can't leak into logs or commits). Good default for any repo with real credentials.

## Skills

- **/security-review** — Built-in security review of pending changes on the current branch — flags injection, authz gaps, secret handling, and unsafe patterns. — [source](https://code.claude.com/docs/en/commands)
- **/code-review** — Built-in review of your working diff for correctness bugs and cleanup opportunities at a chosen effort level. Use before every push. — [source](https://code.claude.com/docs/en/commands)
- **Superpowers** — A large, battle-tested framework of skills and subagents for planning, TDD, debugging, and disciplined execution. One of the most popular community skill packs; accepted into the official marketplace. — [source](https://github.com/obra/superpowers)
- **/init (CLAUDE.md)** — Built-in codebase scan that writes a CLAUDE.md capturing build/test commands and conventions, so every future session starts already knowing your project. — [source](https://code.claude.com/docs/en/best-practices)

---

Apply this loadout to your repo automatically with `/loadout:recommend` in Claude Code, or `npx claude-loadout` in the project folder.
