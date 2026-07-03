#!/usr/bin/env node
// Smoke-test curated MCP servers: stdio processes stay alive briefly; HTTP endpoints respond.
// Slow/network-heavy — skip in fast CI with SKIP_MCP_RUNTIME=1.
import { spawn, execSync } from "node:child_process";
import { loadCatalog } from "../cli/lib/catalog.mjs";

if (process.env.SKIP_MCP_RUNTIME === "1") {
  console.log("⏭  SKIP_MCP_RUNTIME=1 — skipping MCP runtime smoke tests");
  process.exit(0);
}

const { mcp } = loadCatalog();
const STARTUP_MS = 4000;
const HTTP_TIMEOUT_MS = 10000;
let failed = 0;
let skipped = 0;

for (const entry of mcp) {
  const cfg = entry.config || {};
  const raw = JSON.stringify(cfg);
  if (raw.includes("<your-") || raw.includes("postgresql://localhost/mydb")) {
    console.log(`  ~  ${entry.id.padEnd(18)} placeholder config — covered by npm run verify:mcp`);
    skipped++;
    continue;
  }
  if (cfg.type === "http" || cfg.url) {
    const r = await smokeHttp(cfg.url);
    logResult(entry.id, r);
    if (!r.ok) failed++;
    continue;
  }
  if (cfg.command === "uvx") {
    if (!commandExists("uvx") && !commandExists("uv")) {
      console.log(`  ~  ${entry.id.padEnd(18)} uvx not on PATH — verify manually (${entry.homepage})`);
      skipped++;
      continue;
    }
    const r = await smokeProcess("uvx", cfg.args || []);
    logResult(entry.id, r);
    if (!r.ok) failed++;
    continue;
  }
  if (cfg.command === "npx") {
    const r = await smokeProcess(cfg.command, cfg.args || []);
    logResult(entry.id, r);
    if (!r.ok) failed++;
    continue;
  }
  console.log(`  ~  ${entry.id.padEnd(18)} unknown command shape — verify at ${entry.homepage}`);
  skipped++;
}

console.log("");
if (failed) {
  console.error(`❌ ${failed} MCP smoke test(s) failed (${skipped} skipped)`);
  process.exit(1);
}
console.log(`✅ ${mcp.length - skipped - failed} MCP smoke test(s) passed (${skipped} skipped)`);

function logResult(id, { ok, note }) {
  console.log(`  ${ok ? "✅" : "❌"} ${id.padEnd(18)} ${note}`);
}

function smokeProcess(command, args) {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      stdio: ["ignore", "pipe", "pipe"],
      shell: false,
      env: { ...process.env, CI: "1" },
    });
    let stderr = "";
    child.stderr?.on("data", (d) => {
      stderr += d;
    });
    let settled = false;
    const finish = (ok, note) => {
      if (settled) return;
      settled = true;
      try {
        child.kill();
      } catch {
        /* ignore */
      }
      resolve({ ok, note });
    };

    const timer = setTimeout(() => finish(true, "process started"), STARTUP_MS);

    child.on("error", (err) => {
      clearTimeout(timer);
      finish(false, err.message);
    });

    child.on("exit", (code) => {
      clearTimeout(timer);
      if (settled) return;
      const errHint = stderr.split("\n")[0]?.slice(0, 80);
      if (code === 0) finish(true, "exited 0");
      else finish(false, `exit ${code}${errHint ? ` — ${errHint}` : ""}`);
    });
  });
}

async function smokeHttp(url) {
  try {
    const res = await fetch(url, {
      method: "GET",
      signal: AbortSignal.timeout(HTTP_TIMEOUT_MS),
      headers: { Accept: "application/json, text/event-stream, */*" },
    });
    // 401/403 still means the endpoint is reachable (OAuth-gated).
    const ok = res.status > 0 && res.status < 500;
    return { ok, note: `HTTP ${res.status}` };
  } catch (e) {
    return { ok: false, note: e.message };
  }
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
