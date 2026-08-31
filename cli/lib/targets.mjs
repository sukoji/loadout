import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { homedir } from "node:os";
import { openclawHome } from "./paths.mjs";
import { deepMerge } from "./apply.mjs";

// Cross-agent target adapters. MCP servers are portable across modern agents; each target
// differs in supported item types, config location, and MCP entry shape. Verified formats:
//   Claude Code  .mcp.json                    { mcpServers: { NAME: {command,args,env} | {type:"http",url} } }
//   Cursor       .cursor/mcp.json             same "mcpServers" shape as Claude
//   Gemini CLI   .gemini/settings.json        same "mcpServers" shape as Claude
//   opencode     opencode.json                { mcp: { NAME: {type:"local",command:[...],enabled,environment} } }
//   Codex        .codex/config.toml           [mcp_servers.NAME] command=".." args=[..] env={..}
//   OpenClaw     ~/.openclaw/openclaw.json    { mcp: { servers: { NAME: {command,args,env} } } }  (http → transport)

export const TARGETS = {
  claude: { label: "Claude Code", scope: "project", file: ".mcp.json", kind: "mcpServers", types: ["mcp", "hook", "setting", "skill", "reference"] },
  cursor: { label: "Cursor", scope: "project", file: ".cursor/mcp.json", kind: "mcpServers", types: ["mcp"] },
  gemini: { label: "Gemini CLI", scope: "project", file: ".gemini/settings.json", kind: "mcpServers", types: ["mcp"] },
  opencode: { label: "opencode", scope: "project", file: "opencode.json", kind: "opencode", types: ["mcp"] },
  codex: { label: "Codex", scope: "project", file: ".codex/config.toml", kind: "toml", types: ["mcp", "hook"] },
  openclaw: { label: "OpenClaw", scope: "home", file: ".openclaw/openclaw.json", kind: "openclaw", types: ["mcp"] },
};

export function listTargets() {
  return Object.entries(TARGETS).map(([id, t]) => ({ id, ...t }));
}

// Which agents already have config present (project or home) — used for a hint, not a gate.
export function detectTargets(root = process.cwd()) {
  const found = [];
  for (const [id, t] of Object.entries(TARGETS)) {
    const base = t.id === "openclaw" ? openclawHome() : t.scope === "home" ? homedir() : root;
    if (existsSync(resolve(base, t.file))) found.push(id);
  }
  return found;
}

function targetPath(t, root) {
  const base = t.id === "openclaw" ? openclawHome() : t.scope === "home" ? homedir() : root;
  return resolve(base, t.file);
}

// Apply the given MCP catalog entries to one target. Returns a receipt.
export function supportedItems(targetId, items) {
  const supported = new Set(TARGETS[targetId]?.types || []);
  return items.filter((item) => supported.has(item.type));
}

export function applyToTarget(targetId, items, root = process.cwd()) {
  const t = TARGETS[targetId];
  if (!t) throw new Error(`unknown target "${targetId}" (see --list-targets)`);
  const path = targetPath(t, root);
  const receipt = { target: targetId, label: t.label, file: path, files: [], scope: t.scope, added: [], skipped: [], tokens: [] };
  const mcpItems = items.filter((item) => item.type === "mcp");
  const hookItems = targetId === "codex" ? items.filter((item) => item.type === "hook") : [];

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
    if (mcpItems.length) receipt.files.push(path);
  }

  if (hookItems.length) {
    const hooksPath = resolve(root, ".codex", "hooks.json");
    const doc = readJson(hooksPath) || {};
    for (const item of hookItems) {
      deepMerge(doc, { hooks: item.settings.hooks });
      receipt.added.push(item.id);
      if (item.note) receipt.tokens.push(`${item.name}: ${item.note}`);
    }
    writeJson(hooksPath, doc);
    receipt.files.push(hooksPath);
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
    if (!/^[A-Za-z0-9._-]+$/.test(e.id)) {
      receipt.skipped.push(`${e.id} (unsafe id for a TOML section header — skipped)`);
      continue;
    }
    if (text.includes(`[mcp_servers.${e.id}]`)) {
      receipt.skipped.push(`${e.id} (already present)`);
      continue;
    }
    let b = `\n[mcp_servers.${e.id}]\n`;
    b += isHttp(e) ? `url = ${tstr(e.config.url)}\n` : `command = ${tstr(e.config.command)}\n`;
    if (!isHttp(e) && e.config.args?.length) b += `args = ${tarr(e.config.args)}\n`;
    if (!isHttp(e) && e.config.env && Object.keys(e.config.env).length) {
      b += `env = { ${Object.entries(e.config.env).map(([k, v]) => `${k} = ${tstr(v)}`).join(", ")} }\n`;
    }
    blocks.push(b);
    receipt.added.push(e.id);
  }
  if (blocks.length) {
    if (text && !text.endsWith("\n")) text += "\n";
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, text + blocks.join(""));
    receipt.files.push(path);
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
