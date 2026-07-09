import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { openclawConfigPath } from "./paths.mjs";
import { execSync } from "node:child_process";
import { loadCatalog } from "./catalog.mjs";
import { scanProject } from "./scan.mjs";
import { recommend } from "./recommend.mjs";
import { applyItems } from "./manifest.mjs";

const AUTO_APPLY_TYPES = new Set(["mcp", "hook", "setting"]);

/** Whether a catalog type is auto-writable under --mcp-only / --hooks-only filters. */
export function isAutoApplyType(type, opts = {}) {
  if (opts.mcpOnly) return type === "mcp";
  if (opts.hooksOnly) return type === "hook" || type === "setting";
  return AUTO_APPLY_TYPES.has(type);
}

/** Machine-readable doctor summary for CI (`healthy` / `optionalOnly`). */
export function summarizeDoctor(findings) {
  const suggestions = findings.suggestions || [];
  const optionalOnly =
    suggestions.length > 0 &&
    suggestions.every((s) => s.type === "skill" || s.type === "reference") &&
    findings.fix.length === 0;
  const healthy = findings.fix.length === 0 && (suggestions.length === 0 || optionalOnly);
  return {
    fix: findings.fix.length,
    warn: findings.warn.length,
    ok: findings.ok.length,
    domains: findings.domains?.length || 0,
    signals: findings.signals?.length || 0,
    suggestions: suggestions.length,
    optionalOnly,
    healthy,
  };
}

const TOKEN_RE = /<your-[^>]+>/g;
const HOOK_DEPS = {
  jq: ["format-js-on-edit", "lint-python-on-edit", "guard-dangerous-bash", "protect-secrets", "eslint-fix-on-edit", "gofmt-on-edit", "rustfmt-on-edit", "block-push-to-main", "statusline-git"],
  git: ["statusline-git", "block-push-to-main"],
  ruff: ["lint-python-on-edit", "lint-python-on-edit-win"],
  prettier: ["format-js-on-edit"],
  eslint: ["eslint-fix-on-edit"],
  gofmt: ["gofmt-on-edit"],
  rustfmt: ["rustfmt-on-edit"],
};

export function doctor(root = process.cwd()) {
  const catalog = loadCatalog();
  const findings = { ok: [], warn: [], fix: [], domains: [], signals: [], suggestions: [] };

  const mcpPath = resolve(root, ".mcp.json");
  const settingsPath = resolve(root, ".claude", "settings.json");
  const hasEnv = existsSync(resolve(root, ".env"));

  let mcpDoc = null;
  let settingsDoc = null;

  if (existsSync(mcpPath)) {
    try {
      mcpDoc = JSON.parse(readFileSync(mcpPath, "utf8"));
    } catch {
      findings.fix.push({ msg: ".mcp.json is invalid JSON — fix or remove it", file: ".mcp.json" });
    }
  } else {
    findings.warn.push({ msg: "No .mcp.json — run loadout to add MCP servers", file: ".mcp.json" });
  }

  if (existsSync(settingsPath)) {
    try {
      settingsDoc = JSON.parse(readFileSync(settingsPath, "utf8"));
    } catch {
      findings.fix.push({ msg: ".claude/settings.json is invalid JSON", file: ".claude/settings.json" });
    }
  }

  const mcpLocations = new Map();

  auditMcpServers(mcpDoc, catalog, findings, ".mcp.json", mcpLocations);
  auditCrossAgentMcp(root, catalog, findings, mcpLocations);
  auditDuplicateMcp(mcpLocations, findings);
  auditTokens(mcpDoc, findings);
  auditHooks(settingsDoc, findings);
  auditSecurity(hasEnv, settingsDoc, findings);
  auditGaps(root, catalog, findings);
  enrichSuggestionsFromFindings(findings, catalog);

  if (process.platform === "win32") {
    const blob = JSON.stringify(settingsDoc || {}).toLowerCase();
    if (blob.includes("jq -r") && blob.includes("ruff")) {
      findings.fix.push({
        msg: "POSIX Ruff hook detected — re-run loadout on Windows to apply lint-python-on-edit-win (PowerShell, no jq)",
        file: ".claude/settings.json",
      });
    } else if (blob.includes("jq -r") || blob.includes("grep -eq")) {
      findings.warn.push({
        msg: "Hooks use POSIX shell — launch Claude Code from Git Bash or WSL; install jq via `winget install jqlang.jq` or scoop",
        file: ".claude/settings.json",
      });
    } else if (settingsDoc?.hooks) {
      findings.ok.push({ msg: "No POSIX-only hook shell detected (or hooks not configured)" });
    }
  }

  return findings;
}

/** Install steps for skill/reference suggestions (never auto-written). */
export function skillInstallGuide(catalog, suggestions = []) {
  const out = [];
  for (const s of suggestions) {
    if (s.type !== "skill" && s.type !== "reference") continue;
    const item = catalog.byId.get(s.id);
    if (!item) continue;
    const install = item.install || {};
    out.push({
      id: item.id,
      name: item.name,
      commands: install.commands || [],
      note: install.note || null,
      homepage: item.homepage || null,
    });
  }
  return out;
}

/** Apply auto-writable doctor suggestions (MCP + hooks). Skills stay manual (install guide only). */
export function doctorFix(root = process.cwd(), opts = {}) {
  const catalog = loadCatalog();
  const mcpOnly = Boolean(opts.mcpOnly);
  const hooksOnly = Boolean(opts.hooksOnly) && !mcpOnly;
  const typeOpts = { mcpOnly, hooksOnly };
  const dryRun = Boolean(opts.dryRun);
  const limit = opts.limit ?? 5;
  const before = doctor(root);
  const seen = new Set();
  const auto = [];
  const manual = [];

  // Security / gap findings with catalog ids take priority over ranked suggestions.
  for (const f of [...(before.fix || []), ...(before.warn || [])]) {
    if (!f.id || seen.has(f.id)) continue;
    const item = catalog.byId.get(f.id);
    if (!item) continue;
    if (!isAutoApplyType(item.type, typeOpts)) continue;
    seen.add(f.id);
    auto.push({ id: item.id, name: item.name, type: item.type, tier: item.tier || "curated", reason: f.msg });
  }

  for (const s of before.suggestions || []) {
    if (seen.has(s.id)) continue;
    if (isAutoApplyType(s.type, typeOpts)) {
      seen.add(s.id);
      auto.push(s);
    } else {
      manual.push(s);
    }
  }

  const skills = skillInstallGuide(catalog, manual);
  const ids = auto.slice(0, limit).map((s) => s.id);
  if (!ids.length || dryRun) {
    return {
      applied: [],
      ids,
      manual,
      skills,
      dryRun,
      receipts: [],
      skipped: [],
      findings: before,
      before,
    };
  }
  const { receipts, skipped } = applyItems(catalog, ids, root, { targets: opts.targets });
  return {
    applied: ids,
    ids,
    manual,
    skills,
    dryRun: false,
    receipts,
    skipped,
    findings: doctor(root),
    before,
  };
}

function auditMcpServers(mcpDoc, catalog, findings, file = ".mcp.json", mcpLocations) {
  const servers = mcpDoc?.mcpServers || {};
  const keys = Object.keys(servers);
  if (!keys.length) return;

  findings.ok.push({ msg: `${keys.length} MCP server(s) in ${file}: ${keys.join(", ")}` });

  for (const [id, cfg] of Object.entries(servers)) {
    auditMcpEntry(id, cfg, catalog, findings, file, mcpLocations);
  }
}

function auditCrossAgentMcp(root, catalog, findings, mcpLocations) {
  const jsonConfigs = [
    [".cursor/mcp.json", "Cursor"],
    [".gemini/settings.json", "Gemini CLI"],
  ];
  for (const [rel, label] of jsonConfigs) {
    const path = resolve(root, rel);
    if (!existsSync(path)) continue;
    try {
      const doc = JSON.parse(readFileSync(path, "utf8"));
      const servers = doc.mcpServers || {};
      const keys = Object.keys(servers);
      if (!keys.length) continue;
      findings.ok.push({ msg: `${label}: ${keys.length} MCP server(s) in ${rel}` });
      for (const [id, cfg] of Object.entries(servers)) auditMcpEntry(id, cfg, catalog, findings, rel, mcpLocations);
    } catch {
      findings.fix.push({ msg: `${rel} is invalid JSON`, file: rel });
    }
  }

  const opencodePath = resolve(root, "opencode.json");
  if (existsSync(opencodePath)) {
    try {
      const doc = JSON.parse(readFileSync(opencodePath, "utf8"));
      const keys = Object.keys(doc.mcp || {});
      if (keys.length) {
        findings.ok.push({ msg: `opencode: ${keys.length} MCP server(s) in opencode.json` });
        for (const [id, cfg] of Object.entries(doc.mcp || {})) {
          auditMcpEntry(id, cfg, catalog, findings, "opencode.json", mcpLocations);
        }
      }
    } catch {
      findings.fix.push({ msg: "opencode.json is invalid JSON", file: "opencode.json" });
    }
  }

  const codexPath = resolve(root, ".codex/config.toml");
  if (existsSync(codexPath)) {
    const text = readFileSync(codexPath, "utf8");
    const names = [...text.matchAll(/^\[mcp_servers\.([^\]]+)\]/gm)].map((m) => m[1]);
    if (names.length) {
      findings.ok.push({ msg: `Codex: ${names.length} MCP server(s) in .codex/config.toml` });
      for (const id of names) trackMcp(id, ".codex/config.toml", mcpLocations);
    }
    if (text.includes("<your-") || text.includes("postgresql://localhost/mydb")) {
      findings.fix.push({ msg: "Codex config has placeholder values — fill in tokens/connection strings", file: ".codex/config.toml" });
    }
  }

  const openclawPath = openclawConfigPath();
  if (existsSync(openclawPath)) {
    try {
      const doc = JSON.parse(readFileSync(openclawPath, "utf8"));
      const servers = doc.mcp?.servers || {};
      const keys = Object.keys(servers);
      if (keys.length) {
        findings.ok.push({ msg: `OpenClaw: ${keys.length} MCP server(s) in ~/.openclaw/openclaw.json` });
        for (const [id, cfg] of Object.entries(servers)) auditMcpEntry(id, cfg, catalog, findings, "~/.openclaw/openclaw.json", mcpLocations);
      }
    } catch {
      findings.fix.push({ msg: "~/.openclaw/openclaw.json is invalid JSON", file: "~/.openclaw/openclaw.json" });
    }
  }
}

function trackMcp(id, file, mcpLocations) {
  if (!mcpLocations) return;
  if (!mcpLocations.has(id)) mcpLocations.set(id, new Set());
  mcpLocations.get(id).add(file);
}

function auditDuplicateMcp(mcpLocations, findings) {
  if (!mcpLocations) return;
  for (const [id, files] of mcpLocations) {
    if (files.size > 1) {
      findings.warn.push({
        msg: `MCP "${id}" appears in ${files.size} configs (${[...files].join(", ")}) — dedupe or keep in sync`,
      });
    }
  }
}

function auditMcpEntry(id, cfg, catalog, findings, file, mcpLocations) {
  trackMcp(id, file, mcpLocations);
  const known = catalog.byId.get(id);
  if (!known) {
    findings.warn.push({ msg: `MCP "${id}" is not in the Loadout catalog — verify it yourself`, file });
  }
  if (cfg?.env) {
    for (const [k, v] of Object.entries(cfg.env)) {
      if (typeof v === "string" && /<your-[^>]+>/.test(v)) {
        findings.fix.push({ msg: `Fill in ${k} for MCP "${id}"`, file });
      }
    }
  }
  const raw = JSON.stringify(cfg);
  const placeholders = raw.match(TOKEN_RE) || [];
  if (placeholders.length) {
    findings.fix.push({ msg: `Replace ${placeholders.join(", ")} for MCP "${id}"`, file });
  }
}

function auditTokens(mcpDoc, findings) {
  if (!mcpDoc) return;
  const blob = JSON.stringify(mcpDoc);
  if (blob.includes("postgresql://localhost/mydb")) {
    findings.fix.push({ msg: "Postgres MCP still points at placeholder localhost/mydb — set your connection string", file: ".mcp.json" });
  }
}

function auditHooks(settingsDoc, findings) {
  if (!settingsDoc?.hooks) return;

  const blob = JSON.stringify(settingsDoc).toLowerCase();
  const activeHookIds = new Set();

  if (blob.includes("prettier")) activeHookIds.add("format-js-on-edit");
  if (blob.includes("ruff")) activeHookIds.add("lint-python-on-edit");
  if (blob.includes("eslint")) activeHookIds.add("eslint-fix-on-edit");
  if (blob.includes("gofmt")) activeHookIds.add("gofmt-on-edit");
  if (blob.includes("rustfmt")) activeHookIds.add("rustfmt-on-edit");
  if (blob.includes("dangerous") || blob.includes("mkfs")) activeHookIds.add("guard-dangerous-bash");
  if (blob.includes("refusing to read") || blob.includes("secret")) activeHookIds.add("protect-secrets");
  if (blob.includes("waiting for you")) activeHookIds.add("notify-on-stop");
  if (blob.includes("push directly") || blob.includes("block-push")) activeHookIds.add("block-push-to-main");
  if (settingsDoc.statusLine) activeHookIds.add("statusline-git");

  if (activeHookIds.size) {
    findings.ok.push({ msg: `Hooks/settings active: ${[...activeHookIds].join(", ")}` });
  }

  const needed = new Set();
  for (const id of activeHookIds) {
    for (const [bin, hooks] of Object.entries(HOOK_DEPS)) {
      if (hooks.includes(id)) needed.add(bin);
    }
  }

  for (const bin of needed) {
    if (!commandExists(bin)) {
      // Missing tools are warnings: hooks no-op rather than corrupt config.
      findings.warn.push({
        msg: `"${bin}" not found on PATH — hooks that need it will no-op or fail`,
        file: ".claude/settings.json",
      });
    } else {
      findings.ok.push({ msg: `Hook dependency "${bin}" found on PATH` });
    }
  }
}

function auditSecurity(hasEnv, settingsDoc, findings) {
  if (!hasEnv) return;
  const blob = JSON.stringify(settingsDoc || {}).toLowerCase();
  if (blob.includes("refusing to read") || blob.includes("protect-secrets") || blob.includes(".env")) {
    findings.ok.push({ msg: "Secret-file guard hook appears configured (.env present)" });
  } else {
    findings.warn.push({
      id: "protect-secrets",
      msg: ".env exists but no protect-secrets hook — consider adding it so credentials stay out of context",
      file: ".claude/settings.json",
    });
  }
}

/** Surface catalog ids attached to fix/warn findings (e.g. protect-secrets) in suggestions. */
function enrichSuggestionsFromFindings(findings, catalog) {
  const existing = new Set((findings.suggestions || []).map((s) => s.id));
  const extra = [];
  for (const f of [...(findings.fix || []), ...(findings.warn || [])]) {
    if (!f.id || existing.has(f.id)) continue;
    const item = catalog.byId.get(f.id);
    if (!item) continue;
    existing.add(f.id);
    extra.push({
      id: item.id,
      name: item.name,
      type: item.type,
      tier: item.tier || "curated",
      reason: f.msg,
    });
  }
  if (extra.length) findings.suggestions = [...extra, ...(findings.suggestions || [])];
}

/** Built-in Claude Code commands are always available — not install gaps (except one-shot /init). */
function isDoctorGap(item) {
  const install = item.install || {};
  if (install.type === "builtin") return item.id === "init-claude-md";
  return true;
}

/** PATH tools required by a hook/setting that are not currently available. */
export function hookDepsMissing(itemId) {
  const missing = [];
  for (const [bin, ids] of Object.entries(HOOK_DEPS)) {
    if (ids.includes(itemId) && !commandExists(bin)) missing.push(bin);
  }
  return missing;
}

function isActionableDoctorGap(entry) {
  const item = entry.item;
  if (!isDoctorGap(item)) return false;
  // Don't suggest hooks that need tools the user doesn't have (e.g. statusline-git without jq).
  if ((item.type === "hook" || item.type === "setting") && hookDepsMissing(item.id).length) {
    return false;
  }
  return true;
}

function auditGaps(root, catalog, findings) {
  const signals = scanProject(root);
  const { domains, items } = recommend(catalog, signals, root);
  findings.domains = domains.map((d) => ({ id: d.id, title: d.title }));
  findings.signals = [...signals].filter((s) => s !== "always").sort();
  const matched = domains.filter((d) => d.id !== "general").map((d) => d.title);
  if (matched.length) {
    findings.ok.push({ msg: `Matched domains: ${matched.join(", ")}` });
  } else {
    findings.ok.push({ msg: "Matched domains: General only (no stack-specific signals)" });
  }
  const interesting = findings.signals.slice(0, 10);
  if (interesting.length) {
    findings.ok.push({ msg: `Detected signals: ${interesting.join(", ")}${findings.signals.length > 10 ? "…" : ""}` });
  }
  const gaps = items.filter(isActionableDoctorGap);
  const top = gaps.slice(0, 5);
  findings.suggestions = top.map(({ item, reason }) => ({
    id: item.id,
    name: item.name,
    type: item.type,
    tier: item.tier || "curated",
    reason,
  }));
  if (!top.length) {
    findings.ok.push({ msg: "Recommendation engine has no gaps — setup looks complete for this repo" });
    return;
  }
  const names = top.map((e) => e.item.name).join("; ");
  const hasAuto = top.some((e) => AUTO_APPLY_TYPES.has(e.item.type));
  const onlyPlugins = !hasAuto && top.every((e) => e.item.type === "skill" || e.item.type === "reference");
  findings.warn.push({
    msg: hasAuto
      ? `Loadout would still suggest: ${names} — run npx claude-loadout doctor --fix`
      : onlyPlugins
        ? `Optional plugins: ${names} — run npx claude-loadout doctor --fix for install steps`
        : `Loadout would still suggest: ${names} — run npx claude-loadout doctor --fix for skill install steps`,
  });
}

function commandExists(name) {
  try {
    const cmd = process.platform === "win32" ? `where ${name}` : `which ${name}`;
    execSync(cmd, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}
