# DevOps / Infra

> CI/CD, Docker, Terraform, Kubernetes, cloud automation.

_Signals that map here: `Dockerfile`, `docker-compose`, `.github/workflows`, `terraform`, `*.tf`, `k8s`, `helm`, `ansible`_

## MCP servers

- **Git** — Structured git operations (status, log, diff, blame, branch) as first-class tools instead of shell parsing. Handy for history-heavy tasks and safer diffs. — [source](https://github.com/modelcontextprotocol/servers/tree/main/src/git)
- **GitHub** — Read and act on GitHub — issues, PRs, code search, Actions, reviews — from inside the session. Uses GitHub's official hosted MCP server (OAuth on first use). — [source](https://github.com/github/github-mcp-server) · 🔑 needs auth
- **Filesystem** — Give Claude scoped read/write access to specific directories outside the project root — useful for cross-repo work, shared asset folders, or a downloads dir. — [source](https://github.com/modelcontextprotocol/servers/tree/main/src/filesystem)

## Hooks & settings

- **Block direct push to main/master** — A PreToolUse guard that blocks `git push` while you're on main or master, nudging you toward a feature branch + PR. Stops accidental direct pushes during autonomous runs.
- **Auto-format Go on edit (gofmt)** — After Claude edits a .go file, run `gofmt -w` on it. Keeps Go code canonical and diffs noise-free.
- **Block dangerous shell commands** — A PreToolUse guard that blocks catastrophic commands (recursive deletes of /, ~, or $HOME, and disk-wipe patterns) before they run. Cheap insurance for autonomous sessions.
- **Refuse to read secret files** — Blocks Read on .env / credential files so secrets never get pulled into context (and can't leak into logs or commits). Good default for any repo with real credentials.
- **Ping me when Claude finishes** — Rings the terminal bell (and prints a marker) when Claude stops responding, so you can tab away during long runs and come back when it's your turn.
- **Status line: dir + git branch + model** — A compact status line showing the current directory, git branch, and active model. Small quality-of-life upgrade you notice every session.

## Skills

- **/security-review** — Built-in security review of pending changes on the current branch — flags injection, authz gaps, secret handling, and unsafe patterns. — [source](https://code.claude.com/docs/en/commands)
- **/code-review** — Built-in review of your working diff for correctness bugs and cleanup opportunities at a chosen effort level. Use before every push. — [source](https://code.claude.com/docs/en/commands)

---

Apply this loadout to your repo automatically with `/loadout:recommend` in Claude Code, or `npx claude-loadout` in the project folder.
