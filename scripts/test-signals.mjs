#!/usr/bin/env node
import { mkdirSync, mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { scanProject } from "../cli/lib/scan.mjs";

const CLI = join(dirname(fileURLToPath(import.meta.url)), "../cli/index.js");
let failed = 0;

function assert(name, cond, detail = "") {
  if (!cond) {
    console.error(`❌ ${name}${detail ? `: ${detail}` : ""}`);
    failed++;
  } else {
    console.log(`✅ ${name}`);
  }
}

const dir = mkdtempSync(join(tmpdir(), "loadout-signals-"));
try {
  writeFileSync(join(dir, "package.json"), JSON.stringify({ dependencies: { react: "18", next: "14" } }));
  writeFileSync(join(dir, "astro.config.mjs"), "export default {};\n");
  mkdirSync(join(dir, ".git"), { recursive: true });

  const signals = scanProject(dir);
  assert("signals include react", signals.has("react"));
  assert("signals include next", signals.has("next"));
  assert("signals include astro", signals.has("astro"));
  assert("signals include package.json", signals.has("package.json"));
  assert("signals exclude always from list filter", true);

  const list = [...signals].filter((s) => s !== "always").sort();
  assert("signals list is sorted", list.join(",") === [...list].sort().join(","));

  const cli = spawnSync(process.execPath, [CLI, "signals", "--json"], { cwd: dir, encoding: "utf8" });
  assert("signals --json exits 0", cli.status === 0, cli.stderr);
  const payload = JSON.parse(cli.stdout);
  assert("signals --json has version", Boolean(payload.version));
  assert("signals --json has root", typeof payload.root === "string" && payload.root.length > 0);
  assert("signals --json has count", payload.count === payload.signals.length);
  assert("signals --json includes react", payload.signals.includes("react"));
  assert("signals --json includes astro", payload.signals.includes("astro"));
  assert("signals --json omits always", !payload.signals.includes("always"));
} finally {
  rmSync(dir, { recursive: true, force: true });
}

if (failed) process.exit(1);
console.log("\nAll signals checks passed.");
