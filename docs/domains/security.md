# Security-sensitive

> Auth, payments, PII, or anything where a mistake is expensive.

_Signals that map here: `auth`, `oauth`, `jwt`, `stripe`, `payment`, `crypto`, `.env`_

## MCP servers

- **Git** — Structured git operations (status, log, diff, blame, branch) as first-class tools instead of shell parsing. Handy for history-heavy tasks and safer diffs. — [source](https://github.com/modelcontextprotocol/servers/tree/main/src/git)
- **GitHub** — Read and act on GitHub — issues, PRs, code search, Actions, reviews — from inside the session. Uses GitHub's official hosted MCP server (OAuth on first use). — [source](https://github.com/github/github-mcp-server) · 🔑 needs auth

## Hooks & settings

- **Block dangerous shell commands** — A PreToolUse guard that blocks catastrophic commands (recursive deletes of /, ~, or $HOME, and disk-wipe patterns) before they run. Cheap insurance for autonomous sessions.
- **Refuse to read secret files** — Blocks Read on .env / credential files so secrets never get pulled into context (and can't leak into logs or commits). Good default for any repo with real credentials.

## Skills

- **/security-review** — Built-in security review of pending changes on the current branch — flags injection, authz gaps, secret handling, and unsafe patterns. — [source](https://code.claude.com/docs/en/commands)
- **/code-review** — Built-in review of your working diff for correctness bugs and cleanup opportunities at a chosen effort level. Use before every push. — [source](https://code.claude.com/docs/en/commands)

---

Apply this loadout to your repo automatically with `/loadout:recommend` in Claude Code, or `npx claude-loadout` in the project folder.
