import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { homedir } from "node:os";

// Cross-agent target adapters. MCP servers are portable across modern agents; each target
// only differs in WHERE its config lives and WHAT shape an MCP entry takes. Verified formats:
//   Claude Code  .mcp.json                    { mcpServers: { NAME: {command,args,env} | {type:"http",url} } }
//   Cursor       .cursor/mcp.json             same "mcpServers" shape as Claude
//   Gemini CLI   .gemini/settings.json        same "mcpServers" shape as Claude
//   opencode     opencode.json                { mcp: { NAME: {type:"local",command:[...],enabled,environment} } }
//   Codex        .codex/config.toml           [mcp_servers.NAME] command=".." args=[..] env={..}
//   OpenClaw     ~/.openclaw/openclaw.json    { mcp: { servers: { NAME: {command,args,env} } } }  (http → transport)

export const TARGETS = {
  claude: { label: "Claude Code", scope: "project", file: ".mcp.json", kind: "mcpServers" },
  cursor: { label: "Cursor", scope: "project", file: ".cursor/mcp.json", kind: "mcpServers" },
  gemini: { label: "Gemini CLI", scope: "project", file: ".gemini/settings.json", kind: "mcpServers" },
  opencode: { label: "opencode", scope: "project", file: "opencode.json", kind: "opencode" },
  codex: { label: "Codex CLI", scope: "project", file: ".codex/config.toml", kind: "toml" },
  openclaw: { label: "OpenClaw", scope: "home", file: ".openclaw/openclaw.json", kind: "openclaw" },
};

export function listTargets() {
  return Object.entries(TARGETS).map(([id, t]) => ({ id, ...t }));
}

// Which agents already have config present (project or home) — used for a hint, not a gate.
export function detectTargets(root = process.cwd()) {
  const found = [];
  for (const [id, t] of Object.entries(TARGETS)) {
    const base = t.scope === "home" ? homedir() : root;
    if (existsSync(resolve(base, t.file))) found.push(id);
  }
  return found;
}

function targetPath(t, root) {
  return resolve(t.scope === "home" ? homedir() : root, t.file);
}

// Apply the given MCP catalog entries to one target. Returns a receipt.
export function applyToTarget(targetId, mcpItems, root = process.cwd()) {
  const t = TARGETS[targetId];
  if (!t) throw new Error(`unknown target "${targetId}" (see --list-targets)`);
  const path = targetPath(t, root);
  const receipt = { target: targetId, label: t.label, file: path, scope: t.scope, added: [], skipped: [], tokens: [] };

  const isHttp = (e) => e.config?.type === "http" || !!e.config?.url;
  for (const e of mcpItems) {
    const ph = JSON.stringify(e.config).match(/<your-[^>]+>/g);
    if (ph) receipt.tokens.push(`${e.name}: fill in ${ph.join(", ")}`);
    else if (e.auth) receipt.tokens.push(`${e.name}: authenticates on first use`);
  }

  if (t.kind === "toml") {
    applyToml(path, mcpItems, isHttp, receipt);
  } else {
    const doc = readJson(path) || {};
    for (const e of mcpItems) {
      writeIntoDoc(t.kind, doc, e, isHttp);
      receipt.added.push(e.id);
    }
    writeJson(path, doc);
  }
  return receipt;
}

function writeIntoDoc(kind, doc, e, isHttp) {
  if (kind === "mcpServers") {
    doc.mcpServers = doc.mcpServers || {};
    doc.mcpServers[e.id] = e.config;
  } else if (kind === "opencode") {
    doc["$schema"] = doc["$schema"] || "https://opencode.ai/config.json";
    doc.mcp = doc.mcp || {};
    doc.mcp[e.id] = isHttp(e)
      ? { type: "remote", url: e.config.url, enabled: true }
      : {
          type: "local",
          command: [e.config.command, ...(e.config.args || [])],
          enabled: true,
          ...(e.config.env ? { environment: e.config.env } : {}),
        };
  } else if (kind === "openclaw") {
    doc.mcp = doc.mcp || {};
    doc.mcp.servers = doc.mcp.servers || {};
    doc.mcp.servers[e.id] = isHttp(e)
      ? { transport: "streamable-http", url: e.config.url }
      : { command: e.config.command, args: e.config.args || [], ...(e.config.env ? { env: e.config.env } : {}) };
  }
}

// --- Codex TOML (no dependency; append tables that aren't already present) ---
function applyToml(path, mcpItems, isHttp, receipt) {
  let text = existsSync(path) ? readFileSync(path, "utf8") : "";
  const blocks = [];
  for (const e of mcpItems) {
    if (isHttp(e)) {
      receipt.skipped.push(`${e.id} (HTTP MCP — Codex needs experimental streamable_http; add manually)`);
      continue;
    }
    if (text.includes(`[mcp_servers.${e.id}]`)) {
      receipt.skipped.push(`${e.id} (already present)`);
      continue;
    }
    let b = `\n[mcp_servers.${e.id}]\ncommand = ${tstr(e.config.command)}\n`;
    if (e.config.args?.length) b += `args = ${tarr(e.config.args)}\n`;
    if (e.config.env && Object.keys(e.config.env).length) {
      b += `env = { ${Object.entries(e.config.env).map(([k, v]) => `${k} = ${tstr(v)}`).join(", ")} }\n`;
    }
    blocks.push(b);
    receipt.added.push(e.id);
  }
  if (blocks.length) {
    if (text && !text.endsWith("\n")) text += "\n";
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, text + blocks.join(""));
  }
}

const tstr = (s) => '"' + String(s).replace(/\\/g, "\\\\").replace(/"/g, '\\"') + '"';
const tarr = (a) => "[" + a.map(tstr).join(", ") + "]";

function readJson(path) {
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return null;
  }
}
function writeJson(path, doc) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(doc, null, 2) + "\n");
}
