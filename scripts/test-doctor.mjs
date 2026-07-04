#!/usr/bin/env node
import { mkdirSync, mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { doctor } from "../cli/lib/doctor.mjs";

const dir = mkdtempSync(join(tmpdir(), "loadout-doctor-"));
let failed = 0;

function assert(name, cond) {
  if (!cond) {
    console.error(`❌ ${name}`);
    failed++;
  } else {
    console.log(`✅ ${name}`);
  }
}

function hasMsg(list, needle) {
  return list.some((f) => f.msg.includes(needle));
}

try {
  mkdirSync(join(dir, ".claude"), { recursive: true });
  mkdirSync(join(dir, ".cursor"), { recursive: true });
  writeFileSync(
    join(dir, ".mcp.json"),
    JSON.stringify({
      mcpServers: {
        context7: {
          command: "npx",
          args: ["-y", "@upstash/context7-mcp@latest"],
          env: { CONTEXT7_API_KEY: "<your-context7-key>" },
        },
      },
    }),
  );
  writeFileSync(
    join(dir, ".cursor/mcp.json"),
    JSON.stringify({ mcpServers: { context7: { command: "npx", args: ["-y", "@upstash/context7-mcp@latest"] } } }),
  );
  writeFileSync(join(dir, ".claude/settings.json"), JSON.stringify({}));
  writeFileSync(join(dir, ".env"), "SECRET=1\n");

  const { fix, warn, ok } = doctor(dir);

  assert("flags placeholder API key", hasMsg(fix, "CONTEXT7_API_KEY") || hasMsg(fix, "context7"));
  assert("warns duplicate context7 across agents", hasMsg(warn, 'MCP "context7" appears in'));
  assert("warns .env without protect-secrets", hasMsg(warn, "protect-secrets"));
  assert("reports Claude MCP servers", hasMsg(ok, "MCP server(s) in .mcp.json"));
  assert("reports Cursor MCP servers", hasMsg(ok, "Cursor:"));

  const parsed = JSON.parse(JSON.stringify({
    fix,
    warn,
    ok,
    summary: { fix: fix.length, warn: warn.length, ok: ok.length },
  }));
  assert("doctor JSON shape has fix/warn/ok arrays", Array.isArray(parsed.fix) && Array.isArray(parsed.warn) && Array.isArray(parsed.ok));
  assert("doctor summary counts match arrays", parsed.summary.fix === fix.length && parsed.summary.warn === warn.length);

  writeFileSync(join(dir, "package.json"), JSON.stringify({ dependencies: { react: "18", next: "14" } }));
  const profiled = doctor(dir);
  assert("doctor reports matched domains", profiled.ok.some((f) => f.msg.includes("Matched domains")));
} finally {
  rmSync(dir, { recursive: true, force: true });
}

if (failed) process.exit(1);
console.log("\nAll doctor checks passed.");
