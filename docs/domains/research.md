# Research / Academic

> Literature review, notebooks, papers, and experiment repos — when discovery and writing matter as much as code.

_Signals that map here: `.ipynb`, `jupyter`, `latex`, `.bib`, `arxiv`, `wandb`, `mlflow`, `papers`_

## MCP servers

- **Fetch** — Fetch a URL and convert it to clean markdown for the model. Lightweight web reading without a full browser. — [source](https://github.com/modelcontextprotocol/servers/tree/main/src/fetch)
- **Firecrawl (web scrape/crawl)** — Scrape, crawl, and extract structured data from websites — turn docs sites, changelogs, or competitors into clean context. Great for research and data collection. — [source](https://github.com/firecrawl/firecrawl-mcp-server) · 🔑 needs auth
- **Brave Search** — Web and local search via the Brave Search API — give Claude fresh results without a full browser. Good default when you just need to look something up. — [source](https://github.com/modelcontextprotocol/servers/tree/main/src/brave-search) · 🔑 needs auth
- **Sequential Thinking** — A scratchpad tool that lets the model plan and revise multi-step reasoning explicitly. Helps on complex, branching problems. — [source](https://github.com/modelcontextprotocol/servers/tree/main/src/sequentialthinking)
- **Context7 (up-to-date docs)** — Pulls version-accurate, up-to-date documentation and code examples for thousands of libraries straight into context — kills 'hallucinated API' bugs. Add 'use context7' to a prompt. — [source](https://github.com/upstash/context7)

## Hooks & settings

- **Auto-fix Python on edit (Ruff)** — After Claude edits a .py file, run `ruff --fix` and format on that file. Style stays consistent and lint errors get caught immediately, not at CI.

## Skills

- **Exa (deep research)** — Official Exa plugin — web search, deep research, academic papers, and structured content extraction with citations. — [source](https://exa.ai/docs/reference/exa-mcp)
- **Tavily (search & research)** — Official Tavily plugin — real-time web search, extract, crawl, and research APIs for literature and competitive scans. — [source](https://www.tavily.com/)
- **Office documents (pdf / docx / pptx / xlsx)** — Anthropic's official document skills: read and author real PDF, Word, PowerPoint, and Excel files — tables of contents, letterheads, charts, data merges. Ships in the official marketplace. — [source](https://github.com/anthropics/skills)
- **/init (CLAUDE.md)** — Built-in codebase scan that writes a CLAUDE.md capturing build/test commands and conventions, so every future session starts already knowing your project. — [source](https://code.claude.com/docs/en/best-practices)

---

Apply this loadout to your repo automatically with `/loadout:recommend` in Claude Code, or `npx claude-loadout` in the project folder.
