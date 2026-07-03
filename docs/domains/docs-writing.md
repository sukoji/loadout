# Docs / Writing / Office

> Documentation, reports, and real Word/Excel/PDF/PPT deliverables.

_Signals that map here: `docs`, `*.md`, `mkdocs`, `docusaurus`, `*.docx`, `*.xlsx`_

## MCP servers

- **Fetch** — Fetch a URL and convert it to clean markdown for the model. Lightweight web reading without a full browser. — [source](https://github.com/modelcontextprotocol/servers/tree/main/src/fetch)
- **Context7 (up-to-date docs)** — Pulls version-accurate, up-to-date documentation and code examples for thousands of libraries straight into context — kills 'hallucinated API' bugs. Add 'use context7' to a prompt. — [source](https://github.com/upstash/context7)

## Hooks & settings

- **Ping me when Claude finishes** — Rings the terminal bell (and prints a marker) when Claude stops responding, so you can tab away during long runs and come back when it's your turn.

## Skills

- **Office documents (pdf / docx / pptx / xlsx)** — Anthropic's official document skills: read and author real PDF, Word, PowerPoint, and Excel files — tables of contents, letterheads, charts, data merges. Ships in the official marketplace. — [source](https://github.com/anthropics/skills)

---

Apply this loadout to your repo automatically with `/loadout:recommend` in Claude Code, or `npx claude-loadout` in the project folder.
