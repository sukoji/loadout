# Contributing to Loadout

Loadout is only as good as its catalog. Adding a well-tagged entry is the highest-value contribution.

## Add a catalog entry

The catalog lives in `plugins/loadout/catalog/` and is the single source of truth (the `/loadout`
skill and the `npx claude-loadout` CLI both read it):

- `mcp.json` — MCP servers
- `skills.json` — skills, plugins, and built-in commands
- `hooks.json` — hooks and settings snippets
- `domains.json` — the domain → loadout mapping

### Common fields (every entry)

| Field | Required | Notes |
| :-- | :-- | :-- |
| `id` | ✅ | kebab-case, unique across all catalog files |
| `type` | ✅ | `mcp` \| `skill` \| `hook` \| `setting` \| `reference` |
| `name` | ✅ | human-readable |
| `description` | ✅ | one or two sentences — say what it does *and* why it helps |
| `domains` | ✅ | array of domain ids from `domains.json` |
| `signals` | ✅ | lowercase tokens (dep names, filenames, extensions) that boost relevance; use `"always"` for broadly-useful items |
| `homepage` | ▲ | source/docs URL — required for anything third-party so people can verify it |

### Type-specific fields

- **`mcp`** → `config`: a valid `.mcp.json` server object (`command`/`args`/`env`, or `type: "http"` + `url`).
  Set `"auth": true` if it needs a login/token. Use a `<your-...>` placeholder in `env` for required tokens.
- **`hook` / `setting`** → `settings`: the object that gets deep-merged into `.claude/settings.json`.
  Add a `note` for dependencies (`jq`, `ruff`) or platform caveats.
- **`skill` / `reference`** → `install`: `{ "type": "builtin" | "plugin" | "manual", "commands": [...], "note"?, "marketplace"? }`.
  Only use real, verifiable install commands — never invent package names or endpoints.

### Add it to a domain

Append your `id` to the relevant domain's `loadout` array in `domains.json` (order = priority).

## Before you open a PR

```bash
npm run validate     # unique ids, required fields, every domain loadout id resolves
npm run build:docs   # regenerate docs/domains/ (commit the result)
```

CI runs `npm run validate` on every PR. Accuracy is the bar: an entry with a wrong install command is
worse than no entry, because Loadout *applies* it. When in doubt, link the source and mark it clearly.
