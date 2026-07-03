# Game Development

> Godot, Unity, Unreal — gameplay code, editor scripting, and engine tooling.

_Signals that map here: `godot`, `unity`, `unreal`, `project.godot`, `.uproject`_

## MCP servers

- **Context7 (up-to-date docs)** — Pulls version-accurate, up-to-date documentation and code examples for thousands of libraries straight into context — kills 'hallucinated API' bugs. Add 'use context7' to a prompt. — [source](https://github.com/upstash/context7)
- **Git** — Structured git operations (status, log, diff, blame, branch) as first-class tools instead of shell parsing. Handy for history-heavy tasks and safer diffs. — [source](https://github.com/modelcontextprotocol/servers/tree/main/src/git)
- **Playwright (browser automation)** — Drive a real browser — navigate, click, fill, assert, screenshot — via structured accessibility snapshots (no pixel guessing). The standard for testing and verifying web UIs. — [source](https://github.com/microsoft/playwright-mcp)

## Hooks & settings

- **Block dangerous shell commands** — A PreToolUse guard that blocks catastrophic commands (recursive deletes of /, ~, or $HOME, and disk-wipe patterns) before they run. Cheap insurance for autonomous sessions.

## Skills

- **/code-review** — Built-in review of your working diff for correctness bugs and cleanup opportunities at a chosen effort level. Use before every push. — [source](https://code.claude.com/docs/en/commands)
- **/init (CLAUDE.md)** — Built-in codebase scan that writes a CLAUDE.md capturing build/test commands and conventions, so every future session starts already knowing your project. — [source](https://code.claude.com/docs/en/best-practices)
- **Superpowers** — A large, battle-tested framework of skills and subagents for planning, TDD, debugging, and disciplined execution. One of the most popular community skill packs; accepted into the official marketplace. — [source](https://github.com/obra/superpowers)

---

Apply this loadout to your repo automatically with `/loadout:recommend` in Claude Code, or `npx claude-loadout` in the project folder.
