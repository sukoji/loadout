# Docs / Writing / Office

> Documentation, reports, and real Word/Excel/PDF/PPT deliverables.

_Signals that map here: `docs`, `mkdocs`, `docusaurus`, `vitepress`, `.docx`, `.xlsx`_

## MCP servers

- **Notion** — Read and write Notion pages and databases — pull specs, docs, and tasks into context, or push generated notes back. Official Notion MCP. — [source](https://github.com/makenotion/notion-mcp-server) · 🔑 needs auth
- **Fetch** — Fetch a URL and convert it to clean markdown for the model. Lightweight web reading without a full browser. — [source](https://github.com/modelcontextprotocol/servers/tree/main/src/fetch)
- **Firecrawl (web scrape/crawl)** — Scrape, crawl, and extract structured data from websites — turn docs sites, changelogs, or competitors into clean context. Great for research and data collection. — [source](https://github.com/firecrawl/firecrawl-mcp-server) · 🔑 needs auth
- **Brave Search** — Web and local search via the Brave Search API — give Claude fresh results without a full browser. Good default when you just need to look something up. — [source](https://github.com/modelcontextprotocol/servers/tree/main/src/brave-search) · 🔑 needs auth
- **Context7 (up-to-date docs)** — Pulls version-accurate, up-to-date documentation and code examples for thousands of libraries straight into context — kills 'hallucinated API' bugs. Add 'use context7' to a prompt. — [source](https://github.com/upstash/context7)

## Hooks & settings

- **Ping me when Claude finishes** — Rings the terminal bell (and prints a marker) when Claude stops responding, so you can tab away during long runs and come back when it's your turn.

## Skills

- **Office documents (pdf / docx / pptx / xlsx)** — Anthropic's official document skills: read and author real PDF, Word, PowerPoint, and Excel files — tables of contents, letterheads, charts, data merges. Ships in the official marketplace. — [source](https://github.com/anthropics/skills)

---

Apply this loadout to your repo automatically with `/loadout:recommend` in Claude Code, or `npx claude-loadout` in the project folder.
