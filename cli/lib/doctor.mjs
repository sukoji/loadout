import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { execSync } from "node:child_process";
import { loadCatalog } from "./catalog.mjs";
import { scanProject } from "./scan.mjs";
import { recommend } from "./recommend.mjs";

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
  const findings = { ok: [], warn: [], fix: [] };

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

  auditMcpServers(mcpDoc, catalog, findings);
  auditTokens(mcpDoc, findings);
  auditHooks(settingsDoc, findings);
  auditSecurity(hasEnv, settingsDoc, findings);
  auditGaps(root, catalog, findings);

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

function auditMcpServers(mcpDoc, catalog, findings) {
  const servers = mcpDoc?.mcpServers || {};
  const keys = Object.keys(servers);
  if (!keys.length) return;

  findings.ok.push({ msg: `${keys.length} MCP server(s) configured: ${keys.join(", ")}` });

  for (const [id, cfg] of Object.entries(servers)) {
    const known = catalog.byId.get(id);
    if (!known) {
      findings.warn.push({ msg: `MCP "${id}" is not in the Loadout catalog — verify it yourself`, file: ".mcp.json" });
    }
    if (cfg?.env) {
      for (const [k, v] of Object.entries(cfg.env)) {
        if (typeof v === "string" && TOKEN_RE.test(v)) {
          TOKEN_RE.lastIndex = 0;
          findings.fix.push({ msg: `Fill in ${k} for MCP "${id}"`, file: ".mcp.json" });
        }
      }
    }
    const raw = JSON.stringify(cfg);
    const placeholders = raw.match(TOKEN_RE) || [];
    if (placeholders.length) {
      findings.fix.push({ msg: `Replace ${placeholders.join(", ")} for MCP "${id}"`, file: ".mcp.json" });
    }
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
  if (blob.includes("push directly")) activeHookIds.add("block-push-to-main");
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
      findings.fix.push({
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
      msg: ".env exists but no protect-secrets hook — consider adding it so credentials stay out of context",
      file: ".claude/settings.json",
    });
  }
}

function auditGaps(root, catalog, findings) {
  const signals = scanProject(root);
  const { items } = recommend(catalog, signals, root);
  const top = items.slice(0, 5);
  if (!top.length) {
    findings.ok.push({ msg: "Recommendation engine has no gaps — setup looks complete for this repo" });
    return;
  }
  const names = top.map((e) => e.item.name).join("; ");
  findings.warn.push({
    msg: `Loadout would still suggest: ${names} — run npx claude-loadout --dry-run to review`,
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
