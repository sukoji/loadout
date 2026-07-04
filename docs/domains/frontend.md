# Frontend / Web UI

> React, Vue, Svelte, Next, Astro, Remix — anything that ships to a browser.

_Signals that map here: `react`, `next`, `vue`, `svelte`, `sveltekit`, `astro`, `remix`, `nuxt`, `solid`, `qwik`, `bun`, `deno`, `vite`, `tailwind`, `angular`, `package.json`, `tsconfig.json`_

## MCP servers

- **Context7 (up-to-date docs)** — Pulls version-accurate, up-to-date documentation and code examples for thousands of libraries straight into context — kills 'hallucinated API' bugs. Add 'use context7' to a prompt. — [source](https://github.com/upstash/context7)
- **Playwright (browser automation)** — Drive a real browser — navigate, click, fill, assert, screenshot — via structured accessibility snapshots (no pixel guessing). The standard for testing and verifying web UIs. — [source](https://github.com/microsoft/playwright-mcp)
- **Chrome DevTools** — Inspect live pages through Chrome DevTools — performance traces, network requests, console, and DOM. Great for debugging real front-end behavior and Core Web Vitals. — [source](https://github.com/ChromeDevTools/chrome-devtools-mcp)
- **Figma (Dev Mode)** — Turn Figma designs into accurate code — pull layout, tokens, and component structure from a frame instead of eyeballing a screenshot. Needs a Figma access token. — [source](https://github.com/GLips/Figma-Context-MCP) · 🔑 needs auth

## Hooks & settings

- **Auto-format JS/TS on edit (Prettier)** — After Claude writes or edits a file, run Prettier on that exact file so the diff is always clean. Keeps you from reviewing formatting noise.
- **Auto-fix JS/TS lint on edit (ESLint)** — After Claude edits a JS/TS file, run `eslint --fix` on that file so lint errors get fixed inline instead of failing CI later. Pairs with the Prettier hook.

## Skills

- **Superpowers** — A large, battle-tested framework of skills and subagents for planning, TDD, debugging, and disciplined execution. One of the most popular community skill packs; accepted into the official marketplace. — [source](https://github.com/obra/superpowers)
- **/code-review** — Built-in review of your working diff for correctness bugs and cleanup opportunities at a chosen effort level. Use before every push. — [source](https://code.claude.com/docs/en/commands)
- **/init (CLAUDE.md)** — Built-in codebase scan that writes a CLAUDE.md capturing build/test commands and conventions, so every future session starts already knowing your project. — [source](https://code.claude.com/docs/en/best-practices)

---

Apply this loadout to your repo automatically with `/loadout:recommend` in Claude Code, or `npx claude-loadout` in the project folder.
