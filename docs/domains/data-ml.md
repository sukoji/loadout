# Data / ML / Notebooks

> Python data work, training pipelines, analysis, and reporting.

_Signals that map here: `requirements.txt`, `pyproject.toml`, `numpy`, `pandas`, `torch`, `tensorflow`, `scikit-learn`, `.ipynb`, `jupyter`_

## MCP servers

- **Context7 (up-to-date docs)** — Pulls version-accurate, up-to-date documentation and code examples for thousands of libraries straight into context — kills 'hallucinated API' bugs. Add 'use context7' to a prompt. — [source](https://github.com/upstash/context7)
- **Fetch** — Fetch a URL and convert it to clean markdown for the model. Lightweight web reading without a full browser. — [source](https://github.com/modelcontextprotocol/servers/tree/main/src/fetch)
- **Firecrawl (web scrape/crawl)** — Scrape, crawl, and extract structured data from websites — turn docs sites, changelogs, or competitors into clean context. Great for research and data collection. — [source](https://github.com/firecrawl/firecrawl-mcp-server) · 🔑 needs auth
- **Brave Search** — Web and local search via the Brave Search API — give Claude fresh results without a full browser. Good default when you just need to look something up. — [source](https://github.com/modelcontextprotocol/servers/tree/main/src/brave-search) · 🔑 needs auth
- **Sequential Thinking** — A scratchpad tool that lets the model plan and revise multi-step reasoning explicitly. Helps on complex, branching problems. — [source](https://github.com/modelcontextprotocol/servers/tree/main/src/sequentialthinking)
- **MongoDB** — Explore a MongoDB database and run queries/aggregations from the session, so Claude works against your real collections instead of guessing the shape. — [source](https://github.com/mongodb-js/mongodb-mcp-server) · 🔑 needs auth

## Hooks & settings

- **Auto-fix Python on edit (Ruff)** — After Claude edits a .py file, run `ruff --fix` and format on that file. Style stays consistent and lint errors get caught immediately, not at CI.

## Skills

- **Office documents (pdf / docx / pptx / xlsx)** — Anthropic's official document skills: read and author real PDF, Word, PowerPoint, and Excel files — tables of contents, letterheads, charts, data merges. Ships in the official marketplace. — [source](https://github.com/anthropics/skills)
- **/code-review** — Built-in review of your working diff for correctness bugs and cleanup opportunities at a chosen effort level. Use before every push. — [source](https://code.claude.com/docs/en/commands)
- **Superpowers** — A large, battle-tested framework of skills and subagents for planning, TDD, debugging, and disciplined execution. One of the most popular community skill packs; accepted into the official marketplace. — [source](https://github.com/obra/superpowers)
- **/init (CLAUDE.md)** — Built-in codebase scan that writes a CLAUDE.md capturing build/test commands and conventions, so every future session starts already knowing your project. — [source](https://code.claude.com/docs/en/best-practices)

---

Apply this loadout to your repo automatically with `/loadout:recommend` in Claude Code, or `npx claude-loadout` in the project folder.
