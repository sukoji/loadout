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
npm run validate        # unique ids, required fields, every domain loadout id resolves
npm run test:recommend  # ranking regression (ML, research, frontend, FastAPI fixtures)
npm run verify:mcp      # every npx MCP package resolves on npm
npm run build:docs      # regenerate docs/domains/ (commit the result)
npm test                # all of the above (except build:docs)
```

Optional before release: `npm run test:mcps` smoke-starts stdio MCPs (network-heavy; skip in CI with `SKIP_MCP_RUNTIME=1`).

CI runs `validate`, `test:recommend`, and `verify:mcp` on every push. Accuracy is the bar: an entry with a wrong install command is
worse than no entry, because Loadout *applies* it. When in doubt, link the source and mark it clearly.

## Worked example — add an MCP server

1. Confirm the install command on the upstream README (link it in `homepage`).
2. Add to `plugins/loadout/catalog/mcp.json`:

```json
{
  "id": "my-server",
  "type": "mcp",
  "name": "My Server",
  "description": "One line what it does and why it helps.",
  "domains": ["backend-api"],
  "signals": ["fastapi", "postgres"],
  "auth": false,
  "homepage": "https://github.com/org/my-mcp",
  "config": {
    "command": "npx",
    "args": ["-y", "@scope/my-mcp@latest"]
  }
}
```

3. Append `"my-server"` to a domain `loadout` in `domains.json`.
4. Run `npm run validate && npm run verify:mcp && npm run build:docs`.
5. Open a PR with the catalog + generated `docs/domains/` changes.

## Release (maintainers)

```bash
npm test
# bump version in package.json, plugins/loadout/.claude-plugin/plugin.json, .claude-plugin/marketplace.json
# add CHANGELOG entry
git commit -m "feat: vX.Y.Z — …"
git push origin main
npm publish
git tag vX.Y.Z && git push origin vX.Y.Z
```

Tag pushes run [`.github/workflows/publish.yml`](.github/workflows/publish.yml). For CI publish, add an npm
**granular access token** (Automation, publish-only) as the repo secret **`NPM_TOKEN`** at
GitHub → Settings → Secrets and variables → Actions. Without it the workflow warns and skips; local
`npm publish` via `~/.npmrc` still works.
